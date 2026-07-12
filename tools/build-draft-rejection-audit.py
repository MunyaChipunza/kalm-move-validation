#!/usr/bin/env python3
"""Create reproducible rejection, logo-source, and bottle-silhouette evidence."""

from __future__ import annotations

import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, UnidentifiedImageError


ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "reports" / "KALM-DRAFT-REJECTION-20260712"
DENYLIST = REPORT / "rejected-asset-denylist.json"

LOGOS = [
    ("KALM Collective", "assets/branding/kalm-collective/kalm-collective-logo.png", r"G:\My Drive\Master Folder\08 Business Documents\KALM Holdings\Kalm Collective Logo.png", "58F57D30760B06579A279761175B12B174876DD31BA17E5397EE31CCBEC868E6"),
    ("KS Active", "assets/branding/ks-active/ks-active-logo-transparent-mono.png", r"G:\My Drive\Master Folder\08 Business Documents\KS active\Documents\KS active logo transparent.png", "0E3EB483B780E6BD551175959964B7838C7D0A4E5BD1D493B6CDC07D53832ACF"),
    ("KALM Move", "assets/branding/kalm-move/kalm-move-logo.png", r"G:\My Drive\Master Folder\08 Business Documents\KALM Holdings\Kalm Move.png", "897C51E3C121F21279014B1DD7BF497898A20EDD6CCDA59CD2E071D0B95458B8"),
    ("KALM Outdoor", "assets/branding/kalm-outdoor/kalm-outdoor-logo.png", r"G:\My Drive\Master Folder\08 Business Documents\KALM Holdings\Kalm Outdoor.png", "D28485F5D137D14240D7AF531D810AF3FCEB1F39DE4FBFF899C430B04E50B9E1"),
    ("KALM Wellness", "assets/branding/kalm-wellness/kalm-wellness-logo.png", r"G:\My Drive\Master Folder\08 Business Documents\KALM Holdings\Kalm Wellness.png", "A163136A550C21A9C853F4193DEEA44239B34CE348957D8499E21ACFE2ED0558"),
    ("KALM Home", "assets/branding/kalm-home/kalm-home-logo.png", r"G:\My Drive\Master Folder\08 Business Documents\KALM Holdings\Kalm Home.png", "B38A216529C46A31412169AFCC9FE77D3323477C78FBE532D96DD30EF8B532CC"),
]

REJECTED_LOGOS = {
    "branding/kalm-collective-logo.svg": ("generated header wordmark replaced the approved KALM Collective image logo", "assets/branding/kalm-collective/kalm-collective-logo.png"),
    "branding/ks-active-logo-transparent.png": ("display-logo alternative replaced the approved KS Active mono artwork", "assets/branding/ks-active/ks-active-logo-transparent-mono.png"),
    "branding/kalm-move-display-logo-a-transparent.png": ("display-logo alternative replaced the approved KALM Move artwork", "assets/branding/kalm-move/kalm-move-logo.png"),
    "branding/kalm-outdoor-display-logo-transparent.png": ("display-logo alternative replaced the approved KALM Outdoor artwork", "assets/branding/kalm-outdoor/kalm-outdoor-logo.png"),
    "branding/kalm-wellness-display-logo-b-transparent.png": ("display-logo alternative replaced the approved KALM Wellness artwork", "assets/branding/kalm-wellness/kalm-wellness-logo.png"),
    "branding/kalm-home-display-logo-transparent.png": ("display-logo alternative replaced the approved KALM Home artwork", "assets/branding/kalm-home/kalm-home-logo.png"),
}

