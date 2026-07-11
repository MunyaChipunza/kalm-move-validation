# Deployment and Rollback Notes

## Storefront Target

- Repository: `MunyaChipunza/kalm-move-validation`
- Branch: `master`
- Netlify site: `kalm-collective-storefront`
- Netlify site ID: `06334c13-7d82-45f1-b983-4a7295de88d8`
- Production URL: `https://kalmcollective.co.za`

Never deploy this storefront to the Munya task app or intranet site.

## Pre-Deploy Checks

Run:

```powershell
node --check script.js
node tools/validate-catalog.mjs
git diff --check
```

Then verify:

- `products.json` parses
- image paths exist
- variant SKUs are unique
- unavailable variants cannot be added to bag
- KALM Move women product galleries swipe on mobile
- filters and sorting preserve URL state

## Manual Netlify Deploy

The current storefront deployment flow is manual Netlify CLI deployment from the repo root.

```powershell
netlify deploy --prod --dir . --site 06334c13-7d82-45f1-b983-4a7295de88d8
```

## Rollback

Rollback must create a new commit that restores the previous known-good catalogue or code state. Do not rewrite Git history.

1. Identify the last known-good commit.
2. Restore only the intended files.
3. Run validation.
4. Commit the rollback.
5. Deploy to the KALM storefront site ID only.
6. Verify live `products.json` and storefront product pages.

## Intranet Publishing Boundary

The authenticated intranet may publish to this repository only through server-side functions with private environment variables. Browser JavaScript must never receive GitHub or Netlify write tokens.
