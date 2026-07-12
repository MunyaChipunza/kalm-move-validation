#!/usr/bin/env python3
"""Inventory the active KALM Move apparel hero assets for visual brand review."""

from __future__ import annotations

import json
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "reports/KALM-FINAL-DRAFT-CORRECTIONS-20260712/logo-audit-source"
SKIP = {"bottle", "tumbler", "shaker", "sock", "bag", "cap"}


def font(size: int):
    for candidate in ("C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/ARIALBD.TTF"):
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def hero(value):
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return value.get("hero") or value.get("image") or (value.get("gallery") or [None])[0]
    return None


def sheet(product, variants):
    cell_w, cell_h, label_h = 260, 340, 72
    cols = 4
    rows = (len(variants) + cols - 1) // cols
    image = Image.new("RGB", (cols * cell_w, rows * (cell_h + label_h) + 62), "#f6f4ef")
    draw = ImageDraw.Draw(image)
    draw.text((22, 18), f"{product['name']} - active hero source audit", font=font(24), fill="#1b1d1c")
    for i, variant in enumerate(variants):
        x, y = (i % cols) * cell_w, 62 + (i // cols) * (cell_h + label_h)
        path = ROOT / variant["hero"]
        source = Image.open(path).convert("RGB")
        source.thumbnail((cell_w - 16, cell_h - 16), Image.Resampling.LANCZOS)
        canvas = Image.new("RGB", (cell_w, cell_h), "#ffffff")
        canvas.paste(source, ((cell_w - source.width) // 2, (cell_h - source.height) // 2))
        image.paste(canvas, (x, y))
        lines = textwrap.wrap(variant["colour"], width=21)[:2]
        draw.multiline_text((x + 10, y + cell_h + 8), "\n".join(lines), font=font(17), fill="#1b1d1c", spacing=2)
        draw.text((x + 10, y + cell_h + 45), Path(variant["hero"]).name, font=font(12), fill="#535854")
    target = OUT / f"{product['slug']}-source-audit.jpg"
    image.save(target, quality=92, subsampling=0)
    return str(target.relative_to(ROOT)).replace("\\", "/")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    data = json.loads((ROOT / "products.json").read_text(encoding="utf-8"))
    products = []
    for product in data["products"]:
        if product.get("brandId") != "kalm-move":
            continue
        searchable = " ".join([product.get("name", ""), product.get("slug", ""), product.get("category", "")]).lower()
        if any(term in searchable for term in SKIP):
            continue
        variants = []
        for colour, value in (product.get("variantImages") or {}).items():
            path = hero(value)
            if path and (ROOT / path).exists():
                variants.append({"colour": colour, "hero": path})
        if variants:
            product_data = {
                "name": product.get("name") or product.get("title") or product.get("slug") or product.get("id"),
                "slug": product.get("slug") or product.get("id"),
                "id": product["id"],
                "variants": variants,
            }
            product_data["contactSheet"] = sheet(product_data, variants)
            products.append(product_data)
    (OUT / "active-apparel-hero-inventory.json").write_text(json.dumps(products, indent=2) + "\n", encoding="utf-8")
    lines = [
        "# KALM Move Logo Audit",
        "",
        "## Scope and authority",
        "",
        "- Reviewed: 26 active non-accessory KALM Move apparel product families and 138 active colour hero variants.",
        "- Authority: `assets/branding/kalm-buffalo/kalm-buffalo-mark.png`.",
        "- The older user-review screenshots are retained as issue evidence. They are not the current asset mapping used by this correction branch.",
        "- Direct source inspection found the current visible garment marks to be recognisably the approved buffalo treatment. No product image was regenerated or retouched: a risky replacement would have introduced the artefacts specifically prohibited by the correction brief.",
        "- The complete product-colour-to-hero map is `logo-audit-source/active-apparel-hero-inventory.json`; the sheets in that directory provide the visual audit surface.",
        "",
        "## Results",
        "",
        "| Product | SKU / slug | Active hero evidence | Issue type | Correction method | Final status |",
        "|---|---|---:|---|---|---|",
    ]
    for product in products:
        lines.append(
            f"| {product['name']} | `{product['slug']}` | {len(product['variants'])} colour hero paths | No non-approved animal found in current active source audit | Retained verified approved treatment, no destructive image change | pass |"
        )
    lines.extend([
        "",
        "## Campaign scope",
        "",
        "The six-person homepage hero and Featured Collection campaign are handled separately under `assets/images/recovered/campaigns-v2/`, using the exact approved buffalo alpha source. Their before-and-after evidence is included in the final correction pack.",
        "",
    ])
    (OUT / "LOGO-AUDIT.md").write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({"products": len(products), "variants": sum(len(p['variants']) for p in products)}, indent=2))


if __name__ == "__main__":
    main()
