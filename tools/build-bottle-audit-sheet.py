#!/usr/bin/env python3
"""Render a labelled, read-only visual inventory of the public bottle candidates."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "reports" / "KALM-DRAFT-REJECTION-20260712" / "bottle-contact-sheet.webp"
PRODUCT_IDS = {
    "kalm-move-everyday-bottle",
    "kalm-move-slim-wellness-bottle",
    "kalm-move-studio-bottle",
    "kalm-move-protein-shaker-bottle",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "arialbd.ttf" if bold else "arial.ttf"
    try:
        return ImageFont.truetype(name, size)
    except OSError:
        return ImageFont.load_default()


def main() -> None:
    data = json.loads((ROOT / "products.json").read_text(encoding="utf-8"))
    products = [item for item in data["products"] if item["id"] in PRODUCT_IDS]
    width, card_width, card_height, columns = 1800, 420, 620, 4
    rows = sum((len(item.get("variantImages", {})) + columns - 1) // columns + 1 for item in products)
    sheet = Image.new("RGB", (width, 150 + rows * card_height), "#f5f2ed")
    draw = ImageDraw.Draw(sheet)
    draw.text((48, 32), "Bottle silhouette audit — pre-correction candidates", font=font(40, True), fill="#17211d")
    draw.text((48, 86), "Every currently public colour shown side by side. This sheet is retained as rejected-draft evidence.", font=font(20), fill="#4a564f")
    y = 150
    for product in products:
        draw.text((48, y + 22), product["title"], font=font(26, True), fill="#17211d")
        y += 62
        entries = list(product.get("variantImages", {}).items())
        for start in range(0, len(entries), columns):
            for column, (colour, value) in enumerate(entries[start:start + columns]):
                x = 48 + column * (card_width + 18)
                image_path = ROOT / value["hero"]
                canvas = Image.new("RGB", (card_width, card_height - 16), "#ffffff")
                with Image.open(image_path) as source:
                    source = ImageOps.exif_transpose(source).convert("RGB")
                    source.thumbnail((card_width - 32, 430), Image.Resampling.LANCZOS)
                    canvas.paste(source, ((card_width - source.width) // 2, 14))
                canvas_draw = ImageDraw.Draw(canvas)
                canvas_draw.text((16, 458), colour, font=font(22, True), fill="#17211d")
                canvas_draw.text((16, 493), image_path.as_posix().replace(ROOT.as_posix() + "/", ""), font=font(12), fill="#4a564f")
                canvas_draw.text((16, 525), f"SHA-256 {sha256(image_path)[:16]}", font=font(12), fill="#4a564f")
                sheet.paste(canvas, (x, y))
            y += card_height
        y += 24
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUTPUT, "WEBP", quality=92, method=6)
    print(OUTPUT)


if __name__ == "__main__":
    main()
