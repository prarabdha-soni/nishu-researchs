"""BLS calendar adapter — CPI and NFP release dates with official source URLs.

BLS publishes release schedules at:
  CPI:  https://www.bls.gov/schedule/news_release/cpi.htm
  NFP:  https://www.bls.gov/schedule/news_release/empsit.htm

We store each scheduled release as a DbCatalyst so the explanation engine
can reference official calendar provenance, not our computed approximations."""

from __future__ import annotations
import re
import requests
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from api.services.data_service import write_catalyst

BLS_CPI_URL  = "https://www.bls.gov/schedule/news_release/cpi.htm"
BLS_NFP_URL  = "https://www.bls.gov/schedule/news_release/empsit.htm"
BLS_SOURCE   = "BLS · Bureau of Labor Statistics"


def _parse_bls_dates(url: str, label_prefix: str) -> list[tuple[str, str]]:
    """Scrape release dates from a BLS schedule page. Returns [(date_iso, label)]."""
    try:
        r = requests.get(url, timeout=10, headers={"User-Agent": "nishu-research/1.0"})
        r.raise_for_status()
    except Exception:
        return []

    # BLS schedule pages have dates like "Wednesday, June 11, 2026"
    pattern = re.compile(
        r"(?:Monday|Tuesday|Wednesday|Thursday|Friday),\s+"
        r"(\w+ \d{1,2}, \d{4})"
    )
    dates = []
    for m in pattern.finditer(r.text):
        try:
            d = datetime.strptime(m.group(1), "%B %d, %Y")
            label = f"{label_prefix} · {d.strftime('%b %Y')}"
            dates.append((d.strftime("%Y-%m-%d"), label))
        except ValueError:
            continue
    return dates


def ingest_bls_calendar(db: Session) -> int:
    """Sync upcoming BLS release dates into the catalysts table. Returns count written."""
    today = datetime.now(timezone.utc).date().isoformat()
    count = 0

    for url, driver, prefix in [
        (BLS_CPI_URL, "macro", "CPI release"),
        (BLS_NFP_URL, "macro", "NFP · jobs report"),
    ]:
        for date_iso, label in _parse_bls_dates(url, prefix):
            if date_iso < today:
                continue
            cat_id = f"bls-{driver}-{date_iso}"
            write_catalyst(
                db,
                id=cat_id,
                date=date_iso,
                label=label,
                driver=driver,
                source=BLS_SOURCE,
                source_url=url,
            )
            count += 1

    return count
