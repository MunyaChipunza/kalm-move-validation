# KALM temporary production working baseline — 12 July 2026

## Release

- Previous `origin/master`: `f48695998fe9ae89b594ea92859f2606f54433ed`
- Previous production release SHA: `709403ba6198329300c33a5cf07f53100c251738`
- Previous production deploy: `6a52cf678ede622c9112c7c3` (`2026-07-11T23:20:01.691Z`)
- Safety tag: `checkpoint/pre-a0b919a-production-20260712` (annotated, points to `f48695998fe9ae89b594ea92859f2606f54433ed`)
- Promoted and deployed storefront commit: `a0b919a00e956200f3d7e11ff06f8ff0c0600ee2`
- Production deploy: `6a5399df38d1843624b586fb`, published `2026-07-12T13:43:00.194Z`
- Production URL: https://kalmcollective.co.za
- Immutable deploy URL: https://6a5399df38d1843624b586fb--kalm-collective-storefront.netlify.app
- Netlify site: `kalm-collective-storefront` / `06334c13-7d82-45f1-b983-4a7295de88d8`

`master` was fast-forwarded only and pushed. The rejected-draft checkpoint `checkpoint/rejected-draft-8c2be408-20260712` was left untouched.

## Validation

`npm ci` and `npm run build` were run as requested. They are not applicable to this static repository because it has no `package.json` or package lockfile; both reported the expected missing-manifest error. This is recorded rather than treated as a hidden pass.

The following passed on exact master commit `a0b919a`:

- `node --check script.js`
- `node tools/validate-catalog.mjs` — 69 products, 703 variants, no errors
- `node tools/validate-draft-corrections.mjs`
- `node tools/validate-rejected-assets.mjs` — 46 deleted paths, five approved brand logos, nine Outdoor accessories hidden
- `node tools/validate-kalm-outdoor-v2.mjs`
- `node tools/validate-kalm-move-women-branding.mjs`
- `node tools/validate-kalm-move-men-v4.mjs` — 11 products, 46 active V3 assets
- `node tools/validate-mobile-first-v4.mjs`
- `node tools/validate-drive-recovery.mjs`
- `node tools/validate-kalm-zero-paid-images.mjs`
- `python tools/validate-product-image-dimensions.py` — 522 public paths
- `products.json` JSON parse and `git diff --check`
- `netlify.cmd build`

There is no separate broken-link/broken-image validator in `tools/`; the catalogue and image-dimension validators plus direct production checks were used. Public source checks found no Drive paths and no rejected women V3, Outdoor generated-render, or corrupted Studio Bottle references.

## Live verification

The production alias and immutable deploy URL returned identical HTML SHA-256 values: `25CC0448F2E0D873D36EA11C946D1B28D3AE275507B3BA8B30365953476A6222`. Public `products.json` exposes 69 products and the deployed recovered Move and Outdoor brand-hero paths.

- Brands page: five distinct approved brand-logo files are live; no common-buffalo override; no broken images; no horizontal overflow at a verified 375×812 CSS viewport.
- Outdoor: visible appliance cards are Ember 16 Gas Pizza Oven, Forge 2 Portable Gas Griddle, and Ridge 4 Stainless Gas Braai. The prohibited development copy and dark-green development hero are absent; no coming-soon cards are public.
- Bottles: Everyday is Cream only, Slim Wellness is Matte White only, Studio is Stone only. Each has one gallery image with no thumbnails, dots, or `1 / 1` counter. Protein Shaker has Black, Charcoal, Navy, and Smoke Grey; live selection changed its image to Navy and Smoke Grey correctly. Adding Navy to the bag retained the matching Navy image.
- Search, bag drawer, checkout, contact/policy route, footer, navigation, and `products.json` were checked on the custom domain. Checkout rendered the order form without submitting an order.
- Page checks reported no broken loaded images and no horizontal overflow at the verified mobile viewports. The only browser console error was a browser-extension connection message, not a storefront runtime error.
- The task application remained separate and identified itself as `Munya App`; it was not redirected or overwritten.

## Production evidence

Fresh production evidence is in [screenshots](KALM-PRODUCTION-BASELINE-A0B919A-20260712/screenshots/). Confirmed CSS viewport dimensions and encoded JPEG dimensions were asserted before each saved capture.

- `production-home-mobile-375x812-exact.jpg`
- `production-search-mobile-375x812.jpg`
- `production-home-mobile-390x844.jpg`
- `production-protein-shaker-black-mobile-430x932.jpg`
- `production-home-desktop-1440x1000.jpg` — assembled from four exact browser tiles from one 1440×1000 viewport; no page content was altered
- `production-mobile-evidence-contact-sheet.jpg`
- `production-desktop-evidence-contact-sheet.jpg`

Known visual-evidence limitation: the browser backend intermittently imposed a five-second screenshot cap. It was overcome for the listed exact mobile captures and tiled desktop homepage. DOM/live-route checks were completed for the remaining required surfaces, but a full fresh image for every requested route was not reliably capturable in this backend. This does not change the deployed storefront and is a remaining review-pack limitation, not an assertion of final visual approval.

## Rollback

- Git baseline: `checkpoint/pre-a0b919a-production-20260712`
- Previous Netlify production deploy reference: `6a52cf678ede622c9112c7c3` / https://6a52cf678ede622c9112c7c3--kalm-collective-storefront.netlify.app
- Netlify rollback command (only with explicit production rollback authority): `netlify.cmd api rollbackSiteDeploy --data '{"site_id":"06334c13-7d82-45f1-b983-4a7295de88d8","deploy_id":"6a52cf678ede622c9112c7c3"}'`
- Git inspection command: `git show checkpoint/pre-a0b919a-production-20260712`

## Operating state

This is a temporary working baseline. Future work is brand-by-brand under [KALM-BRAND-BY-BRAND-RELEASE-WORKFLOW.md](../docs/KALM-BRAND-BY-BRAND-RELEASE-WORKFLOW.md). No new brand work was started in this release task. Each future increment requires its own draft, evidence, Munya visual approval, rollback point, and only then production authority.