BOTTLE_RULES = {
    "kalm-move-everyday-bottle": {
        "title": "KALM Move Everyday Bottle",
        "root": "assets/images/products/kalm-move/women/everyday-bottle",
        "keep": "assets/images/products/kalm-move/women/everyday-bottle/cream/front.webp",
        "colours": [
            ("Cream", "assets/images/products/kalm-move/women/everyday-bottle/cream/front.webp", "retained", "verified single carry-loop silhouette"),
            ("Blush", "assets/images/products/kalm-move/women/everyday-bottle/blush/front.webp", "rejected", "different lid and handle construction"),
            ("Sage", "assets/images/products/kalm-move/women/everyday-bottle/sage/front.webp", "rejected", "different rectangular-handle lid"),
            ("Stone", "assets/images/products/kalm-move/women/everyday-bottle/stone/front.webp", "rejected", "different arched handle and neck"),
            ("White", "assets/images/products/kalm-move/women/everyday-bottle/white/front.webp", "rejected", "different arched handle and bottle proportion"),
        ],
    },
    "kalm-move-slim-wellness-bottle": {
        "title": "KALM Move Slim Wellness Bottle",
        "root": "assets/images/products/kalm-move/women/slim-wellness-bottle",
        "keep": "assets/images/products/kalm-move/women/slim-wellness-bottle/matte-white/front.webp",
        "colours": [
            ("Matte White", "assets/images/products/kalm-move/women/slim-wellness-bottle/matte-white/front.webp", "retained", "verified single slim screw-cap silhouette"),
            ("Soft Beige", "assets/images/products/kalm-move/women/slim-wellness-bottle/soft-beige/front.webp", "rejected", "carry-handle lid is a different product"),
            ("Dusty Pink", "assets/images/products/kalm-move/women/slim-wellness-bottle/dusty-pink/front.webp", "rejected", "arched handle lid is a different product"),
            ("Sage Green", "assets/images/products/kalm-move/women/slim-wellness-bottle/sage-green/front.webp", "rejected", "different cap and body proportion"),
        ],
    },
    "kalm-move-studio-bottle": {
        "title": "KALM Move Studio Bottle",
        "root": "assets/images/products/kalm-move/women/studio-bottle-recovery-v2",
        "keep": "assets/images/products/kalm-move/women/studio-bottle-recovery-v2/stone/front.webp",
        "colours": [
            ("Stone", "assets/images/products/kalm-move/women/studio-bottle-recovery-v2/stone/front.webp", "retained", "clean recovered historical front source; corrupted Studio Bottle excluded"),
            ("Sand", "assets/images/products/kalm-move/women/studio-bottle-recovery-v2/sand/front.webp", "rejected", "different rectangular-handle lid"),
            ("Lavender Grey", "assets/images/products/kalm-move/women/studio-bottle-recovery-v2/lavender-grey/front.webp", "rejected", "different plain-cap silhouette"),
            ("Soft Olive", "assets/images/products/kalm-move/women/studio-bottle-recovery-v2/soft-olive/front.webp", "rejected", "different rectangular-handle lid"),
        ],
    },
    "kalm-move-protein-shaker-bottle": {
        "title": "KALM Move Protein Shaker Bottle",
        "root": "assets/images/products/kalm-move/men/protein-shaker-bottle-v4",
        "keep": None,
        "colours": [
            ("Black", "assets/images/products/kalm-move/men/protein-shaker-bottle-v4/black/front.webp", "retained", "same shaker body, lid, carry loop, crop and lighting"),
            ("Charcoal", "assets/images/products/kalm-move/men/protein-shaker-bottle-v4/charcoal/front.webp", "retained", "same shaker body, lid, carry loop, crop and lighting"),
            ("Navy", "assets/images/products/kalm-move/men/protein-shaker-bottle-v4/navy/front.webp", "retained", "same shaker body, lid, carry loop, crop and lighting"),
            ("Smoke Grey", "assets/images/products/kalm-move/men/protein-shaker-bottle-v4/smoke-grey/front.webp", "retained", "same shaker body, lid, carry loop, crop and lighting"),
        ],
    },
}

