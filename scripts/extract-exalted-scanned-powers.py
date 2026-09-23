#!/usr/bin/env python3
"""OCR fact-only Charm headers from image-only Exalted First Edition PDFs.

This development tool expects RapidOCR and PyMuPDF in the invoking Python
environment. It never emits source prose: only names and mechanical header
fields required for catalog verification are retained.
"""

import argparse
from difflib import SequenceMatcher
import json
import re
from pathlib import Path

import cv2
import fitz
import numpy as np
from rapidocr_onnxruntime import RapidOCR


LABELS = (
    "Cost:",
    "Duration:",
    "Type:",
    "Minimum ",
    "Prerequisite Charms:",
)


def slug(value: str) -> str:
    value = value.lower().replace("’", "").replace("'", "")
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def normalize(value: str) -> str:
    value = value.replace("：", ":").replace("•", " ")
    value = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def compact_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def pretty_name(value: str) -> str:
    value = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", value)
    value = re.sub(
        r"(?<=[a-z])(the|of|and|to|from|with|in)(?=\s|[A-Z])",
        r" \1 ",
        value,
    )
    return normalize(value).title().replace("'S", "'s")


def normalize_mechanic(value: str) -> str:
    value = re.sub(r"\bl(?=\s*motes?\b)", "1", value, flags=re.IGNORECASE)
    value = re.sub(r"(?<=\d)(?=[A-Za-z])", " ", value)
    value = re.sub(r"(?<=[A-Za-z])(?=\d)", " ", value)
    return normalize(value)


def looks_like_heading(value: str) -> bool:
    letters = [character for character in value if character.isalpha()]
    return len(letters) >= 4 and sum(character.isupper() for character in letters) / len(letters) > 0.82


def page_lines(engine: RapidOCR, page: fitz.Page) -> list[str]:
    pixmap = page.get_pixmap(matrix=fitz.Matrix(2.2, 2.2), alpha=False)
    image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(
        pixmap.height, pixmap.width, pixmap.n
    )
    if pixmap.n == 4:
        image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
    results, _ = engine(image)
    if not results:
        return []
    positioned = []
    for box, text, confidence in results:
        if confidence < 0.55:
            continue
        left = min(point[0] for point in box)
        top = min(point[1] for point in box)
        column = 0 if left < pixmap.width / 2 else 1
        positioned.append((column, top, left, normalize(text)))
    positioned.sort(key=lambda item: (item[0], item[1], item[2]))
    return [text for _, _, _, text in positioned]


