#!/usr/bin/env python3
"""Extract and validate the supplied Gauntlet and Shaman workbook."""

from __future__ import annotations

import argparse
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
EXPECTED_HEADERS = [
    "Discipline Name",
    "Essential Identity",
    "Circle Progression Rules (Circles 1-15)",
    "Magician Rules and Requirements",
    "Advancement and Training Rules",
    "New and Existing Talents",
    "Optional Characteristics and Lore",
    "Source",
]
EXPECTED_NAMES = ["Gauntlet", "Shaman"]
EXPECTED_SOURCES = {
    1: "FAS14107_Deeper_Secrets.pdf",
    2: "Earthdawn_Fourth_Edition_Adept's_Journey_Mystic_Paths.pdf",
    3: "FAS14207_Vasgothia.pdf",
}
CIRCLE_LABELS = [
    "First Circle",
    "Second Circle",
    "Third Circle",
    "Fourth Circle",
    "Fifth Circle",
    "Sixth Circle",
    "Seventh Circle",
    "Eighth Circle",
    "Ninth Circle",
    "Tenth Circle",
    "Eleventh Circle",
    "Twelfth Circle",
    "Thirteenth Circle",
    "Fourteenth Circle",
    "Fifteenth Circle",
]


def workbook_rows(path: Path) -> dict[str, list[list[str]]]:
    with zipfile.ZipFile(path) as archive:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = [
                "".join(node.text or "" for node in item.iter(f"{{{NS['a']}}}t"))
                for item in root.findall("a:si", NS)
            ]
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {item.attrib["Id"]: item.attrib["Target"] for item in relationships}
        result: dict[str, list[list[str]]] = {}
        for sheet in workbook.find("a:sheets", NS):
            target = targets[sheet.attrib[f"{{{NS['r']}}}id"]].lstrip("/")
            document = ET.fromstring(
                archive.read(target if target.startswith("xl/") else f"xl/{target}")
            )
            rows: list[list[str]] = []
            for row in document.findall(".//a:sheetData/a:row", NS):
                values: list[str] = []
                for cell in row.findall("a:c", NS):
                    value = cell.find("a:v", NS)
                    text = "" if value is None else value.text or ""
                    if cell.attrib.get("t") == "s" and text:
                        text = shared[int(text)]
                    values.append(text.strip())
                rows.append(values)
            result[sheet.attrib["name"]] = rows
        return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    sheets = workbook_rows(args.workbook)
    data = sheets.get("Table 1", [])
    if not data or data[0] != EXPECTED_HEADERS:
        raise ValueError(f"Unexpected headers: {data[0] if data else None!r}")
    if len(data) != 3:
        raise ValueError(f"Expected 2 Disciplines, found {len(data) - 1}")
    source_rows = sheets.get("Source References", [])
    sources = {
        int(row[0]): row[1]
        for row in source_rows[1:]
        if len(row) >= 2 and row[0].isdigit()
    }
    if sources != EXPECTED_SOURCES:
        raise ValueError(f"Unexpected source references: {sources!r}")
    records = []
    for row_number, row in enumerate(data[1:], 2):
        if len(row) != len(EXPECTED_HEADERS):
            raise ValueError(f"Row {row_number} has {len(row)} cells")
        name = row[0]
        missing_circles = [label for label in CIRCLE_LABELS if label not in row[2]]
        if missing_circles:
            raise ValueError(f"{name} is missing Circle labels: {missing_circles}")
        source_indexes = [int(value) for value in re.findall(r"\d+", row[7])]
        if source_indexes != [1, 2, 3]:
            raise ValueError(f"Unexpected source indexes for {name}: {source_indexes}")
        records.append(
            {
                "name": name,
                "identity": row[1],
                "progression": row[2],
                "magicianRules": row[3],
                "advancement": row[4],
                "talents": row[5],
                "lore": row[6],
                "sourceIndexes": source_indexes,
                "sourceReferences": [sources[index] for index in source_indexes],
            }
        )
    if [record["name"] for record in records] != EXPECTED_NAMES:
        raise ValueError("Unexpected Discipline identities or order")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Generated {len(records)} Discipline records at {args.output}")


if __name__ == "__main__":
    main()
