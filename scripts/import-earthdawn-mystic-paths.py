#!/usr/bin/env python3
"""Extract and validate the supplied Mystic Paths workbook deterministically."""

from __future__ import annotations

import argparse
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main", "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
EXPECTED_HEADERS = [
    "Exact Path name and source/page",
    "Initiation requirements, ordeal, minimum Circle, LP cost, and Blood Magic cost",
    "Maximum Path Rank and Path-talent cost tier",
    "Required Race, Discipline, talents, skills, or affiliations",
    "Rank-by-rank bonuses and abilities",
    "Talent Options, including unlock Rank and LP tier",
    "Training or advancement rules and any special restrictions",
    "Source",
]
EXPECTED_NAMES = ["Fire Eater", "Horror Stalker", "Journeyman", "Liberator", "Messenger", "Purifier", "Scholar", "Woodsman", "Boatman"]


def rows(path: Path) -> list[list[str]]:
    with zipfile.ZipFile(path) as archive:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = ["".join(node.text or "" for node in item.iter(f"{{{NS['a']}}}t")) for item in root.findall("a:si", NS)]
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {item.attrib["Id"]: item.attrib["Target"] for item in relationships}
        sheet = next(item for item in workbook.find("a:sheets", NS) if item.attrib["name"] == "Table 1")
        target = targets[sheet.attrib[f"{{{NS['r']}}}id"]].lstrip("/")
        document = ET.fromstring(archive.read(target if target.startswith("xl/") else f"xl/{target}"))
        result: list[list[str]] = []
        for row in document.findall(".//a:sheetData/a:row", NS):
            values: list[str] = []
            for cell in row.findall("a:c", NS):
                value = cell.find("a:v", NS)
                text = "" if value is None else value.text or ""
                if cell.attrib.get("t") == "s" and text:
                    text = shared[int(text)]
                values.append(text.strip())
            result.append(values)
        return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    data = rows(args.workbook)
    if data[0] != EXPECTED_HEADERS:
        raise ValueError(f"Unexpected headers: {data[0]!r}")
    if len(data) != 10:
        raise ValueError(f"Expected 9 records, found {len(data) - 1}")
    records = []
    for row_number, row in enumerate(data[1:], 2):
        match = re.fullmatch(r"(.+?) \((.+?), p\. ([0-9][0-9, -]*)\)", row[0])
        if not match:
            raise ValueError(f"Malformed identity at row {row_number}: {row[0]!r}")
        name = match.group(1)
        records.append({"name": name, "identity": row[0], "initiation": row[1], "rank": row[2], "requirements": row[3], "bonuses": row[4], "options": row[5], "advancement": row[6], "sourceIndex": int(row[7])})
    if [record["name"] for record in records] != EXPECTED_NAMES:
        raise ValueError("Unexpected Path identities or order")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Generated {len(records)} Mystic Path/variant records at {args.output}")


if __name__ == "__main__":
    main()
