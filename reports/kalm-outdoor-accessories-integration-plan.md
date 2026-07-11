# KALM Outdoor Accessories Integration Plan

Generated: 2026-07-11T18:20:39.109Z

## Scope

Phase A preproduction only. This branch defines nine KALM Outdoor accessory drafts, bundle drafts, compatibility mapping, image-generation prompts, local preproduction imagery and mockups.

No live storefront file is modified. Do not integrate until storefront recovery has completed and the recovery result is the new base.

## Accessories

- Ember 16 Pizza Peel (kalm-outdoor-ember-16-pizza-peel) - KO-ACC-EMBER16-PEEL - draft_coming_soon
- Ember 16 Turning Peel (kalm-outdoor-ember-16-turning-peel) - KO-ACC-EMBER16-TURNPEEL - draft_coming_soon
- Ember 16 Insulated Cover (kalm-outdoor-ember-16-insulated-cover) - KO-ACC-EMBER16-COVER - draft_coming_soon
- Forge 2 Melting Dome (kalm-outdoor-forge-2-melting-dome) - KO-ACC-FORGE2-DOME - draft_coming_soon
- Forge 2 Griddle Tool Set (kalm-outdoor-forge-2-griddle-tool-set) - KO-ACC-FORGE2-TOOLS - draft_coming_soon
- Forge 2 Grease Liner Pack (kalm-outdoor-forge-2-grease-liner-pack) - KO-ACC-FORGE2-LINERS - draft_coming_soon
- Ridge 4 Braai Tool Set (kalm-outdoor-ridge-4-braai-tool-set) - KO-ACC-RIDGE4-TOOLS - draft_coming_soon
- Ridge 4 Smoker Box (kalm-outdoor-ridge-4-smoker-box) - KO-ACC-RIDGE4-SMOKER - draft_coming_soon
- KALM Outdoor Prep Tray (kalm-outdoor-universal-prep-tray) - KO-ACC-UNIV-PREPTRAY - draft_coming_soon

## Bundles

- Ember 16 Launch Kit (kalm-outdoor-ember-16-launch-kit) - kalm-outdoor-ember-16-pizza-peel, kalm-outdoor-ember-16-turning-peel, kalm-outdoor-ember-16-insulated-cover
- Forge 2 Breakfast Kit (kalm-outdoor-forge-2-breakfast-kit) - kalm-outdoor-forge-2-melting-dome, kalm-outdoor-forge-2-griddle-tool-set, kalm-outdoor-forge-2-grease-liner-pack
- Ridge 4 Weekend Braai Kit (kalm-outdoor-ridge-4-weekend-braai-kit) - kalm-outdoor-ridge-4-braai-tool-set, kalm-outdoor-ridge-4-smoker-box, kalm-outdoor-universal-prep-tray
- KALM Outdoor Hosting Starter Bundle (kalm-outdoor-hosting-starter-bundle) - kalm-outdoor-universal-prep-tray, kalm-outdoor-forge-2-griddle-tool-set, kalm-outdoor-ridge-4-braai-tool-set

## Compatibility Rules

- Ember 16 accessories are not assumed compatible with Forge 2 or Ridge 4 unless marked general-use.
- Forge 2 griddle tools may be general-use with Ridge 4, but final usage copy needs QA.
- Ridge 4 braai tools may be general-use with Forge 2, but final usage copy needs QA.
- The Prep Tray is the only deliberately universal accessory.
- Any `review_required` mapping must be verified before product launch.

## Integration Sequence After Recovery

1. Confirm recovery task final report and deployment are complete.
2. `git fetch origin`
3. `git rebase origin/master`
4. Re-read recovered `products.json` and current Outdoor appliance records.
5. Convert draft records from `catalogue/drafts/kalm-outdoor-accessories.json` into the recovered catalogue schema.
6. Add bundle data only where the recovered storefront has a compatible bundle structure.
7. Wire shop-by-appliance navigation and waitlist behaviour against the recovered JS/CSS, not this branch's base copy.
8. Run validators and visual regression from the recovery release.
9. Verify existing KALM Move and KALM Outdoor appliance assets have not changed.
10. Commit integration separately from this preproduction commit.
11. Deploy only after confirming no other deployment is active.

## Supplier Information Still Pending

- Confirm supplier source, MOQ and lead times.
- Confirm dimensions, materials, finish, packaging and warranty.
- Confirm landed costs and retail pricing.
- Confirm appliance fit for every primary compatibility mapping.
- Confirm final product photography or paid generative image approval.

## Image Status

- Local preproduction images generated: 63
- Paid image API used: no
- Failed image jobs: 0

## Validation

- Validation status: PASS
- Errors: None
