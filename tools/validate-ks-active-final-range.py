"""Validate the non-public KS Active Archive final-range review package."""

from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reports/KS-ACTIVE-ARCHIVE/FINAL-RANGE"


def main() -> None:
    audit = json.loads((OUT / "FINAL-RANGE-REVIEW.json").read_text(encoding="utf-8"))
    required = [
        "FINAL-RANGE-CONTACT-SHEET.jpg", "MOBILE-RANGE-REVIEW.jpg", "DESKTOP-RANGE-REVIEW.jpg",
        "MODEL-ROSTER.json", "DIVERSITY-VALIDATION.json", "STYLING-VALIDATION.json",
        "PRODUCT-NAME-MAP.json", "DRIVE-FOLDER-RENAME-MANIFEST.md", "APPROVED-PRODUCT-MANIFEST.json",
        "RETIRED-PRODUCT-MANIFEST.json", "STOCK-RECONCILIATION.json",
        "ZOHO-STAGED-PAYLOAD.json", "INTRANET-STAGED-PAYLOAD.json", "PRODUCTION-BLOCK.md",
        "FINAL-RANGE-REVIEW.md", "FINAL-RANGE-REVIEW.json", "DRAFT-DEPLOY.md",
    ]
    branch_diff = subprocess.run(
        ["git", "diff", "--name-only", "origin/master...HEAD", "--", "products.json"],
        cwd=ROOT, check=True, text=True, capture_output=True,
    ).stdout.strip()
    route = ROOT / "review/ks-active/archive-final-range/index.html"
    checks = {
        "all_required_final_range_artifacts_exist": all((OUT / name).is_file() for name in required),
        "fourteen_completed_packages_pass": audit["checks"]["fourteen_completed_packages_have_passing_product_validation"],
        "fifty_six_of_fifty_six_colours_completed": audit["summary"]["completedColours"] == 56 and audit["summary"]["totalEligibleColours"] == 56,
        "no_source_blocked_products": audit["checks"]["no_source_blocked_products"],
        "p026_private_source_lock_complete": audit["checks"]["p026_private_source_lock_complete"],
        "p028_private_source_lock_complete": audit["products"][8]["status"] == "completed_review",
        "products_json_unchanged": branch_diff == "",
        "review_route_is_noindex": route.is_file() and "noindex" in route.read_text(encoding="utf-8"),
        "zoho_intranet_and_production_untouched": all(audit["checks"][name] for name in ("zoho_unchanged", "intranet_unchanged", "production_unchanged")),
    }
    result = {
        "validator": "tools/validate-ks-active-final-range.py",
        "validatedAt": datetime.now(timezone.utc).isoformat(),
        "passed": all(checks.values()),
        "checks": checks,
        "productionDeployment": False,
        "zohoUpdated": False,
        "intranetUpdated": False,
    }
    (OUT / "SKU-VALIDATION.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8", newline="\n")
    if not result["passed"]:
        raise SystemExit("final range validation failed")


if __name__ == "__main__":
    main()
