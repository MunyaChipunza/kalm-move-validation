# KS Active Archive stock reconciliation correction — 14 July 2026

## Corrected authority

The earlier blocker used an older Downloads workbook and is superseded. The current authority is the supplied Desktop workbook:

- Path: `C:\Users\Dell\OneDrive\Desktop\KS_Active_Archive_SKU_Master.xlsx`
- Observed filename: `KS_Active_Archive_SKU_Master.xlsx` (the correction mandate calls it the newer “(2)” workbook; its required control totals match exactly)
- Size: 184,182 bytes
- Modified: 13 July 2026, 22:44:03 SAST
- SHA-256: `91650C7A344172BF33E2550261A5B45DAED4DC31D30A11AB47AF5B618EC2DCED`
- Physical Count data rows: 767

## Corrected results

| Physical Count state | Variants |
| --- | ---: |
| Matched Count 1 / Count 2 with positive Final Qty — Gate A eligible | 87 |
| Second count pending | 11 |
| Not counted | 669 |
| Count 1 populated | 98 |
| Count 2 populated | 87 |

The 87 matched variants span 12 hidden-draft eligible product families and 93 physical units. P049 and P050 retain their separately approved manual-authority packages and are not duplicated in these totals.

## Holds and commercial block

- P016 and P017 remain `second_count_pending`; no imagery or draft package is prepared for them.
- Gate A authorises a hidden visual-review draft only.
- Gate B remains blocked: ownership, condition, launch decision, launch quantity, approved pricing, Zoho, intranet, storefront reconciliation and production authority are incomplete.
- Zoho, intranet, the public catalogue and production remain unchanged.

The exact eligible variants, Archive SKUs and colour scopes are in `CORRECTED-STOCK-MANIFEST-20260714.json`.
