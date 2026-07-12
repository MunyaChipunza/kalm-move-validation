#!/usr/bin/env python3
"""Create review-only contact sheets for the KALM final correction draft."""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "reports/KALM-FINAL-DRAFT-CORRECTIONS-20260712"
SOURCE_SHOTS = Path("C:/Users/Dell/Downloads/QuickShare_2607120741.inspect")


def f(size: int, bold: bool = False):
    candidates = ["C:/Windows/Fonts/ARIALBD.TTF", "C:/Windows/Fonts/arial.ttf"] if bold else ["C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/ARIALBD.TTF"]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def contain(source: Image.Image, width: int, height: int) -> Image.Image:
    item = source.convert("RGB").copy()
    item.thumbnail((width, height), Image.Resampling.LANCZOS)
    frame = Image.new("RGB", (width, height), "#f4f2ed")
    frame.paste(item, ((width - item.width) // 2, (height - item.height) // 2))
    return frame


def labelled_row(target: Path, title: str, items: list[tuple[str, Path]], width: int = 440, image_height: int = 600) -> None:
    heading = 84
    label_height = 62
    canvas = Image.new("RGB", (width * len(items), heading + image_height + label_height), "#f4f2ed")
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 20), title, font=f(28, True), fill="#171a18")
    for index, (label, path) in enumerate(items):
        x = index * width
        item = contain(Image.open(path), width - 20, image_height - 20)
        canvas.paste(item, (x + 10, heading + 10))
        draw.multiline_text((x + 18, heading + image_height + 7), label, font=f(16, True), fill="#171a18", spacing=2)
    canvas.save(target, quality=94, subsampling=0)


def labelled_grid(target: Path, title: str, items: list[tuple[str, Path]], columns: int = 3, width: int = 440, image_height: int = 360) -> None:
    """Create a concise contact sheet from unmodified preview screenshots."""
    heading = 84
    label_height = 52
    rows = (len(items) + columns - 1) // columns
    canvas = Image.new("RGB", (width * columns, heading + rows * (image_height + label_height)), "#f4f2ed")
    draw = ImageDraw.Draw(canvas)
    draw.text((24, 20), title, font=f(28, True), fill="#171a18")
    for index, (label, path) in enumerate(items):
        row, column = divmod(index, columns)
        x = column * width
        y = heading + row * (image_height + label_height)
        item = contain(Image.open(path), width - 20, image_height - 18)
        canvas.paste(item, (x + 10, y + 8))
        draw.multiline_text((x + 16, y + image_height + 2), label, font=f(14, True), fill="#171a18", spacing=2)
    canvas.save(target, quality=94, subsampling=0)


