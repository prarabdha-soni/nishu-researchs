"""Price ingest via direct Yahoo Finance REST API (v8 chart endpoint).
Stores every fetch as a DataPoint with full provenance."""

from __future__ import annotations
import os
import datetime
import urllib.parse
import requests
from sqlalchemy.orm import Session
from api.services.data_service import write_point

YAHOO_V8 = "https://query1.finance.yahoo.com/v8/finance/chart"
_HEADERS  = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}

# Symbol → (series_name, unit, display_label, yahoo_url)
PRICE_SYMBOLS: dict[str, tuple[str, str, str, str]] = {
    "GC=F":      ("gold_spot",   "USD/oz",  "Gold (COMEX front-month)",     "https://finance.yahoo.com/quote/GC%3DF/"),
    "SI=F":      ("silver_spot", "USD/oz",  "Silver (COMEX front-month)",   "https://finance.yahoo.com/quote/SI%3DF/"),
    "DX-Y.NYB":  ("dxy",        "index",   "US Dollar Index (DXY)",        "https://finance.yahoo.com/quote/DX-Y.NYB/"),
    "^TNX":      ("yield_10y",   "%",       "10-Year Treasury Yield",       "https://finance.yahoo.com/quote/%5ETNX/"),
    "^GSPC":     ("spx",        "index",   "S&P 500 Index",               "https://finance.yahoo.com/quote/%5EGSPC/"),
}

SOURCE = "Yahoo Finance"


def _fetch_closes(symbol: str, days: int = 5) -> list[tuple[str, float]]:
    encoded = urllib.parse.quote(symbol, safe="")
    r = requests.get(
        f"{YAHOO_V8}/{encoded}",
        params={"interval": "1d", "range": "1mo"},
        headers=_HEADERS,
        timeout=20,
    )
    r.raise_for_status()
    result = r.json()["chart"]["result"]
    if not result:
        return []

    res        = result[0]
    timestamps = res["timestamp"]
    closes     = res["indicators"]["quote"][0]["close"]

    cutoff = datetime.date.today() - datetime.timedelta(days=days + 5)
    points: list[tuple[str, float]] = []
    for ts, c in zip(timestamps, closes):
        if c is None:
            continue
        d = datetime.date.fromtimestamp(ts)
        if d >= cutoff:
            points.append((str(d), float(c)))
    return points


def ingest_prices(db: Session, days: int = 5) -> dict[str, int]:
    """Fetch recent closes for all price symbols. Returns {series: rows_written}."""
    result: dict[str, int] = {}
    for symbol, (series, unit, _label, url) in PRICE_SYMBOLS.items():
        try:
            closes = _fetch_closes(symbol, days=days)
            count  = 0
            for date_str, value in closes:
                write_point(
                    db,
                    series=series,
                    value=round(value, 4),
                    unit=unit,
                    source=SOURCE,
                    source_url=url,
                    asof=f"{date_str}T16:00:00Z",
                    meta={"symbol": symbol},
                )
                count += 1
            result[series] = count
        except Exception as e:
            print(f"[prices] {symbol}: {e}")
            result[series] = 0
    return result


def ingest_mcx(db: Session) -> int:
    """MCX gold futures. Returns rows written."""
    symbol = os.getenv("MCX_GOLD_SYMBOL", "GOLDM.MCX")
    url    = f"https://finance.yahoo.com/quote/{symbol}/"
    try:
        closes = _fetch_closes(symbol, days=5)
        for date_str, value in closes:
            write_point(
                db,
                series="mcx_gold",
                value=round(value, 2),
                unit="INR/10g",
                source=SOURCE,
                source_url=url,
                asof=f"{date_str}T15:30:00Z",
                meta={"symbol": symbol},
            )
        return len(closes)
    except Exception as e:
        print(f"[prices] MCX: {e}")
        return 0
