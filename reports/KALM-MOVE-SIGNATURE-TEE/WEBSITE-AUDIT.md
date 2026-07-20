# KALM Move Signature Tee — website audit

## Scope and source state

- Branch: `codex/kalm-move-signature-tee-merchandising-20260720`
- Source storefront commit: `91511c00c080dd7b6148df950191af525316a297`
- Delivery mode: unlinked Netlify draft preview only — deploy `6a5e0c3e549b5328b60761ff`
- Production, Paystack, courier configuration, product availability, price, variants and imagery: out of scope and unchanged.

The current NCC / soul context, Launch Readiness Control, Product Imagery Generation Bible and existing KALM Move / Signature Tee implementation were reviewed before the change. `docctl doctor` was invoked as requested by workspace policy; `docctl` is not available in this desktop environment. No document editing is required for this storefront-only change.

## Production baseline observed

The live production homepage begins with KS Active Archive commerce. The Signature Tee was previously surfaced as **KALM Collective** at R699, with Black and White variants and model-first imagery. The KALM Move page contained its 34 Launching Soon products only.

The live product route retains the exact customer product identity, URL, R699 price, Black and White variants, S–2XL sizes, commerce availability and model-first Black/White image galleries. No supplied private imagery, source image or personal likeness is introduced.

## Customer-facing result in this draft

- The Signature Tee is now branded **KALM Move**; KALM Collective remains its parent umbrella.
- The homepage places the Signature Tee feature immediately after the KS Active hero, with Black and White adult-model imagery, R699 and both approved calls to action.
- The tee is the first item in a meaningful homepage product grid.
- `/brand/kalm-move` now starts with the available tee, then preserves all 34 existing Launching Soon items with their wishlist, notify-me and commerce locks unchanged.
- The product detail breadcrumb and brand link point to KALM Move; title, slug, price, variants, availability and asset paths remain unchanged.
- Generic product search prioritises purchasable matches and separates Launching Soon KALM Move previews.
- Direct KALM Move and Signature Tee visits resolve assets from the storefront root, and multi-word searches such as `Signature Tee` match the approved Tee title.

## External and privacy controls

- No OneDayOnly form was opened, edited or submitted.
- No OneDayOnly submitted company or product name was changed.
- The internal mapping record is retained in this report directory only; `/reports/KALM-MOVE-SIGNATURE-TEE/*` returns a Netlify 404 on the draft.
- No Paystack file, courier file, payment configuration or task-application configuration is changed.
- The Munya task application is not referenced as a deployment target.

## Validation

See [VALIDATION.json](VALIDATION.json) for the focused 18-check result, and the existing KALM Move, Signature Tee, ODO, commercial hierarchy, mobile-layout and rejected-asset validation outputs for regression coverage.
