# KALM Outdoor Preproduction Branch Audit

Audited branch: `origin/feature/kalm-outdoor-accessories-preproduction`
Audited checkpoint: `acefc51abb541722cdbff099afa07c28fdadb187`
Audit date: 2026-07-11 (SAST)

## Decision

No wholesale merge is permitted. The checkpoint is a useful product-planning reference, but it is based on an older recovery state and contains 63 deterministic SVG preproduction mockups. Those SVGs are concepts, not approved product photography, and will not be copied into the storefront or represented as product photos.

The safe Outdoor V2 implementation may adapt only the branch's cautionary lessons: truthfully coming-soon status, no paid image API, no live SVG mockups, and anchor-appliance compatibility treated as a confirmation requirement. It must use the current production-safe catalogue and existing approved appliance imagery as anchors. It must preserve current recovery reports and never run the preproduction image-generation scripts.

## Product identities are superseded by the mandated V2 list

The preproduction names, IDs, SKU roots, and bundle names are not reusable because the mandate specifies a different exact V2 catalogue. The source records below are discarded as product identities; compatibility ideas remain report-only until supplier confirmation.

| Preproduction record | Classification | Required V2 replacement |
| --- | --- | --- |
| Ember 16 Pizza Peel; Ember 16 Turning Peel; Ember 16 Insulated Cover | Discard as product identities | Ember Launch Pro Perforated Peel; Ember Turn Pro Turning Peel; Ember Dough & Heat Kit |
| Forge 2 Melting Dome; Forge 2 Griddle Tool Set; Forge 2 Grease Liner Pack | Discard as product identities | Forge Pro Griddle Tool Roll; Forge Smash & Steam Kit; Forge Season & Care Kit |
| Ridge 4 Braai Tool Set; Ridge 4 Smoker Box; KALM Outdoor Prep Tray | Discard as product identities | Ridge Smart Temperature System; Ridge Pro Rotisserie Kit; Ridge Cast-Iron Sear System |
| Ember 16 Launch Kit; Forge 2 Breakfast Kit; Ridge 4 Weekend Braai Kit; KALM Outdoor Hosting Starter Bundle | Discard as bundle identities | Ember Essential; Pizza Night; Ridge Precision; Ridge Host; Forge Essential; Forge Burger |

## Per-file classification

| Files in checkpoint | Classification | Reason and V2 treatment |
| --- | --- | --- |
| `catalogue/drafts/kalm-outdoor-accessories.json` | Report-only | Its nine records conflict with the mandate's exact V2 product list. Do not reuse names, IDs, slugs, SKU roots, descriptions, image paths, prices, stock, or specifications. |
| `catalogue/drafts/kalm-outdoor-bundles.json` | Report-only | Its bundle names conflict with the mandated six unpriced V2 bundles. Do not reuse the identities, pricing, or stock assumptions. |
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
| `reports/KALM-OUTDOOR-READY-TO-INTEGRATE.md` | Report-only | Its stop instruction and no-deploy statement remain informative; its product and SVG integration claims are rejected. |
| `reports/kalm-outdoor-accessories-integration-plan.md` | Report-only | It is tied to a conflicting product list; only generic checklist lessons may inform a newly written V2 plan. |
| `reports/kalm-outdoor-accessories-preproduction-summary.json` | Retain as audit evidence only | Confirms nine drafts, four bundles, 63 mockups, no paid API, and no deployment; not a release record. |
| `reports/kalm-outdoor-accessories-validation.json` | Retain as audit evidence only | Validates Phase A internally, not the production-safe V2 integration. |
| `reports/kalm-outdoor-accessory-image-jobs.json` | Reject | Refers to generated mockups and has no role in a photo-honest release. |
| `reports/outdoor-autonomous-execution-state.json` | Reject | Stale separate execution state conflicts with the current recovery state. |
| All deletions shown when diffing this stale-base branch against the current recovery branch, including `reports/KALM-RECOVERY-FINAL-REPORT.md`, recovery state/log files, contact sheets, local-repair files, and validators | Reject | They are branch-base divergence, not authorized deletions. The current recovery evidence remains intact. |
| `reports/KALM-OUTDOOR-BRANCH-AUDIT.md` | New | This current audit is the only branch-audit artifact adopted into the recovery work. |

## Non-negotiable V2 gates

- No mockup SVG or generated concept image can be used as a product image, thumbnail, gallery asset, or photography substitute.
- Do not reuse prices, stock, dimensions, material claims, or appliance-fit claims that lack supplier confirmation.
- V2 must implement exactly: Ember Launch Pro Perforated Peel, Ember Turn Pro Turning Peel, Ember Dough & Heat Kit, Ridge Smart Temperature System, Ridge Pro Rotisserie Kit, Ridge Cast-Iron Sear System, Forge Pro Griddle Tool Roll, Forge Smash & Steam Kit, and Forge Season & Care Kit.
- Accessory cards must say `Photography in production`, with no price, availability, or Add to Bag control.
- Bundle cards must be unpriced and non-purchasable: Ember Essential, Pizza Night, Ridge Precision, Ridge Host, Forge Essential, and Forge Burger.
- Existing Ember 16, Forge 2, and Ridge 4 live product records and approved images are preserved as anchors.
- Do not merge this preproduction branch. Build `feature/kalm-outdoor-premium-accessories-v2` from the latest safe `origin/master` instead.
