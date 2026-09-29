#!/usr/bin/env python3
"""Generate the checked-in Earthdawn knack catalog from the reference workbook."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

from openpyxl import load_workbook


SOURCE_IDS = {
    1: "ed4.companion",
    2: "ed4.vasgothia",
    3: "ed4.mystic-paths",
    4: "ed4.travar",
    5: "ed4.iopos",
    6: "ed4.questors",
}

SOURCE_REFERENCES = {
    1: "Earthdawn_Fourth_Edition_Companion.pdf",
    2: "FAS14207_Vasgothia.pdf",
    3: "Earthdawn_Fourth_Edition_Adept's_Journey_Mystic_Paths.pdf",
    4: "Earthdawn 4e - Travar - The Merchant City.pdf",
    5: "Earthdawn 4e - Iopos.pdf",
    6: "04 - Earthdawn 4E - Questors.pdf",
}


def text(value: object) -> str:
    return "" if value is None else str(value).strip()


def slug(value: str) -> str:
    normalized = value.casefold().replace("’", "").replace("'", "")
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", normalized))


def legacy_pages(path: Path) -> dict[str, int]:
    source = path.read_text(encoding="utf-8")
    rows = re.findall(r"^\s*\['([^']+)',\s*'[^']+',\s*\d+,\s*(\d+)\],?$", source, re.M)
    return {name.casefold(): int(page) for name, page in rows}


def parsed_rank(value: str) -> int | None:
    match = re.search(r"(?:^|;\s*)Rank\s*:?[ ]*(\d+)(?:;|$)", value, re.I)
    return int(match.group(1)) if match else None


def parsed_field(value: str, label: str) -> str:
    match = re.search(rf"(?:^|;\s*){re.escape(label)}:\s*([^;]+)", value, re.I)
    return match.group(1).strip() if match else ""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument(
        "--legacy-knacks",
        type=Path,
        default=Path("src/games/earthdawn4e/companion-knacks.ts"),
    )
    args = parser.parse_args()

    workbook = load_workbook(args.workbook, read_only=True, data_only=True)
    expected_sheets = {"Table 1", "Source References"}
    if not expected_sheets.issubset(workbook.sheetnames):
        raise ValueError(f"Missing required sheets: {sorted(expected_sheets - set(workbook.sheetnames))}")
    sheet = workbook["Table 1"]
    headers = [text(cell.value) for cell in next(sheet.iter_rows(min_row=1, max_row=1))]
    expected_headers = [
        "Knack Name",
        "Associated Talent or Ability",
        "Description",
        "Mechanics & Requirements",
        "Source",
    ]
    if headers != expected_headers:
        raise ValueError(f"Unexpected workbook headers: {headers!r}")

    source_sheet = workbook["Source References"]
    source_rows = list(source_sheet.iter_rows(values_only=True))
    if not source_rows or tuple(map(text, source_rows[0])) != ("Index", "Reference"):
        raise ValueError("Unexpected source-reference headers")
    source_references = {
        int(text(index)): text(reference)
        for index, reference in source_rows[1:]
        if text(index) or text(reference)
    }
    if source_references != SOURCE_REFERENCES:
        raise ValueError(f"Unexpected source references: {source_references!r}")

    pages = legacy_pages(args.legacy_knacks)
    grouped: dict[str, dict[str, object]] = {}
    seen_keys: set[str] = set()
    row_count = 0
    for row_number, values in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
        if not any(text(value) for value in values):
            continue
        row_count += 1
        name, association, description, mechanics, source_text = map(text, values)
        if not all([name, association, description, mechanics, source_text]):
            raise ValueError(f"Missing required value at workbook row {row_number}")
        if not re.fullmatch(r"\d+", source_text):
            raise ValueError(f"Invalid source at workbook row {row_number}: {source_text!r}")
        source_number = int(source_text)
        source_id = SOURCE_IDS.get(source_number)
        if not source_id:
            raise ValueError(f"Unknown source at workbook row {row_number}: {source_number}")
        key = f"{source_id}:{slug(name)}:{slug(association)}"
        if key in seen_keys:
            raise ValueError(f"Duplicate variant key at workbook row {row_number}: {key}")
        seen_keys.add(key)
        strain_text = parsed_field(mechanics, "Strain")
        action_text = parsed_field(mechanics, "Action")
        record = grouped.setdefault(
            name.casefold(),
            {
                "name": name,
                "legacyCompanionId": name.casefold() in pages,
                "variants": [],
            },
        )
        record["variants"].append({
            "key": key,
            "association": association,
            "description": description,
            "mechanicsText": mechanics,
            "minimumRank": parsed_rank(mechanics),
            "actionText": action_text,
            "strainText": strain_text,
            "strainValue": int(strain_text) if re.fullmatch(r"\d+", strain_text) else None,
            "sourceId": source_id,
            "page": pages.get(name.casefold()) if source_number == 1 else None,
        })

    records = sorted(grouped.values(), key=lambda item: str(item["name"]).casefold())
    if row_count != 243:
        raise ValueError(f"Expected 243 knack variants, found {row_count}")
    if len(records) != 227:
        raise ValueError(f"Expected 227 canonical knack names, found {len(records)}")
    if len(seen_keys) != 243:
        raise ValueError(f"Expected 243 unique variant keys, found {len(seen_keys)}")
    stable_ids = [slug(str(record["name"])) for record in records]
    if len(stable_ids) != len(set(stable_ids)):
        raise ValueError("Canonical knack names produce colliding stable IDs")

    payload = json.dumps(records, ensure_ascii=False, indent=2)
    output = (
        "// Generated by scripts/import-earthdawn-knacks.py. Do not edit by hand.\n"
        "import type { EarthdawnKnackReference } from './knack-types';\n\n"
        f"export const earthdawnKnackReference = {payload} as const satisfies readonly EarthdawnKnackReference[];\n"
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output, encoding="utf-8")
    prettier_candidates = [
        Path.cwd() / "node_modules/.bin/prettier",
        Path.cwd().parents[1] / "node_modules/.bin/prettier",
    ]
    prettier = next((candidate for candidate in prettier_candidates if candidate.exists()), None)
    if prettier:
        subprocess.run(
            [
                str(prettier),
                "--config",
                str(Path.cwd() / ".prettierrc.json"),
                "--ignore-path",
                "/dev/null",
                "--write",
                str(args.output),
            ],
            check=True,
        )
    print(f"Generated {row_count} variants across {len(records)} knacks at {args.output}")


if __name__ == "__main__":
    main()
