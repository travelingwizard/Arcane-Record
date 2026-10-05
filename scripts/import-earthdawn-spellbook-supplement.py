#!/usr/bin/env python3
"""Generate the checked-in Earthdawn spellbook supplement."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import openpyxl


SOURCE_IDS = {1: "ed4.players-guide", 2: "ed4.deeper-secrets"}
ORDINALS = {
    "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5,
    "sixth": 6, "seventh": 7, "eighth": 8, "ninth": 9, "tenth": 10,
    "eleventh": 11, "twelfth": 12, "thirteenth": 13,
    "fourteenth": 14, "fifteenth": 15,
}
EXPECTED_HEADERS = [
    "Spell Name", "Discipline and Circle", "Threads",
    "Weaving and casting difficulties", "Range, duration, and area",
    "Effect and detailed mechanics", "Keywords",
    "Success levels and extra-thread options, if any", "Source",
]


def text(value: object) -> str:
    return str(value).strip() if value is not None else ""


def discipline_circle(value: str) -> tuple[str, int]:
    match = re.fullmatch(r"(.+?),\s*(?:(\w+)\s+Circle|Circle\s+(\d+))", value, re.I)
    if not match:
        raise ValueError(f"Unsupported discipline/Circle value: {value!r}")
    word = (match.group(2) or "").lower()
    circle = int(match.group(3)) if match.group(3) else ORDINALS.get(word)
    if not circle or not 1 <= circle <= 15:
        raise ValueError(f"Unsupported Circle value: {value!r}")
    return match.group(1).strip(), circle


def source_citation(name: str, value: str) -> tuple[str, int]:
    number_match = re.match(r"([12])\b", value)
    if not number_match:
        raise ValueError(f"Unsupported source citation for {name}: {value!r}")
    source_number = int(number_match.group(1))
    page_match = re.search(r"Pages?\s+(\d+)", value, re.I)
    if name == "True Blazing Fists of Rage":
        return SOURCE_IDS[2], 59
    if not page_match:
        raise ValueError(f"Missing page citation for {name}: {value!r}")
    return SOURCE_IDS[source_number], int(page_match.group(1))


def range_parts(value: str) -> tuple[str, str, str]:
    match = re.fullmatch(
        r"Range:\s*(.*?)\s*,?\s*Duration:\s*(.*?)(?:\s*,?\s*Area of Effect:\s*(.*))?",
        value,
        re.I,
    )
    if not match:
        raise ValueError(f"Unsupported range/duration value: {value!r}")
    area = text(match.group(3))
    if area.lower() == "not in source":
        area = ""
    return text(match.group(1)), text(match.group(2)), area


def success_parts(value: str) -> tuple[str, str]:
    match = re.fullmatch(
        r"Success Levels:\s*(.*?)\s*Extra Threads(?: Options)?:\s*(.*)",
        value,
        re.I,
    )
    if not match:
        raise ValueError(f"Unsupported success/extra-thread value: {value!r}")
    success = text(match.group(1))
    return ("" if success.lower() == "none." else success, text(match.group(2)))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    workbook = openpyxl.load_workbook(args.workbook, read_only=True, data_only=True)
    sheet = workbook["Table 1"]
    headers = [text(cell.value) for cell in next(sheet.iter_rows(min_row=1, max_row=1))]
    if headers != EXPECTED_HEADERS:
        raise ValueError(f"Unexpected workbook headers: {headers!r}")

    records = []
    seen: set[str] = set()
    for row_number, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
        (
            name, discipline_value, threads_value, difficulty, range_value,
            mechanics, keywords_value, success_value, source_value,
        ) = map(text, row)
        if not name or name in seen:
            raise ValueError(f"Missing or duplicate spell name at row {row_number}: {name!r}")
        seen.add(name)
        discipline, circle = discipline_circle(discipline_value)
        source_id, page = source_citation(name, source_value)
        range_text, duration_text, area = range_parts(range_value)
        success_levels, extra_threads = success_parts(success_value)
        weaving = re.search(r"Weaving:\s*(\d+)\s*/\s*(\d+)", difficulty, re.I)
        if not weaving:
            raise ValueError(f"Unsupported difficulty for {name}: {difficulty!r}")
        casting_match = re.search(r"Casting:\s*(.*)$", difficulty, re.I)
        casting_text = text(casting_match.group(1)) if casting_match else ""
        threads = int(threads_value) if re.fullmatch(r"\d+", threads_value) else None
        keywords = [] if keywords_value.lower() == "not in source" else [
            item.strip() for item in re.split(r",|\bor\b", keywords_value) if item.strip()
        ]
        effect_text = mechanics
        if name == "True Blazing Fists of Rage":
            effect_text = "WIL+4 Mystic damage; +2 to the next Attack or Spellcasting test. " + mechanics
            keywords = ["Illusion"]
        records.append({
            "name": name,
            "description": mechanics,
            "effectText": effect_text,
            "threadsText": threads_value,
            "threadsValue": threads,
            "difficultyText": difficulty,
            "weavingDifficulty": int(weaving.group(1)),
            "reattuningDifficulty": int(weaving.group(2)),
            "castingText": casting_text,
            "rangeText": range_text,
            "durationText": duration_text,
            "area": area,
            "keywords": keywords,
            "detailedEffects": mechanics,
            "successLevels": success_levels,
            "extraThreads": extra_threads,
            "aliases": ["Missiles"] if name == "Illusory Missiles" else [],
            "legacyPlayerGuideId": False,
            "variants": [{
                "discipline": discipline,
                "circleMin": circle,
                "circleMax": circle,
                "circleText": f"Circle {circle}",
                "sourceId": source_id,
                "pageStart": page,
                "pageEnd": page,
            }],
        })

    if len(records) != 15:
        raise ValueError(f"Expected 15 supplement spells, found {len(records)}")
    payload = json.dumps(records, ensure_ascii=False, indent=2)
    output = (
        "// Generated by scripts/import-earthdawn-spellbook-supplement.py. Do not edit by hand.\n"
        "import type { EarthdawnSpellReference } from './spell-types';\n\n"
        f"export const earthdawnSpellbookSupplement = {payload} as const satisfies readonly EarthdawnSpellReference[];\n"
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output, encoding="utf-8")
    print(f"Generated {len(records)} spellbook entries at {args.output}")


if __name__ == "__main__":
    main()
