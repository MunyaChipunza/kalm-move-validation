"""Evaluate whether the KS Active Archive can safely enter public commerce.

This is deliberately stricter than the hidden-review validator.  A passing
review package is evidence for visual QA only; it is not permission to expose
products, write inventory systems, or deploy production.
"""

from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RANGE = ROOT / "reports/KS-ACTIVE-ARCHIVE/FINAL-RANGE"
OUT = ROOT / "reports/KS-ACTIVE-ARCHIVE/FINAL-PRODUCTION-RELEASE-20260714"


def git_output(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, check=True, text=True, capture_output=True).stdout.strip()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    audit = json.loads((RANGE / "FINAL-RANGE-REVIEW.json").read_text(encoding="utf-8"))
    stock = json.loads((RANGE / "STOCK-RECONCILIATION.json").read_text(encoding="utf-8"))
    products_diff = git_output("diff", "--name-only", "origin/master...HEAD", "--", "products.json")
    private_terms = ("20230514_", "1-Photo-", "kalm-archive-private-evidence", ".codex-remote-attachments")
    tracked_names = git_output("ls-files")
    private_source_not_tracked = not any(term in tracked_names for term in private_terms)

    checks = {
        "all_fourteen_products_complete": audit["summary"]["completedProducts"] == 14,
        "all_fifty_six_stocked_colours_complete": audit["summary"]["completedColours"] == 56,
        "no_source_blocked_products": audit["summary"]["sourceBlockedProducts"] == [],
        "p026_front_construction_source_complete": False,
        "visual_range_approval_recorded": False,
        "ownership_condition_launch_and_quantity_reconciled": False,
        "approved_public_prices_available": False,
        "zoho_inventory_reconciled": stock["zohoUpdated"] is True,
        "intranet_inventory_reconciled": stock["intranetUpdated"] is True,
        "public_catalogue_mapping_finalised": products_diff != "",
        "private_source_evidence_not_tracked_or_published": private_source_not_tracked,
        "production_deployment_is_not_yet_performed": stock["productionDeployed"] is False,
    }
    blocking = [name for name, passed in checks.items() if not passed and name not in {"production_deployment_is_not_yet_performed"}]
    result = {
        "schemaVersion": 1,
        "validator": "tools/validate-ks-active-archive-release-gates.py",
        "validatedAt": datetime.now(timezone.utc).isoformat(),
        "passed": False,
        "releaseAuthorised": False,
        "scope": "KS Active Archive only",
        "summary": audit["summary"],
        "checks": checks,
        "blockingGates": blocking,
        "requiredNextEvidence": {
            "P026": "One clear, neutral front construction photograph of the actual high-waist seamless short, from waistband through both leg hems.",
            "commerce": "Reconcile ownership, condition, launch decision, launch quantity, approved public price, Zoho quantity and intranet quantity for every sellable SKU."
        },
        "controlsConfirmed": {
            "productsJsonChanged": products_diff != "",
            "zohoUpdated": stock["zohoUpdated"],
            "intranetUpdated": stock["intranetUpdated"],
            "productionDeployed": stock["productionDeployed"],
            "privateEvidencePubliclyExposed": not private_source_not_tracked,
        },
    }
    (OUT / "RELEASE-GATE-VALIDATION.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
