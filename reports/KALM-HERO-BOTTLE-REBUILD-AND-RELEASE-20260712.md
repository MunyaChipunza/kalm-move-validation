# KALM Hero and Bottle Rebuild — Release Record

## Draft gate

- Branch: `codex/kalm-hero-bottle-rebuild-and-release-20260712`
- Draft deploy: `6a540ac0d1158cb5eb707566`
- Draft URL: <https://6a540ac0d1158cb5eb707566--kalm-collective-storefront.netlify.app>
- Production commit: `882d8f84b84ba8d25ced1d0975dcf24b4c233762`
- Production deploy: `6a540dc418f635bbf3009367`
- Immutable production URL: <https://6a540dc418f635bbf3009367--kalm-collective-storefront.netlify.app>
- Production URL: <https://kalmcollective.co.za>
- Rollback tag: `rollback/kalm-before-hero-bottle-rebuild-20260712` → `cde8186d1490a42e86fcc9759111f4a0318b6332`
- Production status at this record: verified live.

## Replacement scope

The rejected campaigns-V2 six-person hero and bottles-V2/V3 families have been removed from active mappings. Historical files are retained strictly as audit evidence. The site now maps the homepage hero to `assets/images/recovered/campaigns-v3/` and all five bottle records to `assets/images/products/kalm-move/bottles-v4/`.

| Product | Colours | Public views per colour | Availability |
| --- | ---: | ---: | --- |
| Everyday Bottle | Black, Cream, Lilac, Sky Blue | 2 | Orderable |
| Slim Wellness Bottle | Matte White, Stone, Soft Pink, Sage | 2 | Orderable |
| Studio Bottle | Black, Stone, Lilac, Sky Blue | 2 | Orderable |
| Protein Shaker Bottle | Black, Charcoal, Navy, Smoke Grey | 2 | Orderable |
| All-Day Straw Tumbler | Black, Cream, Lilac, Sky Blue | 2 | Coming soon; non-purchasable |

## Visual gate

- The campaigns-V3 desktop, tablet and dedicated mobile assets were inspected; each preserves exactly three adult men and three adult women.
- Garment marks appear as small integrated fabric treatments in the supplied hero composition; no public overlay or white-mark repair is used.
- All 40 V4 bottle public images are 1122 × 1402 WebP files made from new native masters, with one conversion only.
- Each colour gallery has a full front and alternate view. No enlarged crop is active as a gallery image.
- Draft screenshots confirm desktop/mobile rendering, the two accessories collections, selected-colour bag imagery and selected-colour checkout imagery.
- Existing KALM Move women’s apparel image files were unchanged from `e24be9936317898b07d6ccf4dd357abe9cf8eb93`.
- The production domain returns the campaigns-V3 desktop and mobile paths, maps each bottle record exclusively to bottles-V4, and returns two decoded 1122 × 1402 gallery images for every reviewed colour.
- The production bag and checkout both show the selected Sky Blue Studio Bottle image. The All-Day Straw Tumbler page shows Coming soon with no add-to-bag control.
- The production payload targeted Netlify site `kalm-collective-storefront` (`06334c13-7d82-45f1-b983-4a7295de88d8`) only; the separate Munya task application was not altered.

## Evidence index

- `HERO-REVIEW-SHEET.jpg` — responsive hero and garment-branding crops.
- `BOTTLE-SHARPNESS-AND-BRANDING-CROPS.jpg` — full-resolution V4 bottle logo/edge crops.
- `BEFORE-AND-AFTER-COMPARISON.jpg` — historical inactive V2/V3 references against active V3/V4 replacements.
- `bottle-contact-sheets/` — one sheet per bottle family and complete range sheet.
- `draft-screenshots/` — customer-facing draft pages and interaction proof.
- `production-screenshots/homepage-desktop-1440x1000.png` and `homepage-mobile-375x812.png` — live responsive homepage.
- `production-screenshots/*-loaded-desktop-1440x1000.png` — live, decode-gated product galleries for all five bottle families.
- `production-screenshots/men-accessories-loaded-desktop-1440x1000.png` and `women-accessories-loaded-desktop-1440x1000.png` — live accessories placement.
- `production-screenshots/studio-sky-blue-bag-desktop-1440x1000.png` and `studio-sky-blue-checkout-desktop-1440x1000.png` — selected-colour bag and checkout evidence.
- `production-screenshots/tumbler-coming-soon-loaded-mobile-375x812.png` — live non-purchasable tumbler state.
- `final-asset-manifest.json` — source and public SHA-256 values.
- `validation.json` — final-rebuild validation result.

## Validation

All applicable catalogue, image-dimension, rejected-asset, zero-paid-image, move men, outdoor, recovery, mobile-first, final-rebuild and 173 comprehensive checks passed before release.
