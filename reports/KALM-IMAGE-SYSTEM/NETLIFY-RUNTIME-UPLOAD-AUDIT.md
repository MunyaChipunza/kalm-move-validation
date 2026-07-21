# Netlify Runtime Zoho Image Upload Audit

Generated: 2026-07-21T09:46:48.7119799+02:00

## Runtime project selected

- Project: `kalm-collective-intranet`
- Site ID: `52adadfd-1d6b-4128-9df1-575614f2f1df`
- Production URL: `https://intranet.kalmcollective.co.za`
- Current production deploy observed: `6a524ee9c4b21fb99ed3a4d7`
- Reason selected: this is the existing internal KALM Ops intranet project where Zoho Inventory OAuth integration already operates.
- Explicitly not selected: public storefront `kalm-collective-storefront`, Munya task app `inquisitive-pastelito-bd6463`.

## Local runtime function implementation

- Clean worktree: `C:\CodexWork\kalm-intranet-thumbnail-preview`
- Branch: `codex/zoho-image-runtime-upload-20260721`
- Local commit: `d4581872abde441e5af9df4ca1b82683e67cfbf7`
- Function path: `netlify/functions/zoho-image-upload-runner.mts`
- Function route: `/api/internal/zoho-image-upload-runner`
- Included manifest: `netlify/functions/_zoho-image-upload/verified-thumbnail-manifest.json`
- Included thumbnails: `public/inventory-thumbnails/**/*.webp`

The function was implemented with:

- Bearer-token protection using `KALM_ZOHO_IMAGE_RUN_TOKEN`
- non-production context guard
- fixed operation allowlist: `STATUS`, `DRY_RUN`, `PILOT`, `VERIFY_PILOT`, `APPLY`, `VERIFY_ALL`
- fixed 104-item Zoho allowlist
- thumbnail SHA-256 verification before upload
- Zoho item ID and SKU identity checks
- protected-field before/after comparison
- item-image-only mutation path
- generic error responses without secrets

## Local validation

- TypeScript/build validation: passed
- Unit tests: passed
- Mapping validation: 104 VERIFIED records
- Unique Zoho item IDs: 104
- Missing thumbnail files: 0

## External blockers

Completion is blocked before any Zoho mutation for two independent reasons:

1. Netlify non-production contexts currently expose no Zoho runtime variables through `netlify env:list --context deploy-preview` or `netlify env:list --context branch-deploy`.
2. The clean intranet worktree has no Git remote configured, so a required Git-based branch deploy cannot be pushed from that checkout.

The existing Zoho values appear restricted outside non-production runtime and remain masked. They were not printed, copied into Git, or exposed in reports.

## External mutation status

- Zoho images uploaded: 0
- Zoho protected fields changed: 0
- Intranet production deployed: no
- Public storefront changed: no
- Munya task application changed: no
- Temporary external mutation endpoint live: no
- Temporary execution token created in Netlify: no

## Required next unblock

Provide a Git-connected intranet source remote/branch target for `kalm-collective-intranet`, and make the existing Zoho runtime env values available to that exact non-production branch context without revealing them. After that, deploy the branch through the connected Netlify Git workflow and run `STATUS`, `DRY_RUN`, `PILOT`, `VERIFY_PILOT`, `APPLY`, and `VERIFY_ALL`.
