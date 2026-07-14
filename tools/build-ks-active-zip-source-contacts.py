"""Create read-only contact sheets from selected folders in Munya's source ZIP.

The ZIP is never expanded wholesale.  Images are decoded directly from the archive
only to create inspection thumbnails and an inventory manifest; source bytes remain
unchanged.
"""

from __future__ import annotations

import hashlib
import io
import json
import os
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ZIP_PATH = Path(r"C:\Users\Dell\Downloads\product images-20260714T132444Z-1-001.zip")
OUT = ROOT / "reports" / "KS-ACTIVE-ARCHIVE" / "SOURCE-INTAKE"

PRODUCTS = {
    "P002": ("Crisscross Back Halter Romper", "Crisscross Back Halter Romper"),
    "P003": ("Seamless High Stretch Scrunch Butt Leggings 1", "P003 - Rib Scrunch Legging"),
    "P010": ("Seamless Crisscross Cut Out Back Sports Bra", "Seamless Crisscross Cut Out Back Crop"),
    "P012": ("Seamless Breathable Scrunch Butt Shorts", "Seamless Breathable Scrunch Butt Shorts"),
    "P019": ("High Support Seamless Cut Out Sports Bra", "HIGH  Support Seamless Cut Out Sports Bra"),
    "P020": ("Mid Support Seamless Crisscross Sports Bra", "Mid Support Seamless Crisscross Sports Bra"),
    "P026": ("High Waist Seamless Shorts", "High Waist Seamless Sports Shorts"),
    "P027": ("Seamless Breathable Scrunch Butt Tummy Control Leggings", "Seamless Breathable Scrunch Butt Tummy Control Leggings"),
    "P028": ("High Waist Seamless Leggings", "High Waist Seamless Leggings "),
    "P030": ("Seamless Crisscross Back Sports Bra", "Seamless Crisscross Back Sports Bra"),
    "P033": ("Seamless Solid Tummy Control Leggings", "Seamless Solid Tummy Control Leggings"),
    "P035": ("Seamless Breathable Scrunch Butt Leggings", "Seamless Breathable Scrunch Butt Leggings "),
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest().upper()


def make_contact_sheet(code: str, title: str, folder: str, entries: list[zipfile.ZipInfo], archive: zipfile.ZipFile) -> dict:
    thumb_w, thumb_h, label_h, margin, cols = 190, 240, 40, 20, 5
    rows = (len(entries) + cols - 1) // cols
    width = margin * 2 + cols * thumb_w
    height = 90 + margin + rows * (thumb_h + label_h + margin)
    sheet = Image.new("RGB", (width, height), "#f7f4ef")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    draw.text((20, 18), f"{code}  |  {title}", fill="#1d1d1b", font=font)
    draw.text((20, 42), f"Read-only source mirror: {folder}  |  {len(entries)} files", fill="#5a5751", font=font)
    failures = []
    for index, entry in enumerate(entries):
        x = margin + (index % cols) * thumb_w
        y = 90 + margin + (index // cols) * (thumb_h + label_h + margin)
        try:
            with archive.open(entry) as raw:
                with Image.open(io.BytesIO(raw.read())) as image:
                    image = image.convert("RGB")
                    image.thumbnail((thumb_w - 8, thumb_h - 8), Image.Resampling.LANCZOS)
                    bg = Image.new("RGB", (thumb_w - 8, thumb_h - 8), "#ffffff")
                    bg.paste(image, ((bg.width - image.width) // 2, (bg.height - image.height) // 2))
                    sheet.paste(bg, (x + 4, y + 4))
        except Exception as exc:  # contact sheet remains evidence even for a corrupt source file
            failures.append({"path": entry.filename, "error": str(exc)})
            draw.rectangle((x + 4, y + 4, x + thumb_w - 4, y + thumb_h - 4), outline="#b94747", width=2)
            draw.text((x + 12, y + 20), "Unreadable", fill="#b94747", font=font)
        draw.text((x + 4, y + thumb_h + 6), f"{index + 1:03d}  {Path(entry.filename).suffix.lower()}", fill="#33312d", font=font)
        draw.text((x + 4, y + thumb_h + 21), f"{entry.file_size:,} B", fill="#6a665f", font=font)
    filename = f"{code.lower()}-zip-source-contact-sheet.jpg"
    sheet.save(OUT / filename, quality=90, optimize=True)
    return {
        "product_code": code,
        "workbook_title": title,
        "zip_folder": folder,
        "entry_count": len(entries),
        "contact_sheet": str((OUT / filename).relative_to(ROOT)).replace("\\", "/"),
        "unreadable_entries": failures,
    }


def main() -> None:
    if not ZIP_PATH.is_file():
        raise SystemExit(f"Source ZIP missing: {ZIP_PATH}")
    OUT.mkdir(parents=True, exist_ok=True)
    prefix = "product images/ACTIVE PRODUCTS/"
    records = []
    with zipfile.ZipFile(ZIP_PATH) as archive:
        for code, (title, folder) in PRODUCTS.items():
            folder_prefix = f"{prefix}{folder}/"
            entries = [entry for entry in archive.infolist() if entry.filename.startswith(folder_prefix) and not entry.is_dir()]
            if not entries:
                raise SystemExit(f"No source ZIP entries for {code}: {folder}")
            records.append(make_contact_sheet(code, title, folder, entries, archive))
    metadata = ZIP_PATH.stat()
    manifest = {
        "purpose": "Read-only, selected-folder source inspection mirror; not storefront imagery.",
        "archive": {
            "path": str(ZIP_PATH),
            "size_bytes": metadata.st_size,
            "modified_utc": datetime.fromtimestamp(metadata.st_mtime, timezone.utc).isoformat(),
            "sha256": sha256(ZIP_PATH),
        },
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "products": records,
    }
    (OUT / "ZIP-SOURCE-MIRROR-MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
