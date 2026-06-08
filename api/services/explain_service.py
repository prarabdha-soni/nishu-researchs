"""Daily explanation engine — DeepSeek grounds every claim in a DataPoint ID.

The provenance rule is enforced in two places:
  1. The system prompt forbids the model from emitting numbers not in the
     provided data rows.
  2. validate_explanation() checks every evidence_id exists in the DB
     before we store the result. If any ID is missing, we reject the output.

DeepSeek API is OpenAI-compatible. Set DEEPSEEK_API_KEY in env.
Model: deepseek-chat (V3) for daily runs — cheap, fast, grounded."""

from __future__ import annotations
import json
import os
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from api.db import Explanation, Scenario
from api.services.data_service import (
    snapshot_context, upcoming_catalysts, validate_ids, write_point,
)

DEEPSEEK_API_KEY  = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = "https://api.deepseek.com"
DEEPSEEK_MODEL    = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

_SYSTEM = """You are Nishu, a gold-market research engine. Your job is to write
a daily causal note explaining what drove gold prices and what the next catalyst
scenarios look like.

HARD RULES — violating any rule makes the output invalid:
1. You may ONLY reference numbers from the data rows provided. Do not invent,
   estimate, or recall any value from memory.
2. Every claim in "evidence_ids" must be the exact "id" field from a provided
   data row. If you cannot support a claim with a provided row, omit the claim.
3. Probabilities in scenarios must sum to 1.0 across branches.
4. Output ONLY valid JSON matching the schema below. No prose outside the JSON.

OUTPUT SCHEMA:
{
  "headline": "one-line summary (≤120 chars)",
  "summary": "2–3 sentence plain-English explanation",
  "drivers": [
    {
      "rank": 1,
      "driver": "macro | mechanical | positioning | geopolitical | narrative",
      "claim": "specific causal statement",
      "evidence_ids": ["<exact id from data rows>", ...],
      "magnitude_attribution_pct": <float, signed % move attributed>,
      "chain": "A → B → C → gold moves X%"
    }
  ],
  "scenarios": [
    {
      "catalyst_id": "<id from catalysts list>",
      "label": "branch label e.g. Soft / Hot / Dovish",
      "probability": <0..1>,
      "predicted_move_lo": <float %>,
      "predicted_move_hi": <float %>,
      "driver": "macro | ...",
      "if_then": "If <condition> → <expected gold reaction>"
    }
  ]
}"""


def _build_user_prompt(data_rows: list[dict], catalysts: list[dict]) -> str:
    rows_json = json.dumps(data_rows, indent=2)
    cats_json = json.dumps(catalysts, indent=2)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"""Today is {today}.

DATA ROWS (use only these — reference by id):
{rows_json}

UPCOMING CATALYSTS:
{cats_json}

Write the daily gold research note. Reference data row IDs. Follow the schema exactly."""


def _call_deepseek(prompt: str) -> dict:
    if not DEEPSEEK_API_KEY:
        raise ValueError("DEEPSEEK_API_KEY not set")
    import urllib.request
    payload = json.dumps({
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": _SYSTEM},
            {"role": "user",   "content": prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
    }).encode()
    req = urllib.request.Request(
        f"{DEEPSEEK_BASE_URL}/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type":  "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = json.loads(resp.read())
    content = body["choices"][0]["message"]["content"]
    return json.loads(content)


def validate_explanation(db: Session, raw: dict) -> tuple[bool, list[str]]:
    """Check every evidence_id in every driver claim exists in the DB."""
    all_ids: list[str] = []
    for driver in raw.get("drivers", []):
        all_ids.extend(driver.get("evidence_ids", []))
    if not all_ids:
        return True, []
    return validate_ids(db, all_ids)


def run_explanation(db: Session, catalyst_id: str | None = None) -> Explanation:
    """Generate, validate, and store today's explanation. Raises on provenance failure."""
    data_rows = snapshot_context(db)
    if not data_rows:
        raise ValueError("No sourced data in store — run ingest first")

    cats = [
        {"id": c.id, "date": c.date, "label": c.label, "driver": c.driver,
         "source": c.source, "source_url": c.source_url}
        for c in upcoming_catalysts(db, limit=4)
    ]

    prompt = _build_user_prompt(data_rows, cats)
    raw    = _call_deepseek(prompt)

    ok, missing = validate_explanation(db, raw)
    if not ok:
        raise ValueError(
            f"Provenance check failed — model referenced non-existent IDs: {missing}"
        )

    asof = datetime.now(timezone.utc).isoformat()
    exp  = Explanation(
        asof=asof,
        catalyst_id=catalyst_id,
        headline=raw.get("headline", ""),
        body=json.dumps(raw),
        model=DEEPSEEK_MODEL,
    )
    db.add(exp)
    db.flush()

    # Store each scenario in the calibration ledger
    for s in raw.get("scenarios", []):
        prob = float(s.get("probability", 0))
        scen = Scenario(
            catalyst_id=s.get("catalyst_id") or catalyst_id or "unknown",
            explanation_id=exp.id,
            label=s.get("label", ""),
            probability=prob,
            predicted_move_lo=s.get("predicted_move_lo"),
            predicted_move_hi=s.get("predicted_move_hi"),
            driver=s.get("driver", "macro"),
            if_then=s.get("if_then"),
        )
        db.add(scen)

    db.flush()
    return exp


def latest_explanation(db: Session) -> Explanation | None:
    return (
        db.query(Explanation)
        .order_by(Explanation.created_at.desc())
        .first()
    )
