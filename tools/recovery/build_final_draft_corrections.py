#!/usr/bin/env python3
"""Build fresh public asset paths for the final KALM draft correction pass.

This script is deliberately conservative: bottle files are copied byte-for-byte
from the Stage 1 review source and campaign corrections only place the approved
buffalo alpha shape on previously blank garment areas.  It never alters source
review assets.
"""

from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path
from typing import Iterable

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
STAGE2_MANIFEST = ROOT / "reports/KALM-MOVE-BOTTLES-STAGE2-20260712/product-image-manifest.json"
FINAL_REPORT = ROOT / "reports/KALM-FINAL-DRAFT-CORRECTIONS-20260712"
LOGO = ROOT / "assets/branding/kalm-buffalo/kalm-buffalo-mark.png"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def approved_mark(colour: tuple[int, int, int]) -> Image.Image:
    logo = Image.open(LOGO).convert("RGBA")
    alpha = logo.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError("Approved buffalo source has no alpha content")
    logo = logo.crop(bbox)
    alpha = logo.getchannel("A")
    fill = Image.new("RGBA", logo.size, colour + (0,))
    fill.putalpha(alpha)
    return fill


def stamp(base: Image.Image, x: float, y: float, width: float, colour: tuple[int, int, int]) -> None:
    """Place an exact, alpha-derived approved mark using normalised coordinates."""
    mark = approved_mark(colour)
    target_width = max(1, round(base.width * width))
    target_height = round(target_width * mark.height / mark.width)
    mark = mark.resize((target_width, target_height), Image.Resampling.LANCZOS)
    base.alpha_composite(mark, (round(base.width * x), round(base.height * y)))


def copy_stage1_bottles() -> list[dict]:
    manifest = json.loads(STAGE2_MANIFEST.read_text(encoding="utf-8"))
    copied: list[dict] = []
    for asset in manifest["assets"]:
        source = ROOT / asset["reviewSource"]
        destination = ROOT / asset["publicPath"].replace("bottles-v2", "bottles-v3")
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
        source_hash, destination_hash = sha256(source), sha256(destination)
        if source_hash != destination_hash:
            raise RuntimeError(f"Bottle copy hash mismatch: {source} -> {destination}")
        copied.append(
            {
                "reviewSource": asset["reviewSource"],
                "sourceSha256": source_hash,
                "correctedPublicPath": str(destination.relative_to(ROOT)).replace("\\", "/"),
                "correctedSha256": destination_hash,
                "view": asset["view"],
                "method": "byte-for-byte approved Stage 1 source copy",
            }
        )
    return copied


def campaign_output(source_relative: str, output_relative: str, marks: Iterable[tuple[float, float, float, tuple[int, int, int]]]) -> dict:
    source = ROOT / source_relative
    output = ROOT / output_relative
    output.parent.mkdir(parents=True, exist_ok=True)
    image = Image.open(source).convert("RGBA")
    for mark in marks:
        stamp(image, *mark)
    image.save(output, "WEBP", lossless=True, method=6)
    return {
        "sourcePath": source_relative,
        "sourceSha256": sha256(source),
        "correctedPublicPath": output_relative,
        "correctedSha256": sha256(output),
        "method": "direct approved-buffalo alpha placement on blank garment area",
        "format": "lossless WebP",
        "marks": len(list(marks)),
    }


def build_campaigns() -> list[dict]:
    # Each coordinate is x, y, width as a proportion of the image, then RGB.
    # Placements follow the left-chest / upper-back positions of the six distinct garments.
    six_desktop = [
        (0.214, 0.286, 0.014, (245, 245, 240)),
        (0.319, 0.318, 0.013, (20, 28, 25)),
        (0.470, 0.294, 0.014, (20, 28, 25)),
        (0.591, 0.322, 0.013, (20, 28, 25)),
        (0.718, 0.280, 0.013, (245, 245, 240)),
        (0.818, 0.290, 0.014, (245, 245, 240)),
    ]
    six_tablet = six_desktop
    six_mobile = [
        (0.118, 0.404, 0.020, (245, 245, 240)),
        (0.245, 0.423, 0.019, (20, 28, 25)),
        (0.429, 0.406, 0.020, (20, 28, 25)),
        (0.571, 0.428, 0.019, (20, 28, 25)),
        (0.718, 0.392, 0.019, (245, 245, 240)),
        (0.840, 0.403, 0.020, (245, 245, 240)),
    ]
    hoodie_desktop = [(0.521, 0.323, 0.016, (245, 245, 240))]
    hoodie_mobile = [(0.531, 0.345, 0.022, (245, 245, 240))]
    return [
        campaign_output(
            "assets/images/recovered/campaigns-v1/kalm-comprehensive-home-hero-v1-desktop.webp",
            "assets/images/recovered/campaigns-v2/kalm-final-home-hero-v2-desktop.webp",
            six_desktop,
        ),
        campaign_output(
            "assets/images/recovered/campaigns-v1/kalm-comprehensive-home-hero-v1-tablet.webp",
            "assets/images/recovered/campaigns-v2/kalm-final-home-hero-v2-tablet.webp",
            six_tablet,
        ),
        campaign_output(
            "assets/images/recovered/campaigns-v1/kalm-comprehensive-home-hero-v1-mobile-v2.webp",
            "assets/images/recovered/campaigns-v2/kalm-final-home-hero-v2-mobile.webp",
            six_mobile,
        ),
        campaign_output(
            "assets/images/recovered/campaigns-v1/kalm-move-performance-collection-v1-desktop.webp",
            "assets/images/recovered/campaigns-v2/kalm-final-move-performance-v2-desktop.webp",
            hoodie_desktop,
        ),
        campaign_output(
            "assets/images/recovered/campaigns-v1/kalm-move-performance-collection-v1-mobile.webp",
            "assets/images/recovered/campaigns-v2/kalm-final-move-performance-v2-mobile.webp",
            hoodie_mobile,
        ),
    ]


def main() -> None:
    FINAL_REPORT.mkdir(parents=True, exist_ok=True)
    bottle_assets = copy_stage1_bottles()
    campaign_assets = build_campaigns()
    out = {
        "approvedLogoSource": str(LOGO.relative_to(ROOT)).replace("\\", "/"),
        "approvedLogoSha256": sha256(LOGO),
        "bottleAssets": bottle_assets,
        "campaignAssets": campaign_assets,
    }
    (FINAL_REPORT / "CORRECTED-ASSET-MANIFEST.json").write_text(
        json.dumps(out, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps({"bottles": len(bottle_assets), "campaigns": len(campaign_assets)}, indent=2))


if __name__ == "__main__":
    main()
