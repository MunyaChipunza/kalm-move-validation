# KALM Outdoor Preproduction Branch Audit

Audited branch: `origin/feature/kalm-outdoor-accessories-preproduction`
Audited checkpoint: `acefc51abb541722cdbff099afa07c28fdadb187`
Audit date: 2026-07-11 (SAST)

## Decision

No wholesale merge is permitted. The checkpoint is a useful product-planning reference, but it is based on an older recovery state and contains 63 deterministic SVG preproduction mockups. Those SVGs are concepts, not approved product photography, and will not be copied into the storefront or represented as product photos.

The safe Outdoor V2 implementation may adapt only the nine product names, stable identifiers, SKU roots, anchor-appliance mappings, truthful coming-soon positioning, and draft bundle relationships. It must use the current production-safe catalogue and existing approved appliance imagery as anchors. It must preserve current recovery reports and never run the preproduction image-generation scripts.

## Product-planning inputs retained for adaptation

| Product | ID / SKU root | Compatible anchor(s) | Decision |
| --- | --- | --- | --- |
| Ember 16 Pizza Peel | `kalm-outdoor-ember-16-pizza-peel` / `KO-ACC-EMBER16-PEEL` | Ember 16 Gas Pizza Oven | Adapt |
| Ember 16 Turning Peel | `kalm-outdoor-ember-16-turning-peel` / `KO-ACC-EMBER16-TURNPEEL` | Ember 16 Gas Pizza Oven | Adapt |
| Ember 16 Insulated Cover | `kalm-outdoor-ember-16-insulated-cover` / `KO-ACC-EMBER16-COVER` | Ember 16 Gas Pizza Oven | Adapt |
| Forge 2 Melting Dome | `kalm-outdoor-forge-2-melting-dome` / `KO-ACC-FORGE2-DOME` | Forge 2 Portable Gas Griddle | Adapt |
| Forge 2 Griddle Tool Set | `kalm-outdoor-forge-2-griddle-tool-set` / `KO-ACC-FORGE2-TOOLS` | Forge 2 Portable Gas Griddle; Ridge 4 only after compatibility confirmation | Adapt with confirmation wording |
| Forge 2 Grease Liner Pack | `kalm-outdoor-forge-2-grease-liner-pack` / `KO-ACC-FORGE2-LINERS` | Forge 2 Portable Gas Griddle | Adapt with fit-confirmation wording |
| Ridge 4 Braai Tool Set | `kalm-outdoor-ridge-4-braai-tool-set` / `KO-ACC-RIDGE4-TOOLS` | Ridge 4 Stainless Gas Braai; Forge 2 only after compatibility confirmation | Adapt with confirmation wording |
| Ridge 4 Smoker Box | `kalm-outdoor-ridge-4-smoker-box` / `KO-ACC-RIDGE4-SMOKER` | Ridge 4 Stainless Gas Braai | Adapt |
| KALM Outdoor Prep Tray | `kalm-outdoor-universal-prep-tray` / `KO-ACC-UNIV-PREPTRAY` | Ember 16, Forge 2, Ridge 4 | Adapt as a general-use tray, not a fit claim |

## Per-file classification

