# Product Pricing Audit

Date: 2026-07-09

## Scope

Checked `products.json` for sale logic, bundle sanity, obvious AI/random pricing and category-level price plausibility.

## Product Count

- Total products: 46
- Activewear: 28 styles
- Wellness: 5 styles
- Home: 5 styles
- Outdoor: 8 styles

## Sale Price Logic

All compare-at prices are higher than current selling prices.

| Product | Price | Compare at | Discount |
|---|---:|---:|---:|
| KS Active High Waist Seamless Leggings | R429 | R499 | 14% |
| KS Active High Waist Seamless Shorts | R319 | R379 | 16% |
| KALM Move Rise Long Sleeve Set | R699 | R769 | 9% |

No impossible sale structures found.

## Bundle Logic

The previous `KALM Move Studio Starter Set` bundle has been removed from the live product data as part of the supplier-reference women range reset.

Current bundle/set-style products are priced as standalone sets. No bundle is currently presented as a priced discount against separately sold components, so there is no component-sum bundle test to run in this pass.

## Category Pricing

| Category | Range | Average | Assessment |
|---|---:|---:|---|
| Activewear | R249-R899 | R458 | Plausible for entry-to-mid premium activewear, KS archive pieces and supplier-reference KALM Move sets |
| Wellness | R259-R799 | R407 | Plausible for bottles, bands, recovery accessories and mat/towel sets |
| Home | R299-R1,299 | R675 | Plausible spread from mugs/diffusers to bedding |
| Outdoor | R399-R14,999 | R4,010 | Outdoor now includes soft goods plus higher-ticket braai/cooking products, so the broader range is intentional but still needs landed-cost validation |

## Changes Required

No immediate price corrections required.

## Residual Risks

- Final landed costs and margins still need supplier quotes before production ordering.
- Product prices are retail-facing placeholders until supplier, shipping, duties and VAT assumptions are confirmed.
- KALM Move remains validation-ready, not bank-ready or production-ready.
