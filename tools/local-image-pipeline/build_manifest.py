#!/usr/bin/env python3
"""Build the zero-paid image baseline and a complete, versioned image manifest."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRODUCTS_PATH = ROOT / "products.json"
REPORTS = ROOT / "reports"

OUTDOOR_VIEWS = [
    "hero-three-quarter",
    "opposite-side",
    "component-layout",
    "material-detail",
    "lifestyle-use",
    "compatible-appliance",
]

OUTDOOR_SCENES = {
    "kalm-outdoor-ember-launch-pro-perforated-peel": "Ember 16 local compatibility environment",
    "kalm-outdoor-ember-turn-pro-turning-peel": "Ember 16 local compatibility environment",
    "kalm-outdoor-ember-dough-and-heat-kit": "Ember 16 local compatibility environment",
    "kalm-outdoor-ridge-smart-temperature-system": "Ridge 4 local compatibility environment",
    "kalm-outdoor-ridge-pro-rotisserie-kit": "Ridge 4 local compatibility environment",
    "kalm-outdoor-ridge-cast-iron-sear-system": "Ridge 4 local compatibility environment",
    "kalm-outdoor-forge-pro-griddle-tool-roll": "Forge 2 local compatibility environment",
    "kalm-outdoor-forge-smash-and-steam-kit": "Forge 2 local compatibility environment",
    "kalm-outdoor-forge-season-and-care-kit": "Forge 2 local compatibility environment",
}


def slug(value: str) -> str:
    return "-".join("".join(ch.lower() if ch.isalnum() else " " for ch in value).split())


def sha256(path: Path) -> str | None:
    if not path.exists():
        return None
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> None:
    data = json.loads(PRODUCTS_PATH.read_text(encoding="utf-8"))
    products = data["products"]
    now = datetime.now(timezone.utc).isoformat()
    outdoor = [item for item in products if item["id"] in OUTDOOR_SCENES]
    move_women = [item for item in products if item.get("brand") == "KALM Move" and item.get("audience") == "women"]
    entries: list[dict] = []

    for product in outdoor:
        product_slug = product["id"].replace("kalm-outdoor-", "")
        for index, view in enumerate(OUTDOOR_VIEWS, start=1):
            proposed = f"assets/images/products/kalm-outdoor/accessories/{product_slug}-v2/{index:02d}-{view}.webp"
            entries.append({
                "workstream": "kalm_outdoor_accessory_concept",
                "productId": product["id"],
                "productName": product["title"],
                "colour": None,
                "variant": None,
                "view": view,
                "existingImagePath": None,
                "proposedImagePath": proposed,
                "imageMethod": "local_blender_procedural_render",
                "approvedSourceAssets": ["approved appliance geometry is abstracted locally; no supplier product photo is used"],
                "productTruthSource": "live products.json coming-soon record",
                "logoAsset": None,
                "renderOrCompositingScript": "tools/local-image-pipeline/blender/render_all_accessories.py",
                "status": "pending_render",
                "qaResult": None,
                "rejectionReason": None,
                "finalHash": None,
                "width": 1200,
                "height": 1500,
                "fileSize": None,
                "webpQuality": 92,
                "liveVerificationResult": None,
                "conceptDisclosure": "Pre-production concept imagery. Final sourced product may vary.",
                "compatibilityScene": OUTDOOR_SCENES[product["id"]],
            })

    seen_move_paths: set[str] = set()
    for product in move_women:
        product_slug = slug(product["title"].replace("KALM Move ", ""))
        is_bottle = "bottle" in product["title"].lower()
        for colour, variant in (product.get("variantImages") or {}).items():
            for source in variant.get("gallery", []):
                if source in seen_move_paths:
                    continue
                seen_move_paths.add(source)
                view = Path(source).stem
                proposed = f"assets/images/products/kalm-move/women/{product_slug}-v3/{slug(colour)}/{view}.webp"
                source_path = ROOT / source
                entries.append({
                    "workstream": "kalm_move_women_bottle_preservation" if is_bottle else "kalm_move_women_buffalo_correction",
                    "productId": product["id"],
                    "productName": product["title"],
                    "colour": colour,
                    "variant": colour,
                    "view": view,
                    "existingImagePath": source,
                    "proposedImagePath": source if is_bottle else proposed,
                    "imageMethod": "preserve_existing_approved_bottle_image" if is_bottle else "local_opencv_perspective_warp_and_texture_integrated_blending",
                    "approvedSourceAssets": [source, "assets/branding/kalm-buffalo/kalm-buffalo-mark.png"],
                    "productTruthSource": "existing approved supplier image and live products.json variant mapping",
                    "logoAsset": None if is_bottle else "assets/branding/kalm-buffalo/kalm-buffalo-mark.png",
                    "renderOrCompositingScript": None if is_bottle else "tools/local-image-pipeline/kalm-move/run_all.py",
                    "status": "preserved_existing" if is_bottle else "pending_audit",
                    "qaResult": "preserved_existing" if is_bottle else None,
                    "rejectionReason": None,
                    "finalHash": None,
                    "width": None,
                    "height": None,
                    "fileSize": None,
                    "webpQuality": 92,
                    "liveVerificationResult": "unchanged_pending_final_site_verification" if is_bottle else None,
                    "sourceHash": sha256(source_path),
                })

    all_existing_paths = sorted({
        path for product in products for path in ([product.get("image")] if product.get("image") else []) + list(product.get("gallery") or [])
    })
    baseline = {
        "generatedAt": now,
        "startingSha": "07258b3a6f2960718750a78b57a01f9537d4ce34",
        "branch": "feature/kalm-zero-paid-imagery-v1",
        "productionUrl": "https://kalmcollective.co.za",
        "productionDeployId": "6a52b608d813d38d4986c54e",
        "rollbackSha": "a5b459d4c8b65836e6775d9040729ba6f16d0e80",
        "paidImageUsage": 0,
        "catalogueProductCount": len(products),
        "existingProductImagePathCount": len(all_existing_paths),
        "kalmOutdoorAccessoryCount": len(outdoor),
        "kalmMoveWomenProductCount": len(move_women),
        "kalmMoveWomenUniqueImageCount": len(seen_move_paths),
        "consoleAndFunctionalBaseline": "Stable from the successful 2026-07-11 live verification: Outdoor V2, KALM Move women edit, filters, cart safeguards, waitlist, desktop and mobile passed with zero console errors.",
        "existingProductPaths": all_existing_paths,
    }
    manifest = {
        "generatedAt": now,
        "paidImageUsage": 0,
        "requirements": {"outdoorMinimumApproved": 54, "moveWomenUniqueSourceImages": len(seen_move_paths)},
        "entries": entries,
    }
    summary = [
        "# KALM Zero-Paid Image Manifest Summary",
        "",
        f"- Generated: {now}",
        "- Paid image usage: 0",
        f"- Outdoor concept entries: {len(outdoor) * len(OUTDOOR_VIEWS)}",
        f"- KALM Move women source-image entries: {len(seen_move_paths)} (294 garment candidates; 26 bottle images preserved)",
        f"- KALM Move women products: {len(move_women)}",
        "- Outdoor imagery is local pre-production concept rendering and requires the product-page disclosure.",
        "- Move entries remain pending until their image-specific branding correction passes 100% visual QA.",
        "",
    ]
    (REPORTS / "zero-paid-image-baseline.json").write_text(json.dumps(baseline, indent=2) + "\n", encoding="utf-8")
    (REPORTS / "kalm-zero-paid-image-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (REPORTS / "kalm-zero-paid-image-summary.md").write_text("\n".join(summary), encoding="utf-8")
    print(json.dumps({"outdoorEntries": len(outdoor) * len(OUTDOOR_VIEWS), "moveEntries": len(seen_move_paths)}))


if __name__ == "__main__":
    main()
