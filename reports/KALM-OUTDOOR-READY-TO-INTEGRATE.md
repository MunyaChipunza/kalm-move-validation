# KALM OUTDOOR READY TO INTEGRATE

Generated: 2026-07-11T18:20:39.109Z

## Branch

- Branch name: feature/kalm-outdoor-accessories-preproduction
- Starting SHA: a5b459d4c8b65836e6775d9040729ba6f16d0e80
- Final preproduction SHA: use the pushed branch HEAD for this report; a Git commit cannot embed its own final hash.
- Recovery workspace touched: no
- Netlify deployment initiated: no

## Files Created

Validation report contains the full file list:

- reports/kalm-outdoor-accessories-validation.json

## Images Generated

- 63 preproduction SVG images
- Views per product: hero, side, contents, detail, lifestyle, scene, compatibility
- Destination: assets/images/products/kalm-outdoor/accessories/**
- Mock-up screenshots: image-generation/kalm-outdoor/mockups/kalm-outdoor-accessories-desktop-screenshot.png and image-generation/kalm-outdoor/mockups/kalm-outdoor-accessories-mobile-screenshot.png
- Paid image API used: no

## Failed Image Jobs

- None

## Draft Product Records

- Ember 16 Pizza Peel - kalm-outdoor-ember-16-pizza-peel - KO-ACC-EMBER16-PEEL
- Ember 16 Turning Peel - kalm-outdoor-ember-16-turning-peel - KO-ACC-EMBER16-TURNPEEL
- Ember 16 Insulated Cover - kalm-outdoor-ember-16-insulated-cover - KO-ACC-EMBER16-COVER
- Forge 2 Melting Dome - kalm-outdoor-forge-2-melting-dome - KO-ACC-FORGE2-DOME
- Forge 2 Griddle Tool Set - kalm-outdoor-forge-2-griddle-tool-set - KO-ACC-FORGE2-TOOLS
- Forge 2 Grease Liner Pack - kalm-outdoor-forge-2-grease-liner-pack - KO-ACC-FORGE2-LINERS
- Ridge 4 Braai Tool Set - kalm-outdoor-ridge-4-braai-tool-set - KO-ACC-RIDGE4-TOOLS
- Ridge 4 Smoker Box - kalm-outdoor-ridge-4-smoker-box - KO-ACC-RIDGE4-SMOKER
- KALM Outdoor Prep Tray - kalm-outdoor-universal-prep-tray - KO-ACC-UNIV-PREPTRAY

## Bundle Definitions

- Ember 16 Launch Kit - kalm-outdoor-ember-16-launch-kit
- Forge 2 Breakfast Kit - kalm-outdoor-forge-2-breakfast-kit
- Ridge 4 Weekend Braai Kit - kalm-outdoor-ridge-4-weekend-braai-kit
- KALM Outdoor Hosting Starter Bundle - kalm-outdoor-hosting-starter-bundle

## Compatibility Mapping

- Ember 16 Pizza Peel: Ember 16=primary; Forge 2=not_applicable; Ridge 4=not_applicable
- Ember 16 Turning Peel: Ember 16=primary; Forge 2=not_applicable; Ridge 4=not_applicable
- Ember 16 Insulated Cover: Ember 16=primary; Forge 2=not_applicable; Ridge 4=not_applicable
- Forge 2 Melting Dome: Ember 16=not_applicable; Forge 2=primary; Ridge 4=review_required
- Forge 2 Griddle Tool Set: Ember 16=not_applicable; Forge 2=primary; Ridge 4=general_use
- Forge 2 Grease Liner Pack: Ember 16=not_applicable; Forge 2=primary; Ridge 4=not_applicable
- Ridge 4 Braai Tool Set: Ember 16=not_applicable; Forge 2=general_use; Ridge 4=primary
- Ridge 4 Smoker Box: Ember 16=not_applicable; Forge 2=not_applicable; Ridge 4=primary
- KALM Outdoor Prep Tray: Ember 16=compatible; Forge 2=compatible; Ridge 4=compatible

## Supplier Information Still Pending

- Supplier source and MOQ
- Landed cost and retail price
- Verified dimensions and packaging
- Materials and finish
- Warranty and care notes
- Fit testing against primary appliance

## Exact Integration Sequence

1. Wait for storefront recovery completion and final report.
2. Confirm no task is rewriting products.json or deploying.
3. Run: `git fetch origin`
4. Run: `git rebase origin/master`
5. Recreate catalogue changes semantically against the recovered products.json.
6. Add waitlist and shop-by-appliance UI only after recovery validators pass.
7. Run full tests and visual regression.
8. Commit integration.
9. Deploy only after deployment lock is clear.

## Exact Resume Command

```powershell
cd "C:\Users\Dell\codex-work\kalm-outdoor-accessories"
git fetch origin
git status --short --branch
```

## Validation

- Status: PASS
- Accessory count: 9
- Bundle count: 4
- Image count: 63
