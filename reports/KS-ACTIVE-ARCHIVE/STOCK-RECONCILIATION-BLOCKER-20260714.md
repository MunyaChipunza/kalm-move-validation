> **SUPERSEDED: This blocker was produced from an older workbook and must not be used for current KS Active stock decisions.** The corrected source is `C:\Users\Dell\OneDrive\Desktop\KS_Active_Archive_SKU_Master.xlsx`, SHA-256 `91650C7A344172BF33E2550261A5B45DAED4DC31D30A11AB47AF5B618EC2DCED`.

# KS Active Archive stock-baseline reconciliation — 14 July 2026

## Read-only source reviewed

- Workbook present locally: `C:\Users\Dell\Downloads\KS_Active_Archive_SKU_Master.xlsx` (modified 13 July 2026).
- The user-named `KS_Active_Archive_SKU_Master(2).xlsx` was not present in the workspace, Downloads, or Codex attachments at this review point.
- This document does not infer stock from product imagery, Drive folders, or historic Shopify data.

## Result

The workbook contains 767 physical-count rows:

| Physical-count state | Rows | Can be used for the final public Archive range? |
| --- | ---: | --- |
| Not counted | 763 | No |
| Second count pending | 4 | No |
| Fully reconciled / launch-ready | 0 | No |

The four non-zero first-count rows are all P002 variants. Each has Count 1 of one, Count 2 of zero, and no confirmed ownership, condition grade, launch quantity, or ready status. They must remain excluded.

## Explicit manual authorities retained

P049 and P050 are the only exceptions supported by Munya's explicit stock approvals. They are held as approved, hidden archive packages and remain non-public:

| Product | Confirmed units | Colour/size SKU rows | Public state |
| --- | ---: | ---: | --- |
| P049 — KS Active Rib Contour Legging | 7 | 6 | Hidden pending final-range review |
| P050 — KS Active Racer Knit Bra | 11 | 11 | Hidden pending archive launch |

## Blocking condition

No additional product can meet the mandated sellability gate until a current workbook or matched physical Count 2 records confirm its variants, ownership, condition, unique SKU, and launch decision. Creating a "complete remaining range" from Drive references or historic data would violate the physical-stock authority rule.

## Guardrails retained

- No change to `products.json`, public collections, search, sitemap, structured data, production, Zoho, or the intranet.
- No unsupported P002 or other historical item has been added to a future public catalogue.
- Drive is evidence only; no source imagery has been exposed in customer-facing paths.
