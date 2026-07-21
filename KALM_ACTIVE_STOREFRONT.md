# KALM active storefront

C:\CodexWork\kalm-production-release-hardening is the only active local KALM storefront source. Its canonical remote is https://github.com/MunyaChipunza/kalm-move-validation.git; only master may be released.

## Approved release path

The only production path is .github/workflows/kalm-production-release.yml. Normal storefront production releases run automatically after an accepted protected master merge that changes approved storefront build inputs. Explicit workflow_dispatch remains available for an intentional release of an exact merged master commit. No second GitHub production-environment reviewer approval is required for normal releases. The workflow builds .release-output/kalm-production with node tools/kalm-production-release.mjs --mode preflight and publishes only from that child directory.

- Production Netlify site: 06334c13-7d82-45f1-b983-4a7295de88d8 (kalmcollective.co.za).
- Latest approved release-control commit: ac6c9c554494dd91d80731ec0c5921347a36ef4a.
- Latest verified production deployment remains the restored fallback 6a58f4cdabe29c0e28697f09; this cleanup does not publish production.
- External preview deployment is intentionally not configured. kalm-preview may be used only for its constrained local preview path; it must not create, link, or publish a Netlify site.
- Emergency rollback remains manually dispatchable through .github/workflows/kalm-production-rollback.yml.

Forbidden: direct netlify deploy, netlify deploy --prod, netlify deploy -p, arbitrary-directory deployment, local production restore/rollback, or use of any archived source as a build input.

Verified historical source is quarantined under C:\CodexArchive\KALM\legacy-storefronts\. Archives are records, never build or deployment roots. Read .kalm-approved-release-root and run node scripts/check-forbidden-legacy-storefront.mjs --root . before every KALM build.
