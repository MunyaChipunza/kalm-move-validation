# External Zoho Image Upload Blocker

Generated: 2026-07-21T08:26:57.0661456+02:00

Status: blocked before any Zoho mutation.

## Verified local state

- Branch: `codex/kalm-image-library-inventory-thumbnails-20260720`
- Source HEAD: `c5e9e7747d8f88d2021501e318aeb2c94570dc72`
- Verified Zoho item mappings: 104
- Unique Zoho item IDs: 104
- Missing mapped thumbnail files: 0
- Verified Signature Tee Zoho mapping present: false

## What completed

- Zoho OAuth consent was completed by Munya.
- The callback returned an encrypted token bundle.
- The encrypted bundle was stored only in an ignored local temp path.
- A local uploader was prepared for the official Zoho Inventory item image endpoint: `POST /inventory/v1/items/{item_id}/image`.
- Dry-run audit was generated without changing any Zoho product, image, stock, price, or protected field.

## Blocker

Netlify masks secret environment values in the UI and CLI outside Netlify runtime. The extracted values for required runtime keys are masked placeholders, not usable secrets.

Affected keys:

- `ZOHO_ACCESS_TOKEN_ENCRYPTION_KEY`
- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_INVENTORY_ORGANIZATION_ID`
- `ZOHO_INVENTORY_DC_REGION`

Because the encrypted Zoho token bundle cannot be decrypted locally with masked values, the API uploader cannot authenticate and must not attempt the item-image upload.

## External changes

- Zoho items changed: no
- Zoho images uploaded: 0
- Intranet production deployed: no
- Storefront changed: no
- Munya task application changed: no

## Safe next options

1. Run the uploader with a real unmasked local env file supplied out-of-band and kept ignored.
2. Add a narrowly scoped server-side intranet image-upload function and run it in a Netlify runtime where the existing secrets are available, after explicit approval for that deployment path.
3. Use Zoho API credentials from a secure secret manager or direct local environment injection without printing or committing them.
