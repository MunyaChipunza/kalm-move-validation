# KALM Overnight No-Paid-Image Completion Report

Date: 2026-07-11 (SAST)
Production URL: https://kalmcollective.co.za
Production code SHA: `e244f825552f89c900474524cef81c730ac1647f`
Netlify deploy: `6a52b608d813d38d4986c54e`
Rollback point: `a5b459d4c8b65836e6775d9040729ba6f16d0e80`

## Release outcome

KALM Outdoor V2 is live on the approved production target. The release is photo-honest: existing approved appliance photography remains intact, while all nine new accessories are explicitly marked **Photography in production**, have no images, price, stock status, or Add to Bag action, and lead to the waitlist.

No paid image API, paid image service, external image-generation service, SVG mockup, generated concept image, or local diffusion output was used. Paid-image usage is **0**.

## KALM Move women recovery decision

- Audited 22 women products and 320 colour-image records (19 garment products and 3 bottle accessories).
- Reviewed all 19 local contact sheets and three conservative local mask candidates.
- Manifest outcome: 294 garment records deferred, 26 bottle records preserved, 0 approved v3 corrections, and 0 live v3 references.
- Production correction status: **withheld**. Existing production imagery stays live because no proposed correction passed 100% visual QA. This is a safety decision, not a claim that the existing imagery is corrected.

The recovery evidence is retained in [KALM-RECOVERY-FINAL-REPORT.md](KALM-RECOVERY-FINAL-REPORT.md), [kalm-move-women-local-repair-manifest.json](kalm-move-women-local-repair-manifest.json), and the review package under [multi-ai-review](multi-ai-review/).

## Outdoor V2 delivered

The exact coming-soon accessories are:

1. Ember Launch Pro Perforated Peel
2. Ember Turn Pro Turning Peel
3. Ember Dough & Heat Kit
4. Ridge Smart Temperature System
5. Ridge Pro Rotisserie Kit
6. Ridge Cast-Iron Sear System
7. Forge Pro Griddle Tool Roll
8. Forge Smash & Steam Kit
9. Forge Season & Care Kit

The six non-purchasable bundle-roadmap entries are Ember Essential, Pizza Night, Ridge Precision, Ridge Host, Forge Essential, and Forge Burger. The three approved appliance anchors are unchanged: Ember 16 Gas Pizza Oven, Forge 2 Portable Gas Griddle, and Ridge 4 Stainless Gas Braai.

The Outdoor experience now includes the premium hero, appliance anchors, compatibility filters, setup guidance, upcoming-accessory roadmap, care/protection guidance, appliance cross-sells, and a generic Netlify waitlist. The waitlist collects name, email, optional phone, accessory or bundle interest, compatible appliance, whether the customer owns that appliance, consent, and source. Local success, error, duplicate, and mobile flows were verified without submitting customer data to production.

## Evidence and verification

All local gates passed before release:

- `node --check script.js`
- `node tools/validate-catalog.mjs` — 69 products, 713 variants, 0 warnings, 0 errors
- `node tools/validate-kalm-move-women-branding.mjs` — 320 audited records, 0 approved repairs, 0 paid-image use, 0 live v3 references
- `node tools/validate-kalm-outdoor-v2.mjs` — 9 exact accessories, 6 bundles, 3 anchors, 0 live SVG references
- Netlify production build
- Desktop and mobile browser QA, including cart regression using temporary local test state only

Post-deploy checks passed on production without interacting with the pre-existing browser cart or submitting a waitlist form:

- Home route rendered.
- KALM Move Women rendered 22 cards with no missing product-image alt text.
- Forge compatibility filter returned exactly the three Forge accessories, with no prices and no Add to Bag controls.
- Ember accessory detail showed the photography-in-production and Join waitlist state, with no Add to Bag control.
- Ridge appliance detail cross-sold its three compatible accessories.
- The Outdoor mobile route rendered all nine named accessories and the waitlist.
- Production console errors: 0.

## Review package and rollout notes

The screenshot package, test results, known issues, production URL, deployment ID, and rollback SHA are in [multi-ai-review](multi-ai-review/). The package uses only approved imagery or explicit non-photographic status treatments.

NCC update: the complete release evidence has been recorded in this repository package. No external NCC connector or destination was configured, so no external message was sent.

Outstanding work is intentionally limited to approved accessory photography and supplier-confirmed details before any coming-soon accessory becomes purchasable, plus a future image-specific KALM Move women correction that passes visual QA.

## Morning verification

1. Open `https://kalmcollective.co.za/#/brand/kalm-outdoor` and confirm the nine named accessories display as coming soon with a waitlist CTA.
2. Open `https://kalmcollective.co.za/#/shop?brand=kalm-outdoor&appliance=kalm-outdoor-forge-2-portable-gas-griddle&availability=coming_soon` and confirm exactly the three Forge accessories appear without prices or Add to Bag controls.
3. Open `https://kalmcollective.co.za/#/product/kalm-outdoor-ember-launch-pro-perforated-peel` and confirm no product photography, price, stock, or purchase control is shown.
4. Open `https://kalmcollective.co.za/#/product/kalm-outdoor-ridge-4-stainless-gas-braai` and confirm the three Ridge accessory cross-sells.
5. Open `https://kalmcollective.co.za/#/shop?brand=kalm-move&audience=women` and confirm the existing 22-card women edit remains intact.
6. If rollback is required, restore `a5b459d4c8b65836e6775d9040729ba6f16d0e80` through the approved repository and production deployment workflow; do not use the prohibited legacy Netlify target.
