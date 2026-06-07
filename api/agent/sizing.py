"""Position sizing — S6."""

from __future__ import annotations
from api.models import BookSlice, LadderRung, Stance
from api.agent.util import round_to


def build_ladder(dip_level: float, add_size: int) -> list[LadderRung]:
    return [
        LadderRung(px=round_to(dip_level, 5),        size=add_size,               tag="Primary dip-add · armed"),
        LadderRung(px=round_to(dip_level * 0.98, 5), size=max(5, add_size - 5),   tag="Second rung"),
        LadderRung(px=round_to(dip_level * 0.96, 5), size=max(5, add_size - 10),  tag="Capitulation rung"),
    ]


def build_book(stance: Stance) -> list[BookSlice]:
    if stance == "Bullish":
        return [
            BookSlice(k="Core long",            w=55, key="up"),
            BookSlice(k="Tactical dry powder",  w=35, key="gold"),
            BookSlice(k="Tail hedge",           w=10, key="faint"),
        ]
    if stance == "Bearish":
        return [
            BookSlice(k="Core long",            w=30, key="up"),
            BookSlice(k="Tactical dry powder",  w=40, key="gold"),
            BookSlice(k="Tail hedge",           w=30, key="faint"),
        ]
    return [
        BookSlice(k="Core long",            w=45, key="up"),
        BookSlice(k="Tactical dry powder",  w=40, key="gold"),
        BookSlice(k="Tail hedge",           w=15, key="faint"),
    ]