def crop(source: Path, box: tuple[int, int, int, int], target: Path) -> Path:
    target.parent.mkdir(parents=True, exist_ok=True)
    Image.open(source).convert("RGB").crop(box).save(target, quality=94, subsampling=0)
    return target


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    comparisons = OUT / "comparisons"
    comparisons.mkdir(exist_ok=True)
    # This user-supplied screenshot predates the approved Stage 1 integration. It is retained as issue evidence only.
    old_bottle = SOURCE_SHOTS / "Screenshot_20260712_073148_Chrome.jpg"
    labelled_row(
        OUT / "APPROVED-VS-SMUDGED-VS-CORRECTED-BOTTLES.jpg",
        "Studio Bottle: review baseline versus immutable Stage 1 master",
        [
            ("Review screenshot issue evidence\n(pre-Stage 1 product path)", old_bottle),
            ("Approved Stage 1 source\nStone / front", ROOT / "reports/KALM-MOVE-BOTTLES-PHOTOREAL-DRAFT-20260712/generated/studio-bottle/stone/front.jpg"),
            ("Corrected active asset\nbottles-v3 / Stone / front", ROOT / "assets/images/products/kalm-move/bottles-v3/studio-bottle/stone/front.jpg"),
        ],
        width=420,
        image_height=650,
    )
    old_logo = crop(SOURCE_SHOTS / "Screenshot_20260712_072941_Chrome.jpg", (0, 470, 960, 1830), comparisons / "review-logo-baseline.jpg")
    current_logo = ROOT / "assets/images/products/kalm-move/women/open-back-short-romper-v1/navy/front.webp"
    labelled_row(
        OUT / "WRONG-LOGO-VS-CORRECTED-LOGO-COMPARISON.jpg",
        "KALM Move logo evidence: review baseline versus current active approved treatment",
        [
            ("User review baseline\nolder rendered card state", old_logo),
            ("Current active product source\napproved buffalo on garment", current_logo),
            ("Approved buffalo authority\nassets/branding/kalm-buffalo", ROOT / "assets/branding/kalm-buffalo/kalm-buffalo-mark.png"),
        ],
        width=420,
        image_height=650,
    )
    labelled_row(
        OUT / "HERO-CORRECTION-COMPARISON.jpg",
        "Six-person hero: corrected with the approved buffalo mark on each worn garment",
        [
            ("Before\ncampaigns-v1", ROOT / "assets/images/recovered/campaigns-v1/kalm-comprehensive-home-hero-v1-desktop.webp"),
            ("Corrected\ncampaigns-v2", ROOT / "assets/images/recovered/campaigns-v2/kalm-final-home-hero-v2-desktop.webp"),
        ],
        width=620,
        image_height=520,
    )
    labelled_row(
        OUT / "MAN-WITH-SWEATER-CORRECTION-COMPARISON.jpg",
        "Featured Collection: approved buffalo mark added to the visible KALM Move shirt",
        [
            ("Before\ncampaigns-v1", ROOT / "assets/images/recovered/campaigns-v1/kalm-move-performance-collection-v1-desktop.webp"),
            ("Corrected\ncampaigns-v2", ROOT / "assets/images/recovered/campaigns-v2/kalm-final-move-performance-v2-desktop.webp"),
        ],
        width=620,
        image_height=520,
    )
    # The visible issue set is retained in easy-to-review product-family contact sheets.
    selected = [
        "kalm-move-ease-flare-set",
        "kalm-move-form-short-set",
        "kalm-move-wide-leg-yoga-pant",
        "kalm-move-balance-x-back-legging-set",
        "kalm-move-halter-biker-short-set",
        "kalm-move-open-back-short-romper",
        "kalm-move-core-performance-tee",
    ]
    product_dir = OUT / "apparel-contact-sheets"
    product_dir.mkdir(exist_ok=True)
    for slug in selected:
        source = OUT / "logo-audit-source" / f"{slug}-source-audit.jpg"
        if source.exists():
            shutil.copyfile(source, product_dir / f"{slug}-approved-buffalo-audit.jpg")
    labelled_row(
        OUT / "CAMPAIGN-CORRECTED-ASSETS.jpg",
        "Corrected campaign assets: desktop and mobile source selection",
        [
            ("Six-person desktop", ROOT / "assets/images/recovered/campaigns-v2/kalm-final-home-hero-v2-desktop.webp"),
            ("Six-person mobile", ROOT / "assets/images/recovered/campaigns-v2/kalm-final-home-hero-v2-mobile.webp"),
            ("Featured Collection mobile", ROOT / "assets/images/recovered/campaigns-v2/kalm-final-move-performance-v2-mobile.webp"),
        ],
        width=420,
        image_height=590,
    )
    shots = OUT / "screenshots"
    desktop = [
        ("Homepage / six-person hero", shots / "homepage-desktop-hero-final-1440x1000.png"),
        ("Everyday Bottle / Lilac", shots / "bottle-everyday-lilac-corrected-1440x1000.png"),
        ("Slim Wellness / Sage", shots / "bottle-slim-sage-corrected-1440x1000.png"),
        ("Studio Bottle / Sky Blue", shots / "bottle-studio-sky-blue-corrected-1440x1000.png"),
        ("Protein Shaker / Navy", shots / "bottle-protein-navy-corrected-1440x1000.png"),
        ("All-Day Tumbler / Cream / Coming soon", shots / "bottle-all-day-cream-final-desktop-1440x1000.png"),
        ("Women accessories collection", shots / "bottles-women-accessories-corrected-1440x1000.png"),
        ("Ease Flare / Taupe", shots / "apparel-ease-flare-taupe-corrected-1440x1000.png"),
        ("Form Short / Dark Purple", shots / "apparel-form-short-dark-purple-corrected-1440x1000.png"),
        ("Wide-Leg Yoga Pant / Burgundy Red", shots / "apparel-wide-leg-burgundy-red-corrected-1440x1000.png"),
        ("Balance X-Back / Magic Forest", shots / "apparel-balance-magic-forest-corrected-1440x1000.png"),
        ("Halter Biker / Blue", shots / "apparel-halter-blue-corrected-1440x1000.png"),
    ]
    mobile = [
        ("Homepage / six-person hero / 375 x 812", shots / "homepage-mobile-hero-final-375x812.png"),
        ("All-Day Tumbler / Cream / 375 x 812", shots / "bottle-all-day-cream-final-mobile-375x812.png"),
        ("Open Back Romper / Navy / 390 x 844", shots / "apparel-open-back-navy-corrected-loaded-390x844.png"),
        ("Core Performance Tee / White / 390 x 844", shots / "apparel-core-tee-white-corrected-loaded-390x844.png"),
        ("Men accessories / 430 x 932", shots / "bottles-men-accessories-corrected-430x932.png"),
        ("Homepage footer / 375 x 812", shots / "homepage-mobile-footer-final-375x812.png"),
    ]
    if all(path.exists() for _, path in desktop):
        labelled_grid(OUT / "DESKTOP-SCREENSHOT-CONTACT-SHEET.jpg", "Final correction draft: desktop review evidence", desktop)
    if all(path.exists() for _, path in mobile):
        labelled_grid(OUT / "MOBILE-SCREENSHOT-CONTACT-SHEET.jpg", "Final correction draft: mobile review evidence", mobile, columns=2, width=480, image_height=520)


if __name__ == "__main__":
    main()
