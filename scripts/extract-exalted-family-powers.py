#!/usr/bin/env python3
"""Extract fact-only Charm indexes from searchable First Edition PDFs.

This development utility intentionally emits no prose from the books. It keeps
only headings and mechanical header fields needed for catalog verification.
PyMuPDF is required and source/output paths are supplied by the caller.
"""

import argparse
import json
import re
from pathlib import Path

import fitz


def slug(value: str) -> str:
    value = value.lower().replace("’", "").replace("'", "")
    value = re.sub(r"\(attribute\)", "attribute", value)
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value


def joined_value(lines: list[str], index: int, prefix: str) -> str:
    value = lines[index][len(prefix) :].strip()
    next_index = index + 1
    labels = (
        "Cost:",
        "Installation Cost:",
        "Duration:",
        "Type:",
        "Minimum ",
        "Prerequisite Charms:",
    )
    while next_index < len(lines) and value.endswith("-"):
        following = lines[next_index].strip()
        if not following or following.startswith(labels):
            break
        if following.upper() == following and any(c.isalpha() for c in following):
            break
        value = value[:-1] + following
        next_index += 1
    return value


def extract(args: argparse.Namespace) -> list[dict]:
    document = fitz.open(args.pdf)
    results: list[dict] = []
    used_ids: set[str] = set()
    for page_index in range(args.start_pdf_page - 1, args.end_pdf_page):
        page = document[page_index]
        line_records = []
        for block in page.get_text("dict")["blocks"]:
            for line_data in block.get("lines", []):
                text = "".join(span["text"] for span in line_data["spans"]).strip()
                size = max((span["size"] for span in line_data["spans"]), default=0)
                if text:
                    line_records.append((text, size))
        lines = [text for text, _ in line_records]
        for index, (line, _) in enumerate(line_records):
            if not line.startswith("Cost:"):
                continue
            name_parts: list[str] = []
            for prior in range(index - 1, max(-1, index - 8), -1):
                candidate, candidate_size = line_records[prior]
                if not candidate:
                    continue
                if candidate.startswith(("CHAPTER", "EXALTED")):
                    break
                if 13.5 <= candidate_size <= 14.5 and any(
                    character.isalpha() for character in candidate
                ):
                    name_parts.insert(0, candidate)
                    continue
                break
            name = " ".join(name_parts).strip()
            if not name or name.startswith(("CHAPTER", "EXALTED")):
                continue
            definition_id = slug(name)
            if definition_id in used_ids:
                definition_id = f"{definition_id}-{page_index + 1}"
            used_ids.add(definition_id)
            metadata: dict[str, str] = {}
            for cursor in range(index, min(len(lines), index + 14)):
                current = lines[cursor]
                for label, key in (
                    ("Cost:", "cost"),
                    ("Installation Cost:", "installationCost"),
                    ("Duration:", "duration"),
                    ("Type:", "type"),
                    ("Prerequisite Charms:", "prerequisiteText"),
                ):
                    if current.startswith(label):
                        metadata[key] = joined_value(lines, cursor, label)
                if current.startswith("Minimum Essence:"):
                    metadata["minimumEssence"] = joined_value(
                        lines, cursor, "Minimum Essence:"
                    )
                elif current.startswith("Minimum ") and ":" in current:
                    trait, rating = current[len("Minimum ") :].split(":", 1)
                    metadata["minimumTrait"] = trait.strip()
                    metadata["minimumRating"] = rating.strip()
            trait = metadata.get("minimumTrait")
            rating_match = re.search(r"\d+", metadata.get("minimumRating", ""))
            essence_match = re.search(r"\d+", metadata.get("minimumEssence", ""))
            printed_page = page_index + args.printed_page_offset
            requirements = []
            if trait and rating_match:
                requirements.append({"trait": trait, "rating": int(rating_match.group())})
            summary_bits = []
            if trait and rating_match:
                summary_bits.append(f"requires {trait} {rating_match.group()}")
            if essence_match:
                summary_bits.append(f"Essence {essence_match.group()}")
            summary = f"{args.family_label} Charm"
            if summary_bits:
                summary += "; " + " and ".join(summary_bits)
            summary += "."
            results.append(
                {
                    "id": definition_id,
                    "name": name.title(),
                    "kind": "charm",
                    "summary": summary,
                    "description": summary,
                    "cost": metadata.get("cost"),
                    "installationCost": metadata.get("installationCost"),
                    "duration": metadata.get("duration"),
                    "type": metadata.get("type"),
                    "minimumRequirements": requirements,
                    "minimumEssence": int(essence_match.group()) if essence_match else None,
                    "prerequisiteCharms": [],
                    "prerequisiteText": metadata.get("prerequisiteText"),
                    "sourceDisplay": f"{args.book_title}, p. {printed_page}",
                    "source": {
                        "id": args.source_id,
                        "bookTitle": args.book_title,
                        "printedPage": printed_page,
                        "pdfPage": page_index + 1,
                    },
                    "reviewStatus": "source-checked",
                    "reviewFlags": [],
                    "category": "native",
                    "element": None,
                    "ability": trait or args.family_label,
                    "style": None,
                    "comboRules": {
                        "eligible": args.source_id != "autochthonians",
                        "restrictions": [] if args.source_id != "autochthonians" else ["Alchemical Charms use Arrays rather than Combos."],
                        "specialRules": [],
                    },
                }
            )
    known_names = [(record["id"], record["name"].lower()) for record in results]
    for record in results:
        prerequisite_text = (record["prerequisiteText"] or "").lower()
        if prerequisite_text == "none":
            continue
        record["prerequisiteCharms"] = [
            definition_id
            for definition_id, name in known_names
            if name in prerequisite_text and definition_id != record["id"]
        ]
    return results


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
    args = parser.parse_args()
    records = extract(args)
    Path(args.output).write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {len(records)} records to {args.output}")


if __name__ == "__main__":
    main()
