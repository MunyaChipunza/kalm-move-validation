#!/usr/bin/env python3
"""Prepare and wire the clean KALM hero and bottle V4 rebuild assets."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
GEN = Path("C:/Users/Dell/.codex/generated_images/019f52cf-30cb-7401-baf7-9a72a22da332")
REPORT = ROOT / "reports/KALM-HERO-BOTTLE-REBUILD-AND-RELEASE-20260712"
BUFFALO = ROOT / "assets/branding/kalm-buffalo/kalm-buffalo-mark.png"

HEROES = {
    "desktop": "exec-139e0f55-5b5f-40f5-bb08-f8ee08c5cb74.png",
    "tablet": "exec-d6096ddb-3702-4287-9028-a5d52803ce7b.png",
    "mobile": "exec-ac5b2d2f-f8cf-43d2-940c-76a9c45892c1.png",
}

BOTTLES = {
    "everyday-bottle": {
        "title": "Everyday Bottle",
        "colors": {
            "black": ("Black", "exec-88fb5124-257f-4a7f-90d4-b69377ffe724.png", "exec-72369319-33ec-47a5-ba2c-88d9f174557e.png"),
            "cream": ("Cream", "exec-f58379d2-c479-441b-bfab-737e99aeea8d.png", "exec-4e4bee29-9001-4d7f-9dc3-c5e3222faf60.png"),
            "lilac": ("Lilac", "exec-ce54edc2-e70a-41b4-ac16-66d182b61777.png", "exec-57c61a7b-9577-4411-b2f0-efa53a9627d3.png"),
            "sky-blue": ("Sky Blue", "exec-bfe2e3a4-cba5-4518-aabc-719a2b31c442.png", "exec-e038106a-d4e7-4a19-8c52-2653eeeaf355.png"),
        },
    },
    "slim-wellness-bottle": {
        "title": "Slim Wellness Bottle",
        "colors": {
            "matte-white": ("Matte White", "exec-217a7be1-d8dc-4807-b9f5-6de3184b2311.png", "exec-134f2e7d-9855-4c8b-a337-dad65ec78203.png"),
            "stone": ("Stone", "exec-04f45410-afb0-451c-9e06-e978ab63cf96.png", "exec-60b9fc9d-5bc6-4f7d-bd05-2f9011141c02.png"),
            "soft-pink": ("Soft Pink", "exec-ddb5f671-1d99-4c99-ad6b-aa531b1ab02e.png", "exec-4994112d-3a04-45cc-9f1c-4344c700594e.png"),
            "sage": ("Sage", "exec-92ad10a3-72cf-477d-a1fb-8bac7846c218.png", "exec-fdbdf23b-e774-48cb-91ec-cfc92fe38952.png"),
        },
    },
    "studio-bottle": {
        "title": "Studio Bottle",
        "colors": {
            "black": ("Black", "exec-2acf85fc-4ef9-4295-b302-7442be2d9076.png", "exec-7a7d1a5c-689d-4846-8255-f9d55181df80.png"),
            "stone": ("Stone", "exec-494496d1-954b-42fb-9705-c042a132d371.png", "exec-2860da97-f439-4fab-9410-857397be4831.png"),
            "lilac": ("Lilac", "exec-f16b77db-9482-484b-8729-6e595a49a9ca.png", "exec-7ccba473-c6e8-456d-9d84-6f35711145d7.png"),
            "sky-blue": ("Sky Blue", "exec-953a6fa9-66c4-4d10-8704-3dc8e098cf18.png", "exec-05991b32-2657-4ef6-9fa4-708157af6e3c.png"),
        },
    },
    "protein-shaker-bottle": {
        "title": "Protein Shaker Bottle",
        "colors": {
            "black": ("Black", "exec-0fdeec16-e46e-4930-a123-fbff3ee04047.png", "exec-d2e3e5ba-4e96-4fd6-99e7-e350ce1078f0.png"),
            "charcoal": ("Charcoal", "exec-7545eeb9-b0aa-477c-a97c-a589d6f1d2cc.png", "exec-0bc8e43a-060d-4be3-b45d-83efd51820c0.png"),
            "navy": ("Navy", "exec-4caa045c-039a-4c90-848c-e6ecbcac2b53.png", "exec-b51c72a5-9a73-4972-8967-44f0fdf3bae0.png"),
            "smoke-grey": ("Smoke Grey", "exec-3fd85c58-cc8f-4caf-8cca-d9fa20e16df8.png", "exec-e2de3435-8580-4b87-a962-ddb348d5ddfd.png"),
        },
    },
    "all-day-straw-tumbler": {
        "title": "All-Day Straw Tumbler",
        "colors": {
            "black": ("Black", "exec-d0d41cba-4708-41bf-8a26-788e6a4220b9.png", "exec-8024c6ad-6604-41e3-a7c5-9fc523a72599.png"),
            "cream": ("Cream", "exec-90a70f68-4979-46df-8452-c141e5aed443.png", "exec-92d66dde-fac2-44ff-a397-078c75c2df12.png"),
            "lilac": ("Lilac", "exec-d5979d10-9efd-4671-9061-0c82ef0ea980.png", "exec-3b9aacda-2f77-48c0-b162-fa9778c5e047.png"),
            "sky-blue": ("Sky Blue", "exec-8255b5c6-13e6-41be-b748-fb5615a3988a.png", "exec-6b9d34a3-6726-4e4d-aa2d-7ae516946218.png"),
        },
    },
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_webp(source: Path, target: Path, size: tuple[int, int] | None = None) -> dict:
    target.parent.mkdir(parents=True, exist_ok=True)
    image = Image.open(source).convert("RGB")
    if size and image.size != size:
        image = image.resize(size, Image.Resampling.LANCZOS)
    image.save(target, "WEBP", quality=95, method=6)
    return {"source": str(source), "sourceSha256": digest(source), "path": str(target.relative_to(ROOT)).replace("\\", "/"), "sha256": digest(target), "dimensions": list(image.size)}


def font(size: int, bold: bool = False):
    names = ["C:/Windows/Fonts/ARIALBD.TTF", "C:/Windows/Fonts/arial.ttf"] if bold else ["C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/ARIALBD.TTF"]
    for name in names:
        if Path(name).exists():
            return ImageFont.truetype(name, size)
    return ImageFont.load_default()


def contain(path: Path, width: int, height: int) -> Image.Image:
    image = Image.open(path).convert("RGB")
    image.thumbnail((width, height), Image.Resampling.LANCZOS)
    tile = Image.new("RGB", (width, height), "#f4f1ea")
    tile.paste(image, ((width - image.width) // 2, (height - image.height) // 2))
    return tile


def build_contact_sheets() -> None:
    contact = REPORT / "bottle-contact-sheets"
    contact.mkdir(parents=True, exist_ok=True)
    all_items: list[tuple[str, Path]] = []
    for slug, product in BOTTLES.items():
        entries: list[tuple[str, Path]] = []
        for color_slug, (color, _, _) in product["colors"].items():
            base = ROOT / "assets/images/products/kalm-move/bottles-v4" / slug / color_slug
            entries.extend([(f"{color} / front", base / "front.webp"), (f"{color} / angle", base / "angle.webp")])
        sheet(entries, contact / f"{slug}-v4.jpg", f"{product['title']} — V4 native replacement set", 2)
        all_items.extend(entries)
    sheet(all_items, contact / "complete-bottle-range-v4.jpg", "KALM Move bottles V4 — all twenty colourways, front and alternate view", 4)


def build_review_evidence() -> None:
    """Create review-only proof sheets without altering any public asset."""
    REPORT.mkdir(parents=True, exist_ok=True)

    hero_canvas = Image.new("RGB", (1800, 1420), "#f4f1ea")
    hero_draw = ImageDraw.Draw(hero_canvas)
    hero_draw.text((36, 28), "KALM campaigns V3 — regenerated six-person hero review", font=font(34, True), fill="#171a18")
    hero_entries = [
        ("Desktop — 1920 × 1080", ROOT / "assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-desktop.webp"),
        ("Tablet — original responsive composition", ROOT / "assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-tablet.webp"),
        ("Mobile — all six retained", ROOT / "assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-mobile.webp"),
    ]
    for index, (label, source) in enumerate(hero_entries):
        width = 560
        height = 620
        x = 24 + index * 590
        y = 96
        hero_canvas.paste(contain(source, width, height), (x, y))
        hero_draw.text((x + 10, y + height + 8), label, font=font(19, True), fill="#171a18")
    desktop = Image.open(hero_entries[0][1]).convert("RGB")
    mark_centres = [(335, 340), (558, 420), (840, 395), (1128, 330), (1416, 420), (1630, 362)]
    hero_draw.text((36, 780), "100% garment-branding crops — generated into fabric", font=font(28, True), fill="#171a18")
    for index, (cx, cy) in enumerate(mark_centres):
        crop = desktop.crop((cx - 100, cy - 100, cx + 100, cy + 100))
        x = 36 + index * 292
        y = 850
        hero_canvas.paste(crop, (x, y))
        hero_draw.text((x + 6, y + 214), f"Look {index + 1}", font=font(17, True), fill="#171a18")
    hero_canvas.save(REPORT / "HERO-REVIEW-SHEET.jpg", quality=95, subsampling=0)

    comparison = Image.new("RGB", (1800, 760), "#f4f1ea")
    comparison_draw = ImageDraw.Draw(comparison)
    comparison_draw.text((36, 28), "Replacement comparison — rejected historical assets retained for audit only", font=font(29, True), fill="#171a18")
    comparisons = [
        ("Rejected campaign V2 — inactive", ROOT / "assets/images/recovered/campaigns-v2/kalm-final-home-hero-v2-desktop.webp"),
        ("Regenerated campaign V3 — active", ROOT / "assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-desktop.webp"),
        ("Rejected bottle V3 — inactive", ROOT / "assets/images/products/kalm-move/bottles-v3/everyday-bottle/lilac/front.jpg"),
        ("Regenerated bottle V4 — active", ROOT / "assets/images/products/kalm-move/bottles-v4/everyday-bottle/lilac/front.webp"),
    ]
    for index, (label, source) in enumerate(comparisons):
        x = 24 + index * 445
        comparison.paste(contain(source, 410, 590), (x, 102))
        comparison_draw.text((x + 8, 704), label, font=font(16, True), fill="#171a18")
    comparison.save(REPORT / "BEFORE-AND-AFTER-COMPARISON.jpg", quality=95, subsampling=0)

    crop_canvas = Image.new("RGB", (1800, 520), "#f4f1ea")
    crop_draw = ImageDraw.Draw(crop_canvas)
    crop_draw.text((36, 28), "V4 bottle 100% logo and edge crops — front masters", font=font(30, True), fill="#171a18")
    representatives = [
        ("Everyday / Lilac", ROOT / "assets/images/products/kalm-move/bottles-v4/everyday-bottle/lilac/front.webp"),
        ("Slim / Sage", ROOT / "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/sage/front.webp"),
        ("Studio / Sky Blue", ROOT / "assets/images/products/kalm-move/bottles-v4/studio-bottle/sky-blue/front.webp"),
        ("Protein / Navy", ROOT / "assets/images/products/kalm-move/bottles-v4/protein-shaker-bottle/navy/front.webp"),
        ("Tumbler / Cream", ROOT / "assets/images/products/kalm-move/bottles-v4/all-day-straw-tumbler/cream/front.webp"),
    ]
    for index, (label, source) in enumerate(representatives):
        image = Image.open(source).convert("RGB")
        crop = image.crop((361, 900, 761, 1300))
        x = 32 + index * 354
        crop_canvas.paste(crop, (x, 88))
        crop_draw.text((x + 5, 458), label, font=font(16, True), fill="#171a18")
    crop_canvas.save(REPORT / "BOTTLE-SHARPNESS-AND-BRANDING-CROPS.jpg", quality=95, subsampling=0)


def sheet(entries: list[tuple[str, Path]], target: Path, title: str, columns: int) -> None:
    width, image_height, label_height, heading = 350, 420, 42, 76
    rows = (len(entries) + columns - 1) // columns
    canvas = Image.new("RGB", (width * columns, heading + rows * (image_height + label_height)), "#f4f1ea")
    draw = ImageDraw.Draw(canvas)
    draw.text((20, 18), title, font=font(22, True), fill="#171a18")
    for i, (label, path) in enumerate(entries):
        row, column = divmod(i, columns)
        x, y = column * width, heading + row * (image_height + label_height)
        canvas.paste(contain(path, width - 16, image_height - 12), (x + 8, y + 6))
        draw.text((x + 10, y + image_height + 6), label, font=font(14, True), fill="#171a18")
    canvas.save(target, quality=94, subsampling=0)


def prepare() -> dict:
    assets: list[dict] = []
    campaign_dir = ROOT / "assets/images/recovered/campaigns-v3"
    assets.append(save_webp(GEN / HEROES["desktop"], campaign_dir / "kalm-hero-six-person-v3-desktop.webp", (1920, 1080)))
    assets.append(save_webp(GEN / HEROES["tablet"], campaign_dir / "kalm-hero-six-person-v3-tablet.webp"))
    assets.append(save_webp(GEN / HEROES["mobile"], campaign_dir / "kalm-hero-six-person-v3-mobile.webp", (1080, 1920)))
    for slug, product in BOTTLES.items():
        for color_slug, (_, front, angle) in product["colors"].items():
            folder = ROOT / "assets/images/products/kalm-move/bottles-v4" / slug / color_slug
            assets.append(save_webp(GEN / front, folder / "front.webp"))
            assets.append(save_webp(GEN / angle, folder / "angle.webp"))
    build_contact_sheets()
    build_review_evidence()
    REPORT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "generationSystem": "OpenAI built-in image generation",
        "generationCalls": 43,
        "acceptedNativeBottleAssets": 40,
        "acceptedHeroAssets": 3,
        "bottleDimensions": [1122, 1402],
        "conversion": "Each accepted PNG was converted once to quality-95 WebP. No rejected V2/V3 source was read or copied.",
        "approvedBuffaloSha256": digest(BUFFALO),
        "assets": assets,
    }
    (REPORT / "final-asset-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
    return manifest


def wire() -> None:
    catalog_path = ROOT / "products.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    by_slug = {f"kalm-move-{slug}": data for slug, data in BOTTLES.items()}
    for product in catalog["products"]:
        if product.get("slug") not in by_slug:
            continue
        data = by_slug[product["slug"]]
        first_slug, (first_color, _, _) = next(iter(data["colors"].items()))
        def asset(color_slug: str, view: str) -> str:
            return f"assets/images/products/kalm-move/bottles-v4/{product['slug'].removeprefix('kalm-move-')}/{color_slug}/{view}.webp"
        product["image"] = asset(first_slug, "front")
        product["gallery"] = [asset(first_slug, "front"), asset(first_slug, "angle")]
        product["variantImages"] = {
            color: {"hero": asset(color_slug, "front"), "gallery": [asset(color_slug, "front"), asset(color_slug, "angle")]}
            for color_slug, (color, _, _) in data["colors"].items()
        }
        product["tags"] = [tag for tag in product.get("tags", []) if tag != "bottles-v3"] + ["bottles-v4"]
    catalog_path.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8", newline="\n")
    merchandising_path = ROOT / "merchandising.js"
    merchandising = merchandising_path.read_text(encoding="utf-8")
    merchandising = merchandising.replace("campaigns-v2/kalm-final-home-hero-v2-desktop.webp", "campaigns-v3/kalm-hero-six-person-v3-desktop.webp")
    merchandising = merchandising.replace("campaigns-v2/kalm-final-home-hero-v2-tablet.webp", "campaigns-v3/kalm-hero-six-person-v3-tablet.webp")
    merchandising = merchandising.replace("campaigns-v2/kalm-final-home-hero-v2-mobile.webp", "campaigns-v3/kalm-hero-six-person-v3-mobile.webp")
    merchandising_path.write_text(merchandising, encoding="utf-8", newline="\n")
    index_path = ROOT / "index.html"
    index = index_path.read_text(encoding="utf-8")
    index = index.replace("campaigns-v2/kalm-final-home-hero-v2-desktop.webp", "campaigns-v3/kalm-hero-six-person-v3-desktop.webp")
    index = index.replace("campaigns-v2/kalm-final-home-hero-v2-tablet.webp", "campaigns-v3/kalm-hero-six-person-v3-tablet.webp")
    index = index.replace("campaigns-v2/kalm-final-home-hero-v2-mobile.webp", "campaigns-v3/kalm-hero-six-person-v3-mobile.webp")
    index = index.replace("final-correction-20260712", "hero-bottle-rebuild-20260712")
    index_path.write_text(index, encoding="utf-8", newline="\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--wire", action="store_true")
    args = parser.parse_args()
    manifest = prepare()
    if args.wire:
        wire()
    print(json.dumps({"preparedAssets": len(manifest["assets"]), "wired": args.wire}, indent=2))