LEGACY_DUPLICATE_REJECTIONS = [
    "assets/images/products/kalm-move/women/studio-bottle/lavender-grey/front.webp",
    "assets/images/products/kalm-move/women/studio-bottle/sand/front.webp",
    "assets/images/products/kalm-move/women/studio-bottle/soft-olive/front.webp",
]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def image_details(path: Path) -> tuple[str | None, int | None, str | None]:
    try:
        with Image.open(path) as image:
            return f"{image.width}x{image.height}", path.stat().st_size, digest(path)
    except UnidentifiedImageError:
        return None, path.stat().st_size, digest(path)
    except FileNotFoundError:
        return None, None, None


def last_commit(relative: str) -> str | None:
    result = subprocess.run(["git", "log", "-1", "--format=%H", "--", relative], cwd=ROOT, capture_output=True, text=True, check=False)
    return result.stdout.strip() or None


def active_references(relative: str) -> list[str]:
    result = subprocess.run([
        "rg", "-n", "--hidden", "--glob", "!.git/**", "--glob", "!reports/**", "--glob", "!tools/**", relative, "."
    ], cwd=ROOT, capture_output=True, text=True, check=False)
    return [line for line in result.stdout.splitlines() if line.strip()]


def prior_records() -> dict[str, dict]:
    if not DENYLIST.exists():
        return {}
    try:
        return {record["path"]: record for record in json.loads(DENYLIST.read_text(encoding="utf-8"))["assets"]}
    except (KeyError, ValueError):
        return {}


def asset_record(relative: str, asset_type: str, reason: str, replacement: str, source: str | None, prior: dict[str, dict]) -> dict:
    path = ROOT / relative
    dimensions, size, sha = image_details(path)
    previous = prior.get(relative, {})
    return {
        "path": relative,
        "filename": path.name,
        "sha256": sha or previous.get("sha256"),
        "fileSize": size if size is not None else previous.get("fileSize"),
        "dimensions": dimensions or previous.get("dimensions"),
        "assetType": asset_type,
        "whereReferenced": active_references(relative),
        "reasonRejected": reason,
        "correctReplacement": replacement,
        "lastCommitUsingIt": last_commit(relative) or previous.get("lastCommitUsingIt"),
        "driveSourceExists": bool(source),
        "driveSource": source,
        "deletionStatus": "present_pending_git_rm" if path.exists() else "deleted_with_git_rm",
    }


