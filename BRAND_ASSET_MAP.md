# KALM Collective Brand Asset Map

Verified: 2026-07-09

The approved selected files in Google Drive are the source of truth. The storefront must reference the copied files under `assets/branding/`, not the older generated display-logo files under `branding/`.

| Brand | Approved selected file name | Drive/source path | Local repo path | Where used | Status |
|---|---|---|---|---|---|
| KALM Collective | `Kalm Collective Logo.png` | `G:\My Drive\Master Folder\08 Business Documents\KALM Holdings\Kalm Collective Logo.png` | `assets/branding/kalm-collective/kalm-collective-logo.png` | Header logo, footer logo, favicon, web manifest icon, OpenGraph image, site metadata | Copied from Drive, hash verified, referenced in `index.html`, `site.webmanifest`, `products.json`, `script.js` |
| KS Active | `KS active logo transparent.png` | `G:\My Drive\Master Folder\08 Business Documents\KS active\Documents\KS active logo transparent.png` | `assets/branding/ks-active/ks-active-logo-transparent-mono.png` | Brand page logo, brand cards, homepage brand strip | Transparent approved source converted to black-on-transparent monochrome for the white retail UI, referenced in `products.json` |
| KALM Move | `Kalm Move.png` | `G:\My Drive\Master Folder\08 Business Documents\KALM Holdings\Kalm Move.png` | `assets/branding/kalm-move/kalm-move-logo.png` | Brand page logo, brand cards, homepage brand strip | Copied from Drive, hash verified, referenced in `products.json` |
| KALM Home | `Kalm Home.png` | `G:\My Drive\Master Folder\08 Business Documents\KALM Holdings\Kalm Home.png` | `assets/branding/kalm-home/kalm-home-logo.png` | Brand page logo, brand cards, homepage brand strip | Copied from Drive, hash verified, referenced in `products.json` |
| KALM Wellness | `Kalm Wellness.png` | `G:\My Drive\Master Folder\08 Business Documents\KALM Holdings\Kalm Wellness.png` | `assets/branding/kalm-wellness/kalm-wellness-logo.png` | Brand page logo, brand cards, homepage brand strip | Copied from Drive, hash verified, referenced in `products.json` |
| KALM Outdoor | `Kalm Outdoor.png` | `G:\My Drive\Master Folder\08 Business Documents\KALM Holdings\Kalm Outdoor.png` | `assets/branding/kalm-outdoor/kalm-outdoor-logo.png` | Brand page logo, brand cards, homepage brand strip | Copied from Drive, hash verified, referenced in `products.json` |

## Brands Page Logo Direction

The rejected common-buffalo card override is superseded. Every Brands page card must use the verified, unique approved logo from the table above; it must not substitute a generic buffalo mark or duplicate the written brand name below the logo.

## Source Of Truth

- `products.json` is the source of truth for sub-brand logo paths through `approvedLogo`, `logo`, `logoAlt`, `slug`, `description`, `categoryLink` and `homepageTileImage`.
- `products.json` also stores the KALM Collective site logo paths through `meta.logo`, `meta.logoAlt`, `meta.favicon` and `meta.socialPreview`.
- KALM Outdoor is the only outdoor brand name in public data, navigation, filters, routes, metadata and brand pages.

## Removed From Active Use

The storefront no longer references the older `branding/*display-logo*`, `branding/favicon.png`, `branding/icon-192.png`, `branding/icon-512.png` or `branding/social-preview.png` paths for live brand presentation.
