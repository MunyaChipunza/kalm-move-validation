# KALM draft logo, bottle and Outdoor correction

The rejected checkpoint `8c2be408671d4fe55aa08d9f8443d4b2c4997c55` is preserved by the pushed tag `checkpoint/rejected-draft-8c2be408-20260712`. This correction is a Netlify draft only: <https://6a53909af2cb280d611fe4da--kalm-collective-storefront.netlify.app>.

## Verified source artwork

The six required logos are the exact local targets recorded in `BRAND_ASSET_MAP.md`. The Drive source, source SHA-256 and local SHA-256 are recorded in the adjacent JSON. Five source/local pairs are byte-identical. KS Active deliberately uses the documented black-on-transparent mono derivative.

## Corrected retail experience

- Removed 46 rejected logo and inconsistent bottle assets after a zero-active-reference check. See `../KALM-DRAFT-REJECTION-20260712/rejected-assets.md` and `../KALM-DRAFT-REJECTION-20260712/rejected-asset-denylist.json`.
- The public Everyday, Slim Wellness and Studio Bottle products now expose one verified colour and one image only: Cream, Matte White and Stone respectively. Protein Shaker retains its four audited matching variants.
- The Outdoor collection begins with its approved logo, a concise customer-facing line and the three approved appliance cards. The nine unsourced accessories are hidden draft records.
- The Brands page uses the unique verified logos and now eagerly loads all five lifestyle panels. The current desktop evidence includes the recovered KALM Move adult man-and-woman walking scene and the KALM Outdoor adult hosting/cooking scene.

## Evidence

Desktop captures:

- `desktop-homepage-top.jpg`
- `desktop-brands-page.jpg`
- `desktop-outdoor-collection.jpg`
- `desktop-everyday-bottle.jpg`
- `desktop-slim-wellness-bottle.jpg`
- `desktop-studio-bottle.jpg`

Comparison sheets:

- `comparison-rejected-versus-verified-logo.webp`
- `comparison-typed-logo-versus-approved.webp`
- `comparison-bottle-silhouettes.webp`
- `comparison-outdoor-retail.webp`

The mobile validator passes at the required 375 × 812 breakpoint. Fresh 375 × 812 browser evidence is not included: the available capture backend retained a desktop viewport when explicitly set to 375 × 812, and its local review-frame navigation was blocked by browser policy. No desktop capture is presented as a mobile substitute.

## Validation

`netlify build`, syntax checking and all current catalog, draft-correction, rejected-asset, Outdoor, mobile-first, recovery and zero-paid-image validators passed. Production was not deployed or changed.

Status: awaiting Munya visual approval.