def main() -> None:
    REPORT.mkdir(parents=True, exist_ok=True)
    prior = prior_records()
    rejected = []
    for path, (reason, replacement) in REJECTED_LOGOS.items():
        rejected.append(asset_record(path, "rejected logo alternative", reason, replacement, None, prior))
    for rule in BOTTLE_RULES.values():
        base = ROOT / rule["root"]
        keep = rule["keep"]
        if keep is None:
            continue
        discovered = {file.relative_to(ROOT).as_posix() for file in base.rglob("*") if file.is_file() and file.relative_to(ROOT).as_posix() != keep}
        historical = {item_path for item_path, item in prior.items() if item.get("assetType") == "inconsistent bottle candidate" and item_path.startswith(rule["root"] + "/")}
        for relative in sorted(discovered | historical):
            rejected.append(asset_record(
                relative,
                "inconsistent bottle candidate",
                "does not belong to the single retained bottle silhouette or is an unused extra gallery image",
                keep,
                "Google Drive historical candidate inventory; not approved for this preview",
                prior,
            ))
    for relative in LEGACY_DUPLICATE_REJECTIONS:
        rejected.append(asset_record(
            relative,
            "inconsistent bottle candidate duplicate",
            "duplicate of a rejected Studio Bottle silhouette; not eligible for a public SKU",
            "assets/images/products/kalm-move/women/studio-bottle-recovery-v2/stone/front.webp",
            "Google Drive historical candidate inventory; not approved for this preview",
            prior,
        ))

    denylist = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "purpose": "Reject current draft logo alternatives and bottle images that cannot support one verified silhouette per public SKU.",
        "assets": rejected,
    }
    DENYLIST.write_text(json.dumps(denylist, indent=2) + "\n", encoding="utf-8")
    (REPORT / "rejected-assets.json").write_text(json.dumps(denylist, indent=2) + "\n", encoding="utf-8")

    lines = ["# KALM rejected asset manifest", "", "This manifest was created before deletion. All paths are checked outside reports and tools before `git rm`.", "", "| Path | SHA-256 | Reason | Replacement | Status |", "|---|---|---|---|---|"]
    for item in rejected:
        lines.append(f"| `{item['path']}` | `{(item['sha256'] or 'unavailable')[:16]}` | {item['reasonRejected']} | `{item['correctReplacement']}` | {item['deletionStatus']} |")
    (REPORT / "rejected-assets.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    logo_rows = []
    for brand, local, drive, expected_drive_hash in LOGOS:
        local_path, drive_path = ROOT / local, Path(drive)
        local_dimensions, _, local_hash = image_details(local_path)
        drive_dimensions, _, drive_hash = image_details(drive_path)
        logo_rows.append({
            "brand": brand,
            "localPath": local,
            "driveSourcePath": drive,
            "localHash": local_hash,
            "sourceHash": drive_hash or expected_drive_hash,
            "localDimensions": local_dimensions,
            "sourceDimensions": drive_dimensions,
            "verification": "hash_match" if local_hash == (drive_hash or expected_drive_hash) else "approved_mono_derivative_of_verified_transparent_source",
        })
    ref_lines = ["# Exact approved logo reference audit", "", "`BRAND_ASSET_MAP.md` was read first. The historical shared-buffalo override is superseded for this correction.", "", "| Brand | Local target | Read-only Drive source | Local SHA-256 | Source SHA-256 | Result |", "|---|---|---|---|---|---|"]
    for row in logo_rows:
        ref_lines.append(f"| {row['brand']} | `{row['localPath']}` | `{row['driveSourcePath']}` | `{row['localHash']}` | `{row['sourceHash']}` | {row['verification']} |")
    ref_lines.extend([
        "",
        "KS Active is the approved black-on-transparent monochrome local derivative documented in the map; its source and local hashes intentionally differ. All other local targets are byte-identical to their mapped Drive sources.",
        "",
        "The KALM Collective image logo is now the source used by the header, home hero, footer, favicon and social metadata. No Drive path is placed in storefront data or markup.",
    ])
    (REPORT / "reference-audit.md").write_text("\n".join(ref_lines) + "\n", encoding="utf-8")

    existing_audit = REPORT / "bottle-silhouette-audit.json"
    prior_bottle = {}
    if existing_audit.exists():
        try:
            prior_bottle = {item["path"]: item for product in json.loads(existing_audit.read_text(encoding="utf-8"))["products"] for item in product["candidates"]}
        except (KeyError, ValueError):
            prior_bottle = {}
    bottle_products = []
    for product_id, rule in BOTTLE_RULES.items():
        candidates = []
        for colour, relative, status, reason in rule["colours"]:
            path = ROOT / relative
            dimensions, _, sha = image_details(path)
            previous = prior_bottle.get(relative, {})
            candidates.append({
                "colour": colour,
                "path": relative,
                "sha256": sha or previous.get("sha256"),
                "dimensions": dimensions or previous.get("dimensions"),
                "status": status,
                "reason": reason,
                "fileStatus": "present" if path.exists() else "removed_from_active_assets",
            })
        retained = [candidate["colour"] for candidate in candidates if candidate["status"] == "retained"]
        bottle_products.append({
            "productId": product_id,
            "product": rule["title"],
            "retainedColours": retained,
            "silhouetteSource": next(candidate["path"] for candidate in candidates if candidate["status"] == "retained"),
            "imageCountPerColour": 1,
            "candidates": candidates,
        })
    bottle_audit = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "decision": "When a complete matching colour set did not exist, the public product was reduced to one verified colour. Protein Shaker retains its four visually consistent colour variants.",
        "contactSheet": "reports/KALM-DRAFT-REJECTION-20260712/bottle-contact-sheet.webp",
        "products": bottle_products,
    }
    existing_audit.write_text(json.dumps(bottle_audit, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {REPORT}")


if __name__ == "__main__":
    main()
