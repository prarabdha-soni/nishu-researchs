"""Price ingest — stores every fetch as a DataPoint with full provenance.

Yahoo Finance is the source for spot prices. Every row gets the Yahoo
Finance URL for that symbol so users can click through. We store daily
closes (not ticks) — provenance is the exchange close, not a snapshot."""

from __future__ import annotations
import datetime
import yfinance as yf
from sqlalchemy.orm import Session
from api.services.data_service import write_point

# Symbol → (series_name, unit, display_label, yahoo_url)
PRICE_SYMBOLS: dict[str, tuple[str, str, str, str]] = {
    "GC=F":    ("gold_spot",   "USD/oz",  "Gold (COMEX front-month)",     "https://finance.yahoo.com/quote/GC%3DF/"),
    "SI=F":    ("silver_spot", "USD/oz",  "Silver (COMEX front-month)",   "https://finance.yahoo.com/quote/SI%3DF/"),
    "DX-Y.NYB":("dxy",        "index",   "US Dollar Index (DXY)",        "https://finance.yahoo.com/quote/DX-Y.NYB/"),
    "^TNX":    ("yield_10y",   "%",       "10-Year Treasury Yield",       "https://finance.yahoo.com/quote/%5ETNX/"),
    "^GSPC":   ("spx",        "index",   "S&P 500 Index",               "https://finance.yahoo.com/quote/%5EGSPC/"),
}

SOURCE = "Yahoo Finance"


def _fetch_closes(symbol: str, days: int = 5) -> list[tuple[str, float]]:
    end   = datetime.date.today()
    start = end - datetime.timedelta(days=days + 5)
    df = yf.download(symbol, start=str(start), end=str(end), progress=False, auto_adjust=True)
    if df.empty:
        return []
    closes = df["Close"].dropna()
    return [(str(idx.date()), float(val)) for idx, val in closes.items()]


def ingest_prices(db: Session, days: int = 5) -> dict[str, int]:
    """Fetch recent closes for all price symbols. Returns {series: rows_written}."""
    result: dict[str, int] = {}
    for symbol, (series, unit, _label, url) in PRICE_SYMBOLS.items():
        try:
            closes = _fetch_closes(symbol, days=days)
            count  = 0
            for date_str, value in closes:
                asof = f"{date_str}T16:00:00Z"  # NYSE close approximation
                write_point(
                    db,
                    series=series,
                    value=round(value, 4),
                    unit=unit,
                    source=SOURCE,
                    source_url=url,
                    asof=asof,
                    meta={"symbol": symbol},
                )
                count += 1
            result[series] = count
        except Exception as e:
            print(f"[prices] {symbol}: {e}")
            result[series] = 0
    return result


def ingest_mcx(db: Session) -> int:
    """MCX gold — uses Yahoo Finance MCX ticker. Returns rows written."""
    # MCX gold futures: GOLDM.MCX on Yahoo Finance
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
                asof=f"{date_str}T15:30:00Z",  # MCX close
                meta={"symbol": symbol},
            )
        return len(closes)
    except Exception as e:
        print(f"[prices] MCX: {e}")
        return 0


import os
