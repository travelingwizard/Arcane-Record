#!/usr/bin/env python3
"""Generate the checked-in Earthdawn spell catalog from the reference workbook."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import openpyxl


SOURCE_IDS = {
    1: "ed4.deeper-secrets",
    2: "ed4.players-guide",
    3: "ed4.mystic-paths",
    4: "ed4.iopos",
    5: "ed4.travar",
}
ORDINALS = {
    "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5,
    "sixth": 6, "seventh": 7, "eighth": 8, "ninth": 9, "tenth": 10,
    "eleventh": 11, "twelfth": 12, "thirteenth": 13,
    "fourteenth": 14, "fifteenth": 15,
}


def text(value: object) -> str:
    return str(value).strip() if value is not None else ""


def circle_range(value: str) -> tuple[int, int]:
    normalized = value.lower().strip()
    ordinal = re.fullmatch(r"([a-z]+) circle", normalized)
    if ordinal and ordinal.group(1) in ORDINALS:
        value = ORDINALS[ordinal.group(1)]
        return value, value
    numbers = [int(item) for item in re.findall(r"\d+", normalized)]
    if not numbers or any(item < 1 or item > 15 for item in numbers):
        raise ValueError(f"Unsupported Circle value: {value!r}")
    return min(numbers), max(numbers)


def citations(value: str) -> list[dict[str, object]]:
    pattern = re.compile(
        r"(?:^|,\s*)([1-5])(?:\s*,?\s*(?:page|p\.)\s*(\d+)(?:-(\d+))?)?",
        re.IGNORECASE,
    )
    result = []
    for match in pattern.finditer(value):
        source_number = int(match.group(1))
        start = int(match.group(2)) if match.group(2) else None
        end = int(match.group(3)) if match.group(3) else start
        result.append({
            "sourceId": SOURCE_IDS[source_number],
            "pageStart": start,
            "pageEnd": end,
        })
    if not result:
        raise ValueError(f"Unsupported source citation: {value!r}")
    return result


def difficulty_values(value: str) -> dict[str, object]:
    result: dict[str, object] = {"difficultyText": value}
    weaving = re.search(r"Weaving:\s*(\d+)\s*/\s*(\d+)(?!\s*to)", value, re.I)
    if weaving:
        result["weavingDifficulty"] = int(weaving.group(1))
        result["reattuningDifficulty"] = int(weaving.group(2))
    casting = re.search(r"Casting:\s*(\d+)\s*$", value, re.I)
    if casting:
        result["castingDifficulty"] = int(casting.group(1))
    return result


def legacy_names(path: Path) -> set[str]:
    source = path.read_text(encoding="utf-8")
    return set(re.findall(r"^\s*\['([^']+)',\s*'[^']+',\s*\d+,\s*\d+\],?$", source, re.M))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument(
        "--legacy-spells",
        type=Path,
        default=Path("src/games/earthdawn4e/core-spells.ts"),
    )
    args = parser.parse_args()

    workbook = openpyxl.load_workbook(args.workbook, read_only=True, data_only=True)
    sheet = workbook["Table 1"]
    expected = ["name", "description", "effect", "threads", "difficulty", "circle", "discipline", "Source"]
    headers = [text(cell.value) for cell in next(sheet.iter_rows(min_row=1, max_row=1))]
    if headers != expected:
        raise ValueError(f"Unexpected workbook headers: {headers!r}")

    legacy = legacy_names(args.legacy_spells)
    records = []
    seen: set[str] = set()
    for row_number, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
        name, description, effect, threads, difficulty, circle, discipline, source = map(text, row)
        if name in seen:
            raise ValueError(f"Duplicate spell name at row {row_number}: {name}")
        seen.add(name)
        minimum, maximum = circle_range(circle)
        source_citations = citations(source)
        disciplines = [item.strip() for item in discipline.split(",") if item.strip()]
        variants = []
        for citation in source_citations:
            for discipline_name in disciplines:
                variants.append({
                    "discipline": discipline_name,
                    "circleMin": minimum,
                    "circleMax": maximum,
                    "circleText": circle,
                    "sourceId": citation["sourceId"],
                    "pageStart": citation["pageStart"],
                    "pageEnd": citation["pageEnd"],
                })
        exact_threads = int(threads) if re.fullmatch(r"\d+", threads) else None
        records.append({
            "name": name,
            "description": description,
            "effectText": effect,
            "threadsText": threads,
            "threadsValue": exact_threads,
            **difficulty_values(difficulty),
            "aliases": [],
            "legacyPlayerGuideId": name in legacy,
            "variants": variants,
        })

    if len(records) != 464:
        raise ValueError(f"Expected 464 spells, found {len(records)}")
    payload = json.dumps(records, ensure_ascii=False, indent=2)
    output = (
        "// Generated by scripts/import-earthdawn-spells.py. Do not edit by hand.\n"
        "import type { EarthdawnSpellReference } from './spell-types';\n\n"
        f"export const earthdawnSpellReference = {payload} as const satisfies readonly EarthdawnSpellReference[];\n"
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output, encoding="utf-8")
    print(f"Generated {len(records)} spells at {args.output}")


if __name__ == "__main__":
    main()
