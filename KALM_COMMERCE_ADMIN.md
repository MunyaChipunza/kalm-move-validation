# KALM Commerce Operations Boundary

The public storefront is the canonical KALM storefront repository. The KALM intranet is a separate authenticated operations surface and must not expose GitHub, Netlify, PayFast, database or SMTP secrets to the browser.

## Phase 1 commerce ledger

The storefront uses server-side Netlify functions and a transactional Netlify Database schema for KS Active Archive orders, inventory reservations, verified PayFast payment events, fulfilment events, returns/refunds, internal email outbox and marketing preferences.

Internal operations actions require a server-only operations token and include packing, dispatch with courier/tracking, delivery confirmation, refund review, return receipt, restock decision and actual PayFast refund-reference recording. A dashboard must not claim a refund completed before the actual gateway or dashboard action is confirmed.

## Publishing boundary

Catalogue changes are validated in a dedicated branch and released to `master` through the protected GitHub workflow only. The intranet may prepare records and view reconciliation data but may not execute an unrestricted Netlify production deployment.

## Required separation

The KALM intranet and Munya task application are not the KALM storefront. Do not point a storefront deploy, PayFast return URL, payment webhook or public link at either system.
