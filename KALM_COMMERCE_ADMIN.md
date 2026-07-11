# KALM Commerce Admin

KALM Commerce is the authenticated intranet module for managing public KALM Collective catalogue data. The public storefront remains the static storefront in this repository and continues to read `products.json`.

## Architecture

- Source of truth: `products.json` in `MunyaChipunza/kalm-move-validation`.
- Public target: `kalm-collective-storefront`, Netlify site ID `06334c13-7d82-45f1-b983-4a7295de88d8`.
- Admin target: the authenticated KALM ops intranet.
- Browser clients must never receive GitHub, Netlify, OpenAI, Zoho, or deployment tokens.
- Publishing must happen through server-side intranet functions.

## Admin Sections

- Dashboard: catalogue health, stock warnings, validation state and latest publish state.
- Products: searchable catalogue list with product status, imagery and variant summaries.
- Inventory: product and variant stock controls.
- Media: hero, gallery and colour image checks.
- Publishing: validation, publish readiness, deployment target and rollback status.
- Activity Log: audit trail for catalogue changes.

## Publishing Flow

1. Admin loads the current catalogue revision.
2. User saves a draft change.
3. Server validates catalogue schema, images, stock and duplicate keys.
4. Server writes an atomic Git commit to the storefront repository.
5. Server triggers the KALM storefront Netlify deployment.
6. Admin verifies live `products.json` and storefront render state.

## Required Server Environment

- `KALM_STOREFRONT_GITHUB_TOKEN`
- `KALM_STOREFRONT_REPO`
- `KALM_STOREFRONT_BRANCH`
- `KALM_STOREFRONT_NETLIFY_SITE_ID`
- Optional: `KALM_STOREFRONT_NETLIFY_BUILD_HOOK_URL`

Do not store actual secret values in this repository.

## Current Limitation

The storefront supports the inventory schema and validation now. The intranet can expose commerce screens and read catalogue health. Durable write/publish from the intranet requires the server-side GitHub and Netlify environment variables above.
