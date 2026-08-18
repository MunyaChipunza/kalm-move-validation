# KALM Production Deployment and Rollback

## Authoritative release path

- Repository: `MunyaChipunza/kalm-move-validation`
- Production branch: `master`
- Storefront site: `kalm-collective-storefront`
- Storefront site ID: `06334c13-7d82-45f1-b983-4a7295de88d8`
- Production URL: `https://kalmcollective.co.za`

Production releases use **only** the protected GitHub workflow:
`.github/workflows/kalm-production-release.yml`.

Local Codex must never run `netlify deploy --prod`, restore a production deploy, or upload arbitrary files. The workflow locks the approved master SHA, validates release provenance and the exact site ID, records the previous deploy, deploys the generated publish directory, performs live smoke checks, and restores the previous deploy if those smoke checks fail.

## Required release gates

Before merging to `master`, the release candidate must pass catalogue, PayFast, inventory, workflow, source-root and rendered-preview validation. The protected production workflow then runs the same verification against the exact merged commit, followed by the live custom-domain smoke test.

## Rollback

The production workflow records the previous immutable deploy and automatically restores it when a post-deploy smoke check fails. For any later rollback, create a normal corrective commit, run the same release gates, and release it through the protected workflow. Never rewrite history or use a manual Netlify production deploy.

## Separation

The Munya task application and the KALM intranet are separate Netlify sites. No storefront release may target, link, deploy or restore either of them.
