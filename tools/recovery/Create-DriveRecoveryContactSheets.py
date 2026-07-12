"""Create labelled, read-only review contact sheets from the Drive inventory."""

from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Callable, Iterable

from PIL import Image, ImageDraw, ImageFont, ImageOps


BRANDS = {
    "ks-active-brand-candidates.webp": "KS Active",
    "kalm-move-brand-candidates.webp": "KALM Move",
    "kalm-outdoor-brand-candidates.webp": "KALM Outdoor",
    "kalm-wellness-brand-candidates.webp": "KALM Wellness",
    "kalm-home-brand-candidates.webp": "KALM Home",
}

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff", ".avif"}
CARD_WIDTH = 320
CARD_HEIGHT = 330
COLUMNS = 4
THUMBNAIL_BOX = (296, 210)


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def split_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        next_line = f"{line} {word}".strip()
        if draw.textlength(next_line, font=font) <= width or not line:
            line = next_line
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def source_folder(record: dict) -> str:
    parent = Path(record["ParentFolders"])
    parts = parent.parts[-3:]
    return "/".join(parts)


def is_visual_candidate(record: dict) -> bool:
    path = record["FullDrivePath"].lower()
    use = record.get("LikelyUse", "").lower()
    return (
        Path(record["FileName"]).suffix.lower() in IMAGE_EXTENSIONS
        and (
            "brands page" in use
            or "lifestyle" in use
            or "brand-tiles" in path
            or "brand-lifestyle" in path
            or "campaign" in path
            or "-tile" in path
        )
    )


def image_records(records: Iterable[dict], predicate: Callable[[dict], bool]) -> list[dict]:
    candidates = [record for record in records if predicate(record)]
    return sorted(candidates, key=lambda item: (item["FullDrivePath"].lower(), item["FileName"].lower()))


def unique_by_hash(records: Iterable[dict]) -> list[dict]:
    seen: set[str] = set()
    unique: list[dict] = []
    for record in records:
        identity = record.get("Sha256") or record["FullDrivePath"]
        if identity not in seen:
            seen.add(identity)
            unique.append(record)
    return unique


def draw_sheet(records: list[dict], output: Path, title: str) -> None:
    records = unique_by_hash(records)
    output.parent.mkdir(parents=True, exist_ok=True)
    title_font = get_font(24, bold=True)
    subtitle_font = get_font(13)
    label_font = get_font(12)
    small_font = get_font(10)
    header_height = 82
    rows = max(1, (len(records) + COLUMNS - 1) // COLUMNS)
    canvas = Image.new("RGB", (COLUMNS * CARD_WIDTH, header_height + rows * CARD_HEIGHT), "#f5f3ef")
    draw = ImageDraw.Draw(canvas)
    draw.text((18, 14), title, fill="#171717", font=title_font)
    draw.text((18, 48), f"{len(records)} unique read-only Drive candidates. Labels show source, dimensions, modified date and SHA-256 prefix.", fill="#4d4a45", font=subtitle_font)

    for index, record in enumerate(records):
        x = (index % COLUMNS) * CARD_WIDTH
        y = header_height + (index // COLUMNS) * CARD_HEIGHT
        card = Image.new("RGB", (CARD_WIDTH, CARD_HEIGHT), "#ffffff")
        card_draw = ImageDraw.Draw(card)
        card_draw.rectangle((0, 0, CARD_WIDTH - 1, CARD_HEIGHT - 1), outline="#d8d2c9", width=1)
        image_path = Path(record["FullDrivePath"])
        try:
            with Image.open(image_path) as source:
                source = ImageOps.exif_transpose(source).convert("RGB")
                thumbnail = ImageOps.contain(source, THUMBNAIL_BOX, method=Image.Resampling.LANCZOS)
                thumb_x = (CARD_WIDTH - thumbnail.width) // 2
                thumb_y = 10 + (THUMBNAIL_BOX[1] - thumbnail.height) // 2
                card.paste(thumbnail, (thumb_x, thumb_y))
        except Exception as error:
            card_draw.rectangle((12, 12, CARD_WIDTH - 12, 210), fill="#efeae3", outline="#c8bfb4")
            card_draw.text((18, 92), "Preview unavailable", fill="#664d3f", font=label_font)
            for line_index, line in enumerate(split_text(card_draw, str(error)[:110], small_font, CARD_WIDTH - 36)[:3]):
                card_draw.text((18, 112 + line_index * 14), line, fill="#664d3f", font=small_font)

        label_y = 226
        filename_lines = split_text(card_draw, record["FileName"], label_font, CARD_WIDTH - 20)[:2]
        for line in filename_lines:
            card_draw.text((10, label_y), line, fill="#161616", font=label_font)
            label_y += 14
        dimensions = f"{record.get('Width') or '?'} × {record.get('Height') or '?'}"
        modified = record.get("ModifiedTime", "")[:10]
        sha_prefix = (record.get("Sha256") or "unavailable")[:12]
        metadata = [source_folder(record), f"{dimensions} | {modified}", f"SHA {sha_prefix}"]
        for text in metadata:
            card_draw.text((10, label_y), text, fill="#5f5a53", font=small_font)
            label_y += 13
        canvas.paste(card, (x, y))

    canvas.save(output, format="WEBP", quality=90, method=6)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--inventory", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    records = json.loads(args.inventory.read_text(encoding="utf-8-sig"))
    for filename, brand in BRANDS.items():
        brand_candidates = image_records(
            records,
            lambda record, brand=brand: record.get("BrandClassification") == brand and is_visual_candidate(record),
        )
        draw_sheet(brand_candidates, args.output_dir / filename, f"{brand} brand-page candidates")

    draw_sheet(
        image_records(records, lambda record: "men-embedded-logo-v3" in record["FullDrivePath"].lower() and record["FileName"].lower() == "front.webp"),
        args.output_dir / "men-v3-recovered-master.webp",
        "KALM Move Men V3 staged front-image candidates",
    )
    draw_sheet(
        image_records(records, lambda record: "products\\kalm-move\\women" in record["FullDrivePath"].lower() and "-v3" not in record["FullDrivePath"].lower()),
        args.output_dir / "women-historical-source-master.webp",
        "KALM Move Women historical non-v3 source candidates",
    )
    draw_sheet(
        image_records(records, lambda record: "bottle" in record["FullDrivePath"].lower()),
        args.output_dir / "bottle-candidates.webp",
        "Bottle recovery candidates",
    )
    draw_sheet(
        image_records(records, lambda record: record.get("BrandClassification") == "KALM Outdoor" and ("lifestyle" in record.get("LikelyUse", "").lower() or any(term in record["FullDrivePath"].lower() for term in ("hosting", "cooking", "braai", "patio", "garden", "scene", "brand-tiles")))),
        args.output_dir / "outdoor-lifestyle-candidates.webp",
        "KALM Outdoor lifestyle and Brands-page candidates",
    )


if __name__ == "__main__":
    main()
