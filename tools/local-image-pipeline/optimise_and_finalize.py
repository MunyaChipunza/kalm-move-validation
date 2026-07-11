#!/usr/bin/env python3
"""Losslessly practical WebP optimisation, integrity metadata, and manifest finalisation."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
REPORTS = ROOT / "reports"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def optimise(path: Path, quality: int) -> tuple[int, int, int, str]:
    with Image.open(path) as image:
        image = image.convert("RGB")
        width, height = image.size
        image.save(path, "WEBP", quality=quality, method=6, exact=True)
    return width, height, path.stat().st_size, digest(path)


def main() -> None:
    manifest_path = REPORTS / "kalm-zero-paid-image-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    placement = json.loads((REPORTS / "kalm-move-women-buffalo-placement.json").read_text(encoding="utf-8"))
    outcomes = {record["sourceImage"]: record for record in placement["records"]}
    records = []
    for entry in manifest["entries"]:
        if entry["workstream"] == "kalm_move_women_bottle_preservation":
            entry["status"] = "preserved_existing"; entry["qaResult"] = "preserved_existing"
            continue
        target = ROOT / entry["proposedImagePath"]
        if not target.exists():
            entry["status"] = "rejected"; entry["qaResult"] = "rejected"; entry["rejectionReason"] = "expected output missing"; continue
        width, height, size, hash_ = optimise(target, int(entry.get("webpQuality") or 92))
        entry["width"], entry["height"], entry["fileSize"], entry["finalHash"] = width, height, size, hash_
        if entry["workstream"] == "kalm_outdoor_accessory_concept":
            entry["status"] = "approved"; entry["qaResult"] = "approved"; entry["liveVerificationResult"] = "pending_catalogue_integration"
        else:
            outcome = outcomes[entry["existingImagePath"]]
            entry["status"] = outcome["qaResult"]; entry["qaResult"] = outcome["qaResult"]; entry["rejectionReason"] = outcome["rejectionReason"]
            entry["liveVerificationResult"] = "pending_catalogue_integration"
        records.append({"path": entry["proposedImagePath"], "width": width, "height": height, "fileSize": size, "sha256": hash_, "quality": entry["webpQuality"]})
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    optimisation = {"paidImageUsage": 0, "images": records, "summary": {"optimised": len(records), "webp": len(records), "metadata": "stripped by Pillow re-encode; RGB/sRGB-compatible WebP"}}
    (REPORTS / "kalm-image-optimisation.json").write_text(json.dumps(optimisation, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(optimisation["summary"]))


if __name__ == "__main__":
    main()
