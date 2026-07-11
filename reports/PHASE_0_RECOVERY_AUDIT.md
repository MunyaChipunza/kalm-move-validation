# Phase 0 Recovery Audit

Date: 2026-07-11

## Repository

- Storefront repository: `MunyaChipunza/kalm-move-validation`
- Working branch: `kalm-storefront-recovery-20260711`
- Starting SHA: `a5b459d4c8b65836e6775d9040729ba6f16d0e80`
- Recovery checkout: `C:\Users\Dell\AppData\Local\Temp\kalm-variant-fix-recovery-work-20260711194209`
- Git remote: `https://github.com/MunyaChipunza/kalm-move-validation.git`

## Workspace Recovery

The previous `robocopy` recovery path was stopped after it exceeded the 10-minute blocker rule. The partial destination was preserved as requested:

- `G:\My Drive\kalm-variant-fix-work.partial`

Direct Git clone and checkout attempts into `G:\My Drive` failed because the Drive path refused `.git` and ordinary file creation. A Git bundle was created from the clean local storefront checkout and cloned into the temp recovery workspace so work could continue without retrying the failed copy method.

## Storefront Inventory

- `products.json` exists.
- Product image assets under `assets/images/products`: 826 files.
- Branding assets under `assets/branding`: 9 files.
- Netlify storefront target remains `kalm-collective-storefront`, site ID `06334c13-7d82-45f1-b983-4a7295de88d8`.

## Intranet Discovery

The public storefront and authenticated intranet are separate systems:

- Public storefront local source: `C:\Users\Dell\codex-work\kalm-variant-fix`
- Public storefront repo: `MunyaChipunza/kalm-move-validation`
- Authenticated intranet candidate: `C:\Users\Dell\codex-work\kalm-ops-intranet-qa-20260711`
- Task app repo: `C:\Users\Dell\codex-work\munyaapp`

The intranet app contains:

- Netlify edge authentication in `netlify/edge-functions/auth.js`
- KALM Commerce UI in `src/pages/CommercePage.tsx`
- Commerce API client in `src/services/commerceApi.ts`
- Server-side commerce API boundary in `netlify/functions/_commerce/api.ts`
- Existing ecommerce endpoints under `/api/ecommerce/*`

The task app repository is separate and was not modified.

## Validation Evidence

- `node --check script.js`: pass.
- `node tools/validate-catalog.mjs`: pass.
- Catalogue summary: 60 products, 713 variants, 0 warnings, 0 errors.
- Secret scan for OpenAI and Netlify token patterns: pass.
- Customer-facing copy scan: no active `KALM Living`, `Buffalo-branded`, `manual setup`, or `image to be confirmed` copy found in storefront runtime files.

## Current Blockers

| blocker | completed work | exact missing item | user action required | resume command | risk |
|---|---|---|---|---|---|
| `G:\My Drive` denies ordinary file creation and `.git` writes | Partial destination preserved; clean Git recovery checkout created in temp | Writable persistent Drive checkout | None during this run; continuing from temp | `powershell -ExecutionPolicy Bypass -File scripts/resume-kalm-recovery.ps1` | Temp workspace is less durable than Drive |

## Next Automatic Action

Continue with local QA, preserve execution state, commit the recoverable state locally, then attempt only the authorised storefront push/deploy path if the environment permits.