| Files in checkpoint | Classification | Reason and V2 treatment |
| --- | --- | --- |
| `catalogue/drafts/kalm-outdoor-accessories.json` | Adapt | Reuse only the nine names, IDs, slugs, SKU roots, descriptions as drafts, and compatibility relationships after truth review. Do not copy generated image paths, pricing, stock, or unsupported specifications. |
| `catalogue/drafts/kalm-outdoor-bundles.json` | Adapt | Reuse the coming-soon bundle concepts only as unpriced, non-purchasable waitlist groupings. Supplier costs and stock remain pending. |
| `assets/images/products/kalm-outdoor/accessories/kalm-outdoor-ember-16-pizza-peel/{hero,side,contents,detail,lifestyle,scene,compatibility}.svg` | Reject (7 files) | Deterministic vector preproduction mockups; never presented as product photography. |
| `assets/images/products/kalm-outdoor/accessories/kalm-outdoor-ember-16-turning-peel/{hero,side,contents,detail,lifestyle,scene,compatibility}.svg` | Reject (7 files) | Same reason. |
| `assets/images/products/kalm-outdoor/accessories/kalm-outdoor-ember-16-insulated-cover/{hero,side,contents,detail,lifestyle,scene,compatibility}.svg` | Reject (7 files) | Same reason. |
| `assets/images/products/kalm-outdoor/accessories/kalm-outdoor-forge-2-melting-dome/{hero,side,contents,detail,lifestyle,scene,compatibility}.svg` | Reject (7 files) | Same reason. |
| `assets/images/products/kalm-outdoor/accessories/kalm-outdoor-forge-2-griddle-tool-set/{hero,side,contents,detail,lifestyle,scene,compatibility}.svg` | Reject (7 files) | Same reason. |
| `assets/images/products/kalm-outdoor/accessories/kalm-outdoor-forge-2-grease-liner-pack/{hero,side,contents,detail,lifestyle,scene,compatibility}.svg` | Reject (7 files) | Same reason. |
| `assets/images/products/kalm-outdoor/accessories/kalm-outdoor-ridge-4-braai-tool-set/{hero,side,contents,detail,lifestyle,scene,compatibility}.svg` | Reject (7 files) | Same reason. |
| `assets/images/products/kalm-outdoor/accessories/kalm-outdoor-ridge-4-smoker-box/{hero,side,contents,detail,lifestyle,scene,compatibility}.svg` | Reject (7 files) | Same reason. |
| `assets/images/products/kalm-outdoor/accessories/kalm-outdoor-universal-prep-tray/{hero,side,contents,detail,lifestyle,scene,compatibility}.svg` | Reject (7 files) | Same reason. Together these nine rows classify all 63 SVG files. |
| `image-generation/kalm-outdoor/accessories/generate-accessory-preproduction.mjs` | Reject | Generates vector product renderings; no fabricated accessory imagery may be produced. |
| `image-generation/kalm-outdoor/accessories/finalize-phase-a-checkpoint.mjs` | Reject | Phase-A generator/checkpoint tooling is not part of the production-safe V2 workflow. |
| `image-generation/kalm-outdoor/accessories/prompts.json` | Reject | Prompts would lead to unapproved concept imagery rather than sourced product photography. |
| `image-generation/kalm-outdoor/accessories/image-manifest.json` | Reject as live asset manifest | Retain no image paths; its zero-paid-API assertion does not make the mockups product photography. |
| `image-generation/kalm-outdoor/mockups/kalm-outdoor-accessories-desktop-mockup.svg` | Reject | Conceptual UI mockup, not a user-facing source asset. |
| `image-generation/kalm-outdoor/mockups/kalm-outdoor-accessories-mobile-mockup.svg` | Reject | Conceptual UI mockup, not a user-facing source asset. |
| `image-generation/kalm-outdoor/mockups/kalm-outdoor-accessories-desktop-screenshot.png` | Reject | Preproduction screenshot; V2 requires fresh QA evidence. |
| `image-generation/kalm-outdoor/mockups/kalm-outdoor-accessories-mobile-screenshot.png` | Reject | Preproduction screenshot; V2 requires fresh QA evidence. |
| `reports/KALM-OUTDOOR-READY-TO-INTEGRATE.md` | Adapt as historical context | Its stop instruction and no-deploy statement remain informative; its claim that generated SVGs are usable imagery is rejected. |
| `reports/kalm-outdoor-accessories-integration-plan.md` | Adapt selectively | Use only for checklist ideas, rewritten against the current safe master and no-photo rules. |
| `reports/kalm-outdoor-accessories-preproduction-summary.json` | Retain as audit evidence only | Confirms nine drafts, four bundles, 63 mockups, no paid API, and no deployment; not a release record. |
| `reports/kalm-outdoor-accessories-validation.json` | Retain as audit evidence only | Validates Phase A internally, not the production-safe V2 integration. |
| `reports/kalm-outdoor-accessory-image-jobs.json` | Reject | Refers to generated mockups and has no role in a photo-honest release. |
| `reports/outdoor-autonomous-execution-state.json` | Reject | Stale separate execution state conflicts with the current recovery state. |
| All deletions shown when diffing this stale-base branch against the current recovery branch, including `reports/KALM-RECOVERY-FINAL-REPORT.md`, recovery state/log files, contact sheets, local-repair files, and validators | Reject | They are branch-base divergence, not authorized deletions. The current recovery evidence remains intact. |
| `reports/KALM-OUTDOOR-BRANCH-AUDIT.md` | New | This current audit is the only branch-audit artifact adopted into the recovery work. |

## Non-negotiable V2 gates

- No mockup SVG or generated concept image can be used as a product image, thumbnail, gallery asset, or photography substitute.
- Do not reuse prices, stock, dimensions, material claims, or appliance-fit claims that lack supplier confirmation.
- Accessory cards must say `Photography in production`, with no price, availability, or Add to Bag control.
- Bundle cards must be unpriced and non-purchasable.
- Existing Ember 16, Forge 2, and Ridge 4 live product records and approved images are preserved as anchors.
- Do not merge this preproduction branch. Build `feature/kalm-outdoor-premium-accessories-v2` from the latest safe `origin/master` instead.
