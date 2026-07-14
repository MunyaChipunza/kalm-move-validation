"""Evaluate the KS Active Archive production gate without fabricating external sync evidence."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RANGE = ROOT / "reports/KS-ACTIVE-ARCHIVE/FINAL-RANGE"
OUT = ROOT / "reports/KS-ACTIVE-ARCHIVE/FINAL-PRODUCTION-RELEASE-20260714"


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    audit = read_json(RANGE / "FINAL-RANGE-REVIEW.json")
    product_manifest = read_json(OUT / "FINAL-PRODUCT-MANIFEST.json")
    inventory = read_json(OUT / "FINAL-INVENTORY-MANIFEST.json")
    local = read_json(OUT / "LOCAL-CATALOGUE-VALIDATION.json")
    zoho = read_json(OUT / "ZOHO-RECONCILIATION.json")
    intranet = read_json(OUT / "INTRANET-RECONCILIATION.json")
    three = read_json(OUT / "THREE-SYSTEM-RECONCILIATION.json")
    netlify = (ROOT / "netlify.toml").read_text(encoding="utf-8")
    private_routes_blocked = all(route in netlify for route in [
        '/assets/images/review-only/*',
        '/reports/KS-ACTIVE-ARCHIVE/*',
        '/review/ks-active/*',
    ])
    checks = {
        "allFourteenProductsComplete": audit["summary"]["completedProducts"] == 14,
        "allFiftySixStockedColoursComplete": audit["summary"]["completedColours"] == 56,
        "noSourceBlockedProducts": audit["summary"]["sourceBlockedProducts"] == [],
        "visualRangeApprovalRecorded": product_manifest.get("visualRangeApprovalRecorded") is True,
        "temporaryPricesApproved": all(item.get("temporaryArchiveLaunchPrice") is True for item in product_manifest["products"]),
        "launchAuthorityRecorded": inventory.get("ownershipAuthority") == "Munya explicit commercial instruction" and inventory.get("launchDecision") == "Include",
        "legacyPublicCatalogueRemoved": local["checks"].get("all legacy KS Active products are archived and hidden") is True,
        "publicCatalogueMappingFinalised": local.get("passed") is True,
        "physicalInventoryLoaded": inventory["totals"]["physicalLaunchQuantity"] == 111 and len(inventory["variants"]) == 104,
        "zohoInventoryReconciled": zoho.get("passed") is True,
        "intranetInventoryReconciled": intranet.get("passed") is True,
        "threeSystemReconciliationPassed": three.get("passed") is True,
        "privateSourceEvidenceNotPublished": local["checks"].get("public catalogue contains no Kuhle or review-only reference") is True and private_routes_blocked,
        "kuhleLikenessNotPublished": local["checks"].get("public catalogue contains no Kuhle or review-only reference") is True,
        "noUnsupportedProductPublic": local["checks"].get("only the required fourteen product codes are public") is True,
        "noDuplicateSku": local["checks"].get("public SKUs are unique and match the final SKU manifest") is True,
        "bagValidationPassed": False,
        "checkoutValidationPassed": False,
        "mobileValidationPassed": False,
        "desktopValidationPassed": False,
        "sitemapValidationPassed": local["checks"].get("sitemap excludes legacy KS Active routes and includes all Archive routes") is True,
        "structuredDataValidationPassed": False,
        "taskApplicationUnchanged": False,
    }
    blocking = [name for name, passed in checks.items() if not passed]
    result = {
        "schemaVersion": 2,
        "validator": "tools/validate-ks-active-archive-release-gates.py",
        "validatedAt": datetime.now(timezone.utc).isoformat(),
        "passed": not blocking,
        "releaseAuthorised": not blocking,
        "scope": "KS Active Archive production release only",
        "checks": checks,
        "blockingGates": blocking,
        "externalBlockers": {
            "zoho": zoho.get("reason"),
            "intranet": intranet.get("reason"),
            "production": "GitHub and Netlify access have not been verified from this environment; no production deployment was attempted.",
        },
    }
    (OUT / "RELEASE-GATE-VALIDATION.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps(result, indent=2))
    if blocking:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