def extract(args: argparse.Namespace) -> list[dict]:
    document = fitz.open(args.pdf)
    engine = RapidOCR()
    index_names: dict[str, str] = {}
    for page_number in args.index_pdf_pages:
        for line in page_lines(engine, document[page_number - 1]):
            candidate = pretty_name(line)
            candidate = re.sub(r"\s+\d+(?:[-,]\d+)*$", "", candidate).strip()
            key = compact_name(candidate)
            if len(key) >= 5 and not key.isdigit():
                index_names[key] = candidate
    results: list[dict] = []
    used_ids: set[str] = set()
    for page_index in range(args.start_pdf_page - 1, args.end_pdf_page):
        print(f"OCR PDF page {page_index + 1}", flush=True)
        lines = page_lines(engine, document[page_index])
        for index, line in enumerate(lines):
            if not re.match(r"^Cost\s*:", line, re.IGNORECASE):
                continue
            name_parts: list[str] = []
            for prior in range(index - 1, max(-1, index - 5), -1):
                candidate = lines[prior]
                compact = re.sub(r"[^A-Z]", "", candidate.upper())
                if compact.endswith("CHARMS") or compact.startswith("CHAPTER"):
                    if name_parts:
                        break
                    continue
                if looks_like_heading(candidate):
                    name_parts.insert(0, candidate)
                    break
                if name_parts:
                    break
            raw_name = normalize(" ".join(name_parts))
            raw_key = compact_name(raw_name)
            name = index_names.get(raw_key)
            if name is None and raw_key:
                closest = max(
                    index_names,
                    key=lambda candidate: SequenceMatcher(None, raw_key, candidate).ratio(),
                    default="",
                )
                similarity = (
                    SequenceMatcher(None, raw_key, closest).ratio() if closest else 0
                )
                name = index_names[closest] if similarity >= 0.72 else pretty_name(raw_name)
            if not name:
                continue
            definition_id = slug(name)
            if definition_id in used_ids:
                definition_id = f"{definition_id}-{page_index + 1}"
            used_ids.add(definition_id)
            metadata: dict[str, str] = {}
            for current in lines[index : index + 16]:
                for label, key in (
                    ("Cost:", "cost"),
                    ("Duration:", "duration"),
                    ("Type:", "type"),
                    ("Prerequisite Charms:", "prerequisiteText"),
                ):
                    if current.lower().startswith(label.lower()):
                        metadata[key] = normalize_mechanic(
                            current.split(":", 1)[1].strip()
                        )
                match = re.match(r"Minimum\s*(.+?):\s*(\d+)", current, re.IGNORECASE)
                if match:
                    trait = match.group(1).strip()
                    if trait.lower() == "essence":
                        metadata["minimumEssence"] = match.group(2)
                    else:
                        metadata["minimumTrait"] = trait
                        metadata["minimumRating"] = match.group(2)
            printed_page = page_index + args.printed_page_offset
            requirements = []
            if metadata.get("minimumTrait") and metadata.get("minimumRating"):
                requirements.append(
                    {
                        "trait": metadata["minimumTrait"],
                        "rating": int(metadata["minimumRating"]),
                    }
                )
            essence = int(metadata["minimumEssence"]) if metadata.get("minimumEssence") else None
            summary = f"{args.family_label} Charm"
            summary_bits = []
            if requirements:
                summary_bits.append(
                    f"requires {requirements[0]['trait']} {requirements[0]['rating']}"
                )
            if essence is not None:
                summary_bits.append(f"Essence {essence}")
            if summary_bits:
                summary += "; " + " and ".join(summary_bits)
            summary += "."
            results.append(
                {
                    "id": definition_id,
                    "name": name,
                    "kind": "charm",
                    "summary": summary,
                    "description": summary,
                    "cost": metadata.get("cost"),
                    "duration": metadata.get("duration"),
                    "type": metadata.get("type"),
                    "minimumRequirements": requirements,
                    "minimumEssence": essence,
                    "prerequisiteCharms": [],
                    "prerequisiteText": metadata.get("prerequisiteText"),
                    "sourceDisplay": f"{args.book_title}, p. {printed_page}",
                    "source": {
                        "id": args.source_id,
                        "bookTitle": args.book_title,
                        "printedPage": printed_page,
                        "pdfPage": page_index + 1,
                    },
                    "reviewStatus": "needs-review",
                    "reviewFlags": ["ocr-transcribed"],
                    "category": "native",
                    "element": None,
                    "ability": metadata.get("minimumTrait") or args.family_label,
                    "style": None,
                    "comboRules": {"eligible": True, "restrictions": [], "specialRules": []},
                }
            )
    names = [
        (record["id"], re.sub(r"[^a-z0-9]", "", record["name"].lower()))
        for record in results
    ]
    for record in results:
        prerequisite_text = re.sub(
            r"[^a-z0-9]", "", (record["prerequisiteText"] or "").lower()
        )
        if prerequisite_text == "none":
            continue
        record["prerequisiteCharms"] = [
            definition_id
            for definition_id, name in names
            if name in prerequisite_text and definition_id != record["id"]
        ]
    return results


def review_existing(args: argparse.Namespace) -> list[dict]:
    """Normalize OCR names against the book index without re-OCRing Charm pages."""
    document = fitz.open(args.pdf)
    engine = RapidOCR()
    candidates: dict[str, str] = {}
    for page_number in args.index_pdf_pages:
        for line in page_lines(engine, document[page_number - 1]):
            candidate = pretty_name(line)
            candidate = re.sub(r"\s+\d+(?:[-,]\d+)*$", "", candidate).strip()
            key = compact_name(candidate)
            if len(key) >= 5 and not key.isdigit():
                candidates[key] = candidate
    records = json.loads(Path(args.review_existing).read_text())
    for record in records:
        current_key = compact_name(record["name"])
        closest = max(
            candidates,
            key=lambda candidate: SequenceMatcher(None, current_key, candidate).ratio(),
            default="",
        )
        similarity = SequenceMatcher(None, current_key, closest).ratio() if closest else 0
        if similarity >= 0.72:
            record["name"] = candidates[closest]
            record["id"] = slug(record["name"])
    unique: dict[tuple[str, int], dict] = {}
    for record in records:
        unique[(record["id"], record["source"]["pdfPage"])] = record
    records = list(unique.values())
    ids = [(record["id"], compact_name(record["name"])) for record in records]
    for record in records:
        prerequisite_text = compact_name(record.get("prerequisiteText") or "")
        record["prerequisiteCharms"] = [
            definition_id
            for definition_id, name in ids
            if name in prerequisite_text and definition_id != record["id"]
        ]
    return records


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf")
    parser.add_argument("output")
    parser.add_argument("--source-id", required=True)
    parser.add_argument("--book-title", required=True)
    parser.add_argument("--family-label", required=True)
    parser.add_argument("--start-pdf-page", required=True, type=int)
    parser.add_argument("--end-pdf-page", required=True, type=int)
    parser.add_argument("--printed-page-offset", required=True, type=int)
    parser.add_argument("--index-pdf-pages", default="")
    parser.add_argument("--review-existing")
    args = parser.parse_args()
    args.index_pdf_pages = [
        int(value) for value in args.index_pdf_pages.split(",") if value.strip()
    ]
    records = review_existing(args) if args.review_existing else extract(args)
    Path(args.output).write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {len(records)} records to {args.output}")


if __name__ == "__main__":
    main()
