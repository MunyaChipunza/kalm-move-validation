# Product Pricing Audit

Date: 2026-07-08

## Scope

Checked `products.json` for sale logic, bundle sanity, obvious AI/random pricing and category-level price plausibility.

## Product Count

- Total products: 26
- Activewear: 11 styles
- Wellness: 5 styles
- Home: 5 styles
- Outdoor: 5 styles

## Sale Price Logic

All compare-at prices are higher than current selling prices.

| Product | Price | Compare at | Discount |
|---|---:|---:|---:|
| KS Active High Waist Seamless Leggings | R429 | R499 | 14% |
| KS Active High Waist Seamless Shorts | R319 | R379 | 16% |
| KALM Move Studio Starter Set | R899 | R999 | 10% |

No impossible sale structures found.

## Bundle Logic

The main bundle is `KALM Move Studio Starter Set`.

- Component reference prices: Everyday Movement Legging R549, Medium Support Sports Bra R429, Modest Performance Tee R349.
- Sum of component reference prices: R1,327.
- Bundle price: R899.
- Compare-at price: R999.

Result: pass. Bundle price is below the sum of individual items and compare-at price is still below the reference component total.

## Category Pricing

| Category | Range | Average | Assessment |
|---|---:|---:|---|
| Activewear | R299-R899 | R464 | Plausible for entry-to-mid premium activewear and KS archive pieces |
| Wellness | R259-R799 | R407 | Plausible for bottles, bands, recovery accessories and mat/towel sets |
| Home | R299-R1,299 | R675 | Plausible spread from mugs/diffusers to bedding |
| Outdoor | R399-R699 | R517 | Plausible for soft goods, picnic/outdoor accessories and lighting |

## Changes Required

No immediate price corrections required.

## Residual Risks

- Final landed costs and margins still need supplier quotes before production ordering.
- Product prices are retail-facing placeholders until supplier, shipping, duties and VAT assumptions are confirmed.
- KALM Move remains validation-ready, not bank-ready or production-ready.
