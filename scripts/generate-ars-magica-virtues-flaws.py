#!/usr/bin/env python3
"""Generate the complete Virtue/Flaw selection index from the core summary tables.

Only names, classifications, and citations are adapted. Descriptive prose stays
in the book. The summary tables are printed pp. 67-68 and 117-118.
"""
import argparse
import json
import re
import unicodedata
from pathlib import Path

import pdfplumber
from pypdf import PdfReader

parser = argparse.ArgumentParser()
parser.add_argument("pdf", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args()


def slug(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", ascii_value))


def normalized(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower())


reader = PdfReader(args.pdf)
index_text = "\n".join((reader.pages[index].extract_text() or "") for index in range(564, 576))
index_text = re.sub(r"\n(?=\([^\n]+\)\s*\.{2,})", " ", index_text)
index_rows = {}
for match in re.finditer(r"([^\n]{2,80}?)\s+\((Virtue|Flaw)\)\s*\.{2,}\s*(\d{2,3})", index_text):
    name, kind, page = match.groups()
    name = re.sub(r"^.*(?:\d{3}|see also)\s+", "", name).strip(" .")
    keys = {normalized(name)}
    trailing_article = re.match(r"(.+),\s+(A|The)$", name, re.IGNORECASE)
    if trailing_article:
        keys.add(normalized(f"{trailing_article.group(2)} {trailing_article.group(1)}"))
    for key in keys:
        index_rows[(key, kind.lower())] = int(page)

# (PDF page index, x0, x1, initial category, [(heading y, new category), ...])
columns = [
    (74, 100, 250, "supernatural-free", [(85, "hermetic-major"), (274, "supernatural-major"), (652, "social-status-major")]),
    (74, 250, 398, "social-status-major", [(247, "general-major"), (422, "hermetic-minor")]),
    (74, 398, 550, "hermetic-minor", [(382, "supernatural-minor")]),
    (75, 48, 170, "supernatural-minor", [(381, "social-status-minor")]),
    (75, 170, 298, "social-status-minor", [(425, "general-minor")]),
    (75, 298, 420, "general-minor", []),
    (75, 420, 565, "general-minor", [(336, "mythic-companion-free"), (425, "social-status-free"), (706, "supernatural-free")]),
    (124, 105, 253, "hermetic-major", [(312, "personality-variable"), (641, "story-major")]),
    (124, 253, 401, "story-major", [(414, "social-status-major"), (460, "supernatural-major"), (607, "general-major")]),
    (124, 401, 550, "general-major", [(85, "hermetic-minor"), (641, "personality-minor")]),
    (125, 60, 217, "personality-minor", [(348, "story-minor"), (589, "social-status-minor")]),
    (125, 217, 374, "social-status-minor", [(68, "supernatural-minor"), (455, "general-minor")]),
    (125, 374, 550, "general-minor", []),
]

page_overrides = {
    ("horrifyingappearancesnakeleg", "flaw"): 133,
    ("susceptibilitytoinfernalpower", "flaw"): 146,
    ("truelovenpc", "flaw"): 147,
}

heading_fragments = ("ERMETIC", "UPERNATURAL", "OCIAL", "ENERAL", "ERSONALITY", "TORY", "YTHIC")
rows = []
with pdfplumber.open(args.pdf) as pdf:
    for page_index, x0, x1, initial, transitions in columns:
        words = pdf.pages[page_index].crop((x0, 35, x1, 745)).extract_words(x_tolerance=2, y_tolerance=2)
        lines = {}
        for word in words:
            key = round(word["top"] / 3) * 3
            lines.setdefault(key, []).append(word)
        category = initial
        transition_index = 0
        for top, line_words in sorted(lines.items()):
            while transition_index < len(transitions) and top >= transitions[transition_index][0]:
                category = transitions[transition_index][1]
                transition_index += 1
            value = " ".join(word["text"] for word in sorted(line_words, key=lambda word: word["x0"])).strip()
            if not value or value in {"IV", "6767", "6868", "117117", "118118"} or "LLiisstt" in value:
                continue
            if any(fragment in value for fragment in heading_fragments) or re.fullmatch(r"[A-Z]?(?:\s*[,A-Z])+", value):
                continue
            value = re.sub(r"^(?:\)|gs)\s+", "", value).strip()
            kind = "virtue" if page_index < 100 else "flaw"
            magnitude = "free" if category.endswith("free") else "major" if category.endswith("major") else "minor"
            if category == "personality-variable":
                magnitude = "variable"
            page = index_rows.get((normalized(value), kind))
            page = page or page_overrides.get((normalized(value), kind))
            if page is None:
                # Some index headings reorder articles or have damaged text. A
                # direct detail-page occurrence is sufficient to restore the
                # citation; unresolved matches deliberately remain null.
                page_range = range(68, 117) if kind == "virtue" else range(118, 154)
                needle = value.casefold().replace("’", "'")
                for printed in page_range:
                    page_text = (reader.pages[printed + 7].extract_text() or "").casefold().replace("’", "'")
                    if needle in page_text:
                        page = printed
                        break
            rows.append({
                "id": f"ars.{kind}.{slug(value)}",
                "aliases": [],
                "name": value,
                "kind": kind,
                "magnitude": magnitude,
                "category": category.rsplit("-", 1)[0],
                "points": 0 if magnitude == "free" else 3 if magnitude == "major" else 1,
                "sourceId": "ars.definitive",
                "printedPage": page,
                "pdfPage": page + 8 if page else None,
                "verification": "verified",
                "mechanics": {
                    "kind": kind,
                    "magnitude": magnitude,
                    "category": category.rsplit("-", 1)[0],
                    "points": 0 if magnitude == "free" else 3 if magnitude == "major" else 1,
                },
                "summary": "Core character option. Consult the cited entry for requirements and complete effects.",
            })

deduped = {}
for row in rows:
    key = row["id"]
    if key in deduped and deduped[key]["category"] != row["category"]:
        key = f'{key}-{row["category"]}'
        row["id"] = key
    deduped[key] = row
result = sorted(deduped.values(), key=lambda row: row["id"])
if len(result) < 300:
    raise SystemExit(f"unexpectedly short Virtue/Flaw inventory: {len(result)}")
args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
missing = sum(row["printedPage"] is None for row in result)
print(f"Generated {len(result)} Virtue/Flaw rows ({missing} page references unresolved)")
