# KALM Final Draft Corrections — 12 July 2026

## Draft-only release record

| Item | Value |
| --- | --- |
| Comprehensive implementation base | `09bead28592a9c23c44967284b4a6305980a4ebb` |
| Comprehensive evidence head | `17d8789aee159810a1ab3bebd0095a97627bfb08` |
| Correction branch | `codex/kalm-final-draft-corrections-20260712` |
| Main correction commit | `94108bdf485687e58264cad22a26f1a424ff0f66` |
| Runtime colour-preview correction | `1023eccc9c4c1f1791401ac3b0dc78701b7deb07` |
| Approved Stage 1 bottle source | `7dcab8867be78ff133e1debf5518736120ca6472` |
| Netlify draft deploy | `6a53f4d72226c77cbea93ce2` |
| Draft URL | `https://6a53f4d72226c77cbea93ce2--kalm-collective-storefront.netlify.app` |
| Production deploy / master | unchanged: `6a53ce7fb63d08e5a8f70e8a` / `cde8186d1490a42e86fcc9759111f4a0318b6332` |

This is a combined review draft only. It was deployed without `--prod`; no production alias, production branch, merge, or Munya task application was changed.

## Corrections completed

### 1. Bottle integration

- Restored all 60 approved Stage 1 masters byte-for-byte into fresh `assets/images/products/kalm-move/bottles-v3/` paths.
- Updated every scoped bottle mapping from the cache-risk `bottles-v2` route to `bottles-v3` and versioned the application/runtime URLs.
- The source-to-output SHA-256 pairs all match. See `CORRECTED-ASSET-MANIFEST.json` and `ROOT-CAUSE-BOTTLES.md`.
- The five required KALM Move bottle products are active in their intended collections. The All-Day Straw Tumbler is still Coming soon and non-purchasable; it now supports non-purchasing colour preview so the Cream URL correctly displays the Cream V3 image set.
- Live proof: Studio Bottle selected as Sky Blue adds a bag image at `assets/images/products/kalm-move/bottles-v3/studio-bottle/sky-blue/front.jpg` and the drawer states `Colour: Sky Blue / Size: One size`.

### 2. KALM Move apparel-logo audit

- Audited 26 active non-accessory KALM Move product families and 138 active colour hero variants across collection cards and PDP gallery sources.
- The current active assets render the recognisable approved KALM buffalo treatment. The supplied issue screenshots are retained as historical review-baseline evidence, not used as active assets.
- No unsafe direct retouching or broad regeneration was introduced: the source audit confirmed the existing clean images were the correct authority. `LOGO-AUDIT.md` lists product, slug, active paths, issue assessment, method and final status.
- Fresh PDP evidence covers the women’s issue set (Ease Flare, Form Short, Wide-Leg Yoga Pant, Balance X-Back and Halter Biker), the Open Back Short Romper and the Core Performance Tee.

### 3. Homepage campaigns

- Corrected the six-person hero directly using the exact approved buffalo alpha source (`994b2e455cb441eaa1b04b26899a13ebb096fc389d59c64718bc5140ecda7ea2`), with subtle, physically placed garment marks for all six people.
- Corrected the Featured Collection performance image with the same approved buffalo treatment on the visible KALM Move shirt.
- New responsive source paths are under `assets/images/recovered/campaigns-v2/`. The draft serves the V2 campaign assets; source and visual comparisons are included below.

## Validation

All checks pass.

- Dedicated final-correction validator: 15/15.
- Comprehensive storefront validator: 173/173.
- Catalogue: 70 products, 716 variants, 0 errors, 0 warnings.
- Bottle-stage validator: 5 scoped products, 60 approved copied assets, All-Day non-purchasable.
- KALM Move women branding, men V4, rejected-assets, product-image dimensions, mobile-first, Outdoor, Drive-recovery and zero-paid-image validators all passed.
- The final draft publish directory excluded `reports/`; requesting its `reports/.../VALIDATION.json` returns HTTP 404.

## Review evidence

- `ROOT-CAUSE-BOTTLES.md`
- `LOGO-AUDIT.md`
- `CORRECTED-ASSET-MANIFEST.json`
- `VALIDATION.json`
- `APPROVED-VS-SMUDGED-VS-CORRECTED-BOTTLES.jpg`
- `WRONG-LOGO-VS-CORRECTED-LOGO-COMPARISON.jpg`
- `HERO-CORRECTION-COMPARISON.jpg`
- `MAN-WITH-SWEATER-CORRECTION-COMPARISON.jpg`
- `CAMPAIGN-CORRECTED-ASSETS.jpg`
- `DESKTOP-SCREENSHOT-CONTACT-SHEET.jpg`
- `MOBILE-SCREENSHOT-CONTACT-SHEET.jpg`
- `screenshots/` contains exact 375 × 812, 390 × 844, 430 × 932 and 1440 × 1000 captures, with page-state JSON for product routes, collection placement, Cream preview, bag colour matching, served campaign assets and report-publish isolation.

Munya visual approval is still required before any production action.
