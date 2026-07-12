# KALM Move Bottles — Stage 2 release evidence

Release candidate: `92b3216d2feba18e282b289db95c56509f9d0140`  
Branch: `codex/kalm-move-bottles-stage2-20260712`  
Stage 1 source: `7dcab8867be78ff133e1debf5518736120ca6472`  
Draft deploy: https://6a53ccb972c185e4420af41d--kalm-collective-storefront.netlify.app  
Draft deploy ID: `6a53ccb972c185e4420af41d`

## Scope and authority

This is the authorised Stage 2 integration of the five Munya-approved Stage 1 KALM Move bottle image sets. It is limited to KALM Move accessories. No Outdoor, Home, Wellness, unrelated apparel, navigation architecture, or task application files are included. Every public image is a byte-for-byte copy of its Stage 1 review asset; the 60 source and destination SHA-256 values are recorded in [product-image-manifest.json](product-image-manifest.json).

The required production baseline was `699c571f9a5462688a935482ec88f2af38f7e2d2`; the rollback tag `checkpoint/pre-kalm-bottles-stage2-20260712` points to that commit.

## Catalogue result

| Product | Colours | Price / availability | Collections | Gallery |
| --- | --- | --- | --- | --- |
| Everyday Bottle | Black, Cream, Lilac, Sky Blue | R279, purchasable | Men and Women accessories | 3 views per colour |
| Slim Wellness Bottle | Matte White, Stone, Soft Pink, Sage | R299, purchasable | Women accessories | 3 views per colour |
| Studio Bottle | Black, Stone, Lilac, Sky Blue | R329, purchasable | Women accessories | 3 views per colour |
| Protein Shaker Bottle | Black, Charcoal, Navy, Smoke Grey | R249, purchasable | Men and Women accessories | 3 views per colour |
| All-Day Straw Tumbler | Black, Cream, Lilac, Sky Blue | Coming soon; no price, stock, add-to-bag, checkout or waitlist CTA | Men and Women accessories | 3 views; default Black shown |

The All-Day Straw Tumbler remains a provisional concept pending the supplier/sample lock. It is visible but cannot be purchased or checked out.

## Draft verification

The immutable draft was tested at desktop and 375 x 812 mobile:

- Women accessories contains the five scoped items: Protein Shaker, Everyday, Slim Wellness, Studio and All-Day.
- Men accessories contains Protein Shaker, Everyday and All-Day.
- Each existing bottle product renders its three-image gallery, colour selector and Add to Bag control.
- Selecting Everyday Bottle `Lilac`, selecting `One size`, and adding to bag shows `assets/images/products/kalm-move/bottles-v2/everyday-bottle/lilac/front.jpg` in the bag with the Lilac selection.
- The All-Day mobile product detail contains no price, colour selector, Add to Bag, checkout control or data waitlist; it retains the approved customer-facing coming-soon description.

### Evidence files

- [Desktop Women accessories](evidence/draft-desktop-women-accessories.png)
- [Desktop Men accessories](evidence/draft-desktop-men-accessories.png)
- [Desktop Everyday Bottle](evidence/draft-desktop-everyday-bottle.png)
- [Desktop Slim Wellness Bottle](evidence/draft-desktop-slim-wellness-bottle.png)
- [Desktop Studio Bottle](evidence/draft-desktop-studio-bottle.png)
- [Desktop Protein Shaker Bottle](evidence/draft-desktop-protein-shaker-bottle.png)
- [Desktop All-Day Straw Tumbler](evidence/draft-desktop-all-day-straw-tumbler.png)
- [Mobile Women accessories](evidence/draft-mobile-women-accessories.png)
- [Mobile Everyday Bottle — Lilac](evidence/draft-mobile-everyday-bottle-lilac.png)
- [Mobile bag — Everyday Bottle Lilac](evidence/draft-mobile-everyday-bottle-lilac-bag.png)
- [Mobile All-Day Straw Tumbler](evidence/draft-mobile-all-day-straw-tumbler.png)

## Validation

All relevant checks passed against the release candidate:

- `node --check script.js`
- `node tools/validate-catalog.mjs` — 70 products, 716 variants, 0 warnings, 0 errors
- `node tools/validate-draft-corrections.mjs`
- `node tools/validate-kalm-move-men-v4.mjs` — 10 products, 42 active non-bottle V4 colours, 46 historical assets
- `node tools/validate-kalm-move-women-branding.mjs` — 19 recovered women images and 12 Studio bottle images
- `node tools/validate-kalm-zero-paid-images.mjs` — 0 non-excepted paid-image usages; 60 authorised Stage 2 bottle assets
- `node tools/validate-mobile-first-v4.mjs` — 913 public paths, including 375 px coverage
- `node tools/validate-rejected-assets.mjs`
- `node tools/validate-kalm-move-bottles-stage2.mjs` — five scoped products and 60 hash-verified assets
- `node tools/validate-kalm-outdoor-v2.mjs`
- `python tools/validate-product-image-dimensions.py` — 575 public paths
- JSON parse of `products.json`

No rejected V1/CAD-style bottle asset, historical mixed-silhouette bottle asset, Drive path, or legacy bottle public image path is referenced by the active records.

## Release state

At the time this evidence pack was assembled, the Netlify draft above is live and production is intentionally still on the previous deploy `6a5399df38d1843624b586fb`. This report accompanies the authorised promotion sequence; the exact production deploy ID and health verification will be recorded in NCC only after the production deploy is live.
