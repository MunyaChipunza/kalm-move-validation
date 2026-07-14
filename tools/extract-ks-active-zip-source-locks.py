"""Extract only two selected source-lock files per eligible KS Active family.

This deliberately avoids expanding the user-supplied archive.  Selection indices
refer to the read-only source contact sheets made by build-ks-active-zip-source-contacts.py.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ZIP_PATH = Path(r"C:\Users\Dell\Downloads\product images-20260714T132444Z-1-001.zip")
OUT = ROOT / "assets" / "images" / "review-only" / "ks-active" / "archive-source"
REPORT = ROOT / "reports" / "KS-ACTIVE-ARCHIVE" / "SOURCE-INTAKE" / "ZIP-SOURCE-LOCK-MANIFEST.json"

SELECTIONS = {
    "P002": ("Crisscross Back Halter Romper", "halter-back-romper", (0, 5)),
    "P010": ("Seamless Crisscross Cut Out Back Crop", "cutout-crossback-bra", (0, 1)),
    "P012": ("Seamless Breathable Scrunch Butt Shorts", "scrunch-seamless-short", (0, 5)),
    "P019": ("HIGH  Support Seamless Cut Out Sports Bra", "cutout-seamless-bra", (0, 1)),
    "P020": ("Mid Support Seamless Crisscross Sports Bra", "crossback-seamless-bra", (0, 3)),
    "P026": ("High Waist Seamless Sports Shorts", "high-waist-seamless-short", (0, 2)),
    "P027": ("Seamless Breathable Scrunch Butt Tummy Control Leggings", "curve-seam-legging", (0, 2)),
    "P028": ("High Waist Seamless Leggings ", "high-waist-seamless-legging", (0, 1)),
    "P030": ("Seamless Crisscross Back Sports Bra", "crisscross-back-bra", (0, 10)),
    "P033": ("Seamless Solid Tummy Control Leggings", "panel-seamless-legging", (0, 3)),
    "P035": ("Seamless Breathable Scrunch Butt Leggings ", "scrunch-seamless-legging", (0, 3)),
}


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest().upper()


def main() -> None:
    prefix = "product images/ACTIVE PRODUCTS/"
    report_records = []
    with zipfile.ZipFile(ZIP_PATH) as archive:
        for code, (zip_folder, slug, indices) in SELECTIONS.items():
            entries = [item for item in archive.infolist() if item.filename.startswith(f"{prefix}{zip_folder}/") and not item.is_dir()]
            if not entries or max(indices) >= len(entries):
                raise SystemExit(f"Invalid source selection for {code}")
            destination = OUT / f"{code.lower()}-{slug}"
            destination.mkdir(parents=True, exist_ok=True)
            selected = []
            for number, index in enumerate(indices, 1):
                entry = entries[index]
                suffix = Path(entry.filename).suffix.lower() or ".bin"
                path = destination / f"zip-source-{number}{suffix}"
                with archive.open(entry) as input_stream, path.open("wb") as output_stream:
                    shutil.copyfileobj(input_stream, output_stream)
                selected.append({
                    "zip_entry": entry.filename,
                    "contact_sheet_index": index + 1,
                    "local_path": str(path.relative_to(ROOT)).replace("\\", "/"),
                    "size_bytes": path.stat().st_size,
                    "sha256": digest(path),
                })
            report_records.append({"product_code": code, "zip_folder": zip_folder, "selected_sources": selected})
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps({
        "purpose": "Versioned source locks copied individually from user-provided source ZIP; non-public review-only use.",
        "source_zip": {"path": str(ZIP_PATH), "sha256": digest(ZIP_PATH)},
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "products": report_records,
    }, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
