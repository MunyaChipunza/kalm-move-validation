"""Build visual comparison sheets for the KALM draft-rejection review pack."""

from __future__ import annotations

from io import BytesIO
from pathlib import Path
import subprocess

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reports" / "KALM-DRAFT-LOGO-BOTTLE-OUTDOOR-CORRECTION-20260712"
REJECTED = "8c2be408671d4fe55aa08d9f8443d4b2c4997c55"
FONT = ImageFont.load_default()


def load(path: Path, maximum: tuple[int, int]) -> Image.Image:
    image = Image.open(path).convert("RGB")
    image.thumbnail(maximum, Image.Resampling.LANCZOS)
    return image


def historical(path: str, maximum: tuple[int, int]) -> Image.Image:
    data = subprocess.check_output(["git.exe", "show", f"{REJECTED}:{path}"], cwd=ROOT)
    image = Image.open(BytesIO(data)).convert("RGB")
    image.thumbnail(maximum, Image.Resampling.LANCZOS)
    return image


def sheet(name: str, left_title: str, left: Image.Image, right_title: str, right: Image.Image) -> None:
    width, height = 1600, 1080
    canvas = Image.new("RGB", (width, height), "#f6f4ef")
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, width // 2, 86), fill="#3b2020")
    draw.rectangle((width // 2, 0, width, 86), fill="#173d31")
    draw.text((28, 34), left_title, fill="white", font=FONT)
    draw.text((width // 2 + 28, 34), right_title, fill="white", font=FONT)
    for x, image in ((0, left), (width // 2, right)):
        px = x + (width // 2 - image.width) // 2
        py = 118 + (height - 150 - image.height) // 2
        canvas.paste(image, (px, py))
    canvas.save(OUT / name, "WEBP", quality=92, method=6)


def text_logo() -> Image.Image:
    image = Image.new("RGB", (620, 760), "#ffffff")
    draw = ImageDraw.Draw(image)
    draw.multiline_text((85, 300), "KALM\nCOLLECTIVE", fill="#161616", font=FONT, spacing=12, align="center")
    return image


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rejected_logo = historical("branding/kalm-collective-display-logo.png", (680, 860))
    verified_logo = load(ROOT / "assets/branding/kalm-collective/kalm-collective-logo.png", (680, 860))
    sheet("comparison-rejected-versus-verified-logo.webp", "Rejected display-logo artwork", rejected_logo, "Verified approved artwork", verified_logo)
    sheet("comparison-typed-logo-versus-approved.webp", "Rejected typed-text substitute", text_logo(), "Verified image logo", verified_logo)

    rejected_bottles = load(ROOT / "reports/KALM-DRAFT-REJECTION-20260712/bottle-contact-sheet.webp", (760, 900))
    corrected_bottles = load(OUT / "desktop-everyday-bottle.jpg", (760, 900))
    sheet("comparison-bottle-silhouettes.webp", "Rejected mixed bottle candidates", rejected_bottles, "Corrected single-silhouette publication", corrected_bottles)

    rejected_outdoor = load(ROOT / "reports/visual-recovery-preview-evidence/outdoor-waitlist-cards-desktop.png", (760, 900))
    corrected_outdoor = load(OUT / "desktop-outdoor-collection.jpg", (760, 900))
    sheet("comparison-outdoor-retail.webp", "Rejected development-led Outdoor page", rejected_outdoor, "Corrected image-led appliance collection", corrected_outdoor)


if __name__ == "__main__":
    main()
