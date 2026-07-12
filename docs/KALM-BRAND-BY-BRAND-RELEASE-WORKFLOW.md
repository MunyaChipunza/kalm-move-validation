# KALM brand-by-brand release workflow

## Temporary production baseline

Commit `a0b919a00e956200f3d7e11ff06f8ff0c0600ee2` is the temporary production working baseline for the KALM Collective storefront.

This means the public storefront is operationally usable, but it is not final visual approval for every brand, product image, mobile layout, or page. KALM will now evolve through bounded, approved releases for one brand or one clearly defined site-wide area at a time.

## Required scope and branch

Every future task starts with one declared scope and one dedicated branch:

- `codex/kalm-main-<scope>-YYYYMMDD`
- `codex/kalm-move-<scope>-YYYYMMDD`
- `codex/kalm-outdoor-<scope>-YYYYMMDD`
- `codex/ks-active-<scope>-YYYYMMDD`
- `codex/kalm-wellness-<scope>-YYYYMMDD`
- `codex/kalm-home-<scope>-YYYYMMDD`

The task brief and its release report must state the intended brand scope, every file changed outside that scope, the reason for each cross-scope change, the regressions checked, and the production SHA before and after deployment.

## Required release sequence

1. Audit the selected scope against NCC, approved source assets, supplier references, `BRAND_ASSET_MAP.md`, and the imagery guidance.
2. Audit product data, image paths, colour variants, customer-facing copy, and relevant existing reports before changing implementation.
3. Implement mobile-first, then verify desktop presentation without changing unrelated brands.
4. Run the applicable catalogue, imagery, branding, path, syntax, JSON, build, and regression validators.
5. Deploy a Netlify draft only.
6. Capture genuine mobile and desktop evidence from that draft.
7. Wait for Munya's explicit visual approval.
8. Create a rollback point, promote only the approved increment, and deploy it to production.
9. Record the production deploy, production SHA, validation evidence, visual evidence, and rollback reference before another scope begins.

## No cross-brand contamination

A KALM Move task must not casually change Outdoor, Home, Wellness, or KS Active. An Outdoor task must not replace activewear imagery or alter activewear product data. Shared navigation, footer, accessibility, or shell work must be declared as `kalm-main` or site-wide scope before implementation.

## Production authority

Codex may create and deploy draft previews for an in-scope task. Codex may not deploy a future brand increment to production until Munya explicitly approves that draft. Validators, hashes, paths, and generated screenshots are evidence, not production approval. No broad multi-brand recovery pass may resume without explicit instruction.

## Stop condition

After the release record is complete, stop and wait for Munya to select the next brand or site-wide area. Do not begin speculative work for another brand.
