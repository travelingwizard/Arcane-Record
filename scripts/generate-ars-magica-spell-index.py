#!/usr/bin/env python3
"""Generate names and citations from the Definitive Edition spell index.

This deliberately does not extract spell prose. Generated rows stay
reference-only until a curated mechanic is reviewed against the spell page.
"""
import argparse, json, re, unicodedata
from pathlib import Path
from pypdf import PdfReader

parser = argparse.ArgumentParser()
parser.add_argument("pdf", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args()
reader = PdfReader(args.pdf)
text = "\n".join((reader.pages[p + 7].extract_text() or "") for p in range(553, 557))
text = re.sub(r"\n(?=[A-Za-z].{0,45}\n\([A-Z])", " ", text).replace("\n", " ")
pattern = re.compile(r"([A-Z][A-Za-z'’\- ,]+?)\s+\(((?:Cr|In|Mu|Pe|Re)(?:An|Aq|Au|Co|He|Ig|Im|Me|Te|Vim))\s+(General|\d+)\)\s*\.*\s*(\d{3})")

def slug(value):
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value))

rows = {}
for name, technique_form, level, page in pattern.findall(text):
    name = " ".join(name.split()).strip(" ,")
    if len(name) < 5 or "Outcome" in name:
        continue
    key = f"ars.spell.{slug(name)}"
    row = {
        "id": key, "aliases": [], "name": name, "technique": technique_form[:2],
        "form": technique_form[2:], "level": None if level == "General" else int(level),
        "general": level == "General", "sourceId": "ars.definitive",
        "printedPage": int(page), "pdfPage": int(page) + 8,
        "verification": "reference-only", "summary": "Core formulaic or ritual spell; review its cited page before selection.",
    }
    if key in rows and rows[key] != row:
        raise SystemExit(f"conflicting spell ID: {key}")
    rows[key] = row
result = sorted(rows.values(), key=lambda row: row["id"])
if len(result) < 300:
    raise SystemExit(f"unexpectedly short spell index: {len(result)}")
args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
print(f"Generated {len(result)} reference-only spell rows")
