"""S1 — Live market data via yfinance. GC=F gold, DX-Y.NYB DXY, ^TNX 10Y yield.
Falls back gracefully: the caller catches exceptions and serves seed data."""

from __future__ import annotations
import os
import datetime
import yfinance as yf
from api.models import MarketSnapshot, PricePoint, QuoteLite
from api.agent.stats import compute_market_stats

GOLD_SYMBOL = os.getenv("GOLD_SYMBOL", "GC=F")
DXY_SYMBOL  = os.getenv("DXY_SYMBOL",  "DX-Y.NYB")
TNX_SYMBOL  = os.getenv("TNX_SYMBOL",  "^TNX")
HISTORY_DAYS = int(os.getenv("HISTORY_DAYS", "400"))


def _safe_quote(symbol: str) -> QuoteLite | None:
    try:
        t = yf.Ticker(symbol)
        info = t.fast_info
        price = getattr(info, "last_price", None) or getattr(info, "regularMarketPrice", None)
        prev  = getattr(info, "previous_close", None) or price
        if not price:
            return None
        chg = ((price / prev - 1) * 100) if prev else 0.0
        return QuoteLite(value=round(price, 4), changePct=round(chg, 4))
    except Exception:
        return None


def fetch_history(symbol: str = GOLD_SYMBOL, days: int = HISTORY_DAYS) -> list[PricePoint]:
    end = datetime.date.today()
    start = end - datetime.timedelta(days=days)
    df = yf.download(symbol, start=str(start), end=str(end), progress=False, auto_adjust=True)
    if df.empty:
        raise ValueError(f"No data returned for {symbol}")
    closes = df["Close"].dropna()
    return [
        PricePoint(date=str(idx.date()), price=round(float(val), 2))
        for idx, val in closes.items()
    ]


def fetch_market() -> MarketSnapshot:
    history = fetch_history(GOLD_SYMBOL)
    if len(history) < 2:
        raise ValueError("Insufficient gold history from Yahoo Finance")

    stats = compute_market_stats(history)
    spot = _safe_quote(GOLD_SYMBOL)
    dxy  = _safe_quote(DXY_SYMBOL)
    y10  = _safe_quote(TNX_SYMBOL)

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
        stale=False,
    )
