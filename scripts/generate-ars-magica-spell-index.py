#!/usr/bin/env python3
"""Generate selectable names, Arts, levels, and citations from the reviewed
Definitive Edition spell index. Spell prose is deliberately not copied.
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
        "verification": "verified",
        "mechanics": {"technique": technique_form[:2], "form": technique_form[2:], "level": None if level == "General" else int(level), "general": level == "General"},
        "summary": "Core formulaic or ritual spell. Use the cited rulebook entry for its full effect and any requisites.",
    }
    if key in rows and rows[key] != row:
        raise SystemExit(f"conflicting spell ID: {key}")
    rows[key] = row
result = sorted(rows.values(), key=lambda row: row["id"])
if len(result) < 300:
    raise SystemExit(f"unexpectedly short spell index: {len(result)}")
args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
print(f"Generated {len(result)} selectable spell-index rows")
