"""Market data via direct Yahoo Finance REST API (v8 chart endpoint).
No yfinance dependency — direct HTTP is more reliable in cloud environments.
Falls back gracefully: the caller catches exceptions and serves seed data."""

from __future__ import annotations
import os
import datetime
import urllib.parse
import requests
from api.models import MarketSnapshot, PricePoint, QuoteLite
from api.agent.stats import compute_market_stats

YAHOO_V8      = "https://query1.finance.yahoo.com/v8/finance/chart"
_HEADERS      = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}

GOLD_SYMBOL   = os.getenv("GOLD_SYMBOL",   "GC=F")
DXY_SYMBOL    = os.getenv("DXY_SYMBOL",    "DX-Y.NYB")
TNX_SYMBOL    = os.getenv("TNX_SYMBOL",    "^TNX")
USDINR_SYMBOL = os.getenv("USDINR_SYMBOL", "USDINR=X")
HISTORY_DAYS  = int(os.getenv("HISTORY_DAYS", "400"))


def _chart(symbol: str, *, range_str: str = "5d", interval: str = "1d") -> dict:
    url = f"{YAHOO_V8}/{urllib.parse.quote(symbol, safe='')}"
    r   = requests.get(url, params={"interval": interval, "range": range_str},
                       headers=_HEADERS, timeout=20)
    r.raise_for_status()
    result = r.json()["chart"]["result"]
    if not result:
        raise ValueError(f"No chart data for {symbol}")
    return result[0]


def _safe_quote(symbol: str) -> QuoteLite | None:
    try:
        res   = _chart(symbol, range_str="5d")
        meta  = res["meta"]
        price = float(meta["regularMarketPrice"])
        prev  = float(meta.get("previousClose") or meta.get("chartPreviousClose") or price)
        chg   = ((price / prev) - 1) * 100 if prev else 0.0
        return QuoteLite(value=round(price, 4), changePct=round(chg, 4))
    except Exception:
        return None


def _fetch_usd_inr() -> float | None:
    try:
        meta = _chart(USDINR_SYMBOL, range_str="5d")["meta"]
        return round(float(meta["regularMarketPrice"]), 4)
    except Exception:
        return None


def fetch_history(symbol: str = GOLD_SYMBOL, days: int = HISTORY_DAYS) -> list[PricePoint]:
    range_str = "2y" if days <= 730 else "5y"
    res        = _chart(symbol, range_str=range_str)
    timestamps = res["timestamp"]
    highs      = res["indicators"]["quote"][0]["high"]

    cutoff = datetime.date.today() - datetime.timedelta(days=days)
    points: list[PricePoint] = []
    for ts, price in zip(timestamps, highs):
        if price is None:
            continue
        d = datetime.date.fromtimestamp(ts)
        if d >= cutoff:
            points.append(PricePoint(date=str(d), price=round(float(price), 2)))

    if len(points) < 2:
        raise ValueError(f"Insufficient history for {symbol} ({len(points)} points)")
    return sorted(points, key=lambda p: p.date)


def fetch_market() -> MarketSnapshot:
    history = fetch_history(GOLD_SYMBOL)
    stats   = compute_market_stats(history)
    spot    = _safe_quote(GOLD_SYMBOL)
    dxy     = _safe_quote(DXY_SYMBOL)
    y10     = _safe_quote(TNX_SYMBOL)
    usd_inr = _fetch_usd_inr()

    price = spot.value if spot else stats.price

    return MarketSnapshot(
        asset="Gold",
        symbol=GOLD_SYMBOL,
        price=price,
        asOf=datetime.datetime.utcnow().isoformat() + "Z",
        history=history,
        changePct1d=spot.changePct if spot else stats.changePct1d,
        high52=stats.high52,
        low52=stats.low52,
        dailyVolPct=stats.dailyVolPct,
        annVolPct=stats.annVolPct,
        ma50=stats.ma50,
        ma200=stats.ma200,
        momentumPct=stats.momentumPct,
        drawdownPct=stats.drawdownPct,
        dxy=dxy,
        yield10y=y10,
        usd_inr=usd_inr,
        stale=False,
    )
