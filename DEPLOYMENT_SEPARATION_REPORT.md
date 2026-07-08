# Deployment Separation Report

Date: 2026-07-08

## What Was Wrong

`kalmcollective.co.za` had been assigned to the `munya-task-app` Netlify project. That made the KALM custom domain resolve to the task app deployment target, creating the appearance that the storefront and task app were mixed.

No storefront `_redirects` file, `netlify.toml` redirect, frontend redirect, or hardcoded KALM-to-task-app URL was found.

## What Changed

- Removed `kalmcollective.co.za` and aliases from `munya-task-app`.
- Assigned `kalmcollective.co.za` to `kalm-collective-storefront`.
- Assigned `www.kalmcollective.co.za` as a storefront alias.
- Restored the task app Netlify site name/default domain to `munya-task-app` after the site temporarily reported as `inquisitive-pastelito-bd6463`.
- Confirmed the KALM local Netlify link points to `kalm-collective-storefront`.
- Confirmed task app Netlify Git settings point to `MunyaChipunza/munyaapp`.

## Correct Netlify Mapping

| App | Netlify site | Netlify site ID | Repo | Live URL | Custom domains |
|---|---|---|---|---|---|
| KALM Collective | `kalm-collective-storefront` | `06334c13-7d82-45f1-b983-4a7295de88d8` | `MunyaChipunza/kalm-move-validation` | `https://kalmcollective.co.za` | `kalmcollective.co.za`, `www.kalmcollective.co.za` |
| Munya task app | `munya-task-app` | `f6da8ee9-60de-4af7-8c5d-3a89adbc72d9` | `MunyaChipunza/munyaapp` | `https://munya-task-app.netlify.app` | none |

## Live URL Checks

- `https://kalmcollective.co.za/` returns the KALM Collective storefront.
- `https://www.kalmcollective.co.za/` resolves to the KALM Collective storefront.
- `https://kalm-collective-storefront.netlify.app/` returns the KALM Collective storefront.
- `https://munya-task-app.netlify.app/` returns `Munya App`.

## Current Deployment Note

The storefront Netlify site is currently deployed by manual/API uploads. It is locally linked to the correct Netlify site ID, but Netlify Git CI is not attached to the storefront site. Keep that deliberate unless the storefront is later moved to continuous deployment.
