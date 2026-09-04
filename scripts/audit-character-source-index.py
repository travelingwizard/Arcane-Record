#!/usr/bin/env python3
"""Emit heading-level source inventory metadata; never copies rules text or art."""
import json, sys
from pathlib import Path
from pypdf import PdfReader

def walk(reader, nodes):
    for node in nodes:
        if isinstance(node, list):
            yield from walk(reader, node)
        else:
            try:
                yield node.title.strip(), reader.get_destination_page_number(node) + 1
            except Exception:
                continue

def source(source_id, title, path, ranges, classification="official"):
    reader = PdfReader(path)
    headings = []
    seen = set()
    for name, page in walk(reader, reader.outline):
        if not any(lo <= page <= hi for lo, hi in ranges): continue
        key = (name.casefold(), page)
        if key in seen: continue
        seen.add(key)
        headings.append({"heading": name, "pdfPage": page, "status": "needs-entry-review"})
    return {"sourceId": source_id, "title": title, "classification": classification,
            "pdfPages": len(reader.pages), "rangesAudited": ranges, "headings": headings}

if len(sys.argv) != 5:
    raise SystemExit("usage: audit-character-source-index.py CURSE ADVENTURES CITY SHADOWS")
sources = [
  source("curseborne.core", "Curseborne (final core)", sys.argv[1], [[41, 155], [212, 293]]),
  source("curseborne.accursed-adventures", "Accursed Adventures", sys.argv[2], [[46, 47]]),
  source("com.players-guide", "City of Mist Player's Guide", sys.argv[3], [[54, 155], [162, 296]]),
  source("com.shadows-showdowns", "City of Mist Shadows & Showdowns", sys.argv[4], [[10, 73], [203, 255]]),
]
print(json.dumps({"schemaVersion": 1, "generatedFrom": "PDF outline metadata and reviewed scope ranges",
  "meaning": {"needs-entry-review": "Heading is inventoried but is not automatically selectable, priced, or mechanically verified."},
  "sources": sources}, indent=2, ensure_ascii=False))
