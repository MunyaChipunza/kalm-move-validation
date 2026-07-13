# KS Active redirect — production configuration audit

## Canonical destination

`https://kalmcollective.co.za/#/brand/ks-active`

This is the verified live KS Active brand landing page. It renders the **KS Active** heading and is not the KALM Collective homepage.

## Fresh GoDaddy audit — 13 July 2026

- Domain: `ksactive.co.za`
- Registrar and authoritative DNS provider: GoDaddy
- Portfolio status: **Active**; the full domain settings screen shows internal domain state **Idle**, not pending registration.
- Renewal date: 14 July 2027.
- Registrar lock: On.
- Nameservers: `ns07.domaincontrol.com` and `ns08.domaincontrol.com` (GoDaddy default nameservers).
- GoDaddy Manage DNS: available and editable.
- Forwarding: no domain or subdomain forward was configured before this change.
- Attached website/parking product: no separate website or forwarding product was shown; the root A record was GoDaddy parking.
- DNSSEC: not displayed by the current GoDaddy settings interface.
- Auto-renew: not rendered in the current domain-settings screen; it was not changed.
- Registry/RDAP: `rdap.org` and the South African registry endpoint returned no record (HTTP 404); the GoDaddy Active state, authoritative delegation, and public DNS responses are the recorded current evidence.

The earlier **Pending Registration** assessment was stale and is superseded by this audit.

## Preserved before state

Before the change, the editable GoDaddy zone held:

| Record | Name | Value | TTL | Action |
|---|---|---|---:|---|
| A | `@` | GoDaddy `Parked` | 600 seconds | Replaced only for the Netlify redirect host |
| CNAME | `www` | `ksactive.co.za.` | 1 hour | Replaced only for the Netlify redirect host |
| NS | `@` | `ns07.domaincontrol.com.` | 1 hour | Unchanged |
| NS | `@` | `ns08.domaincontrol.com.` | 1 hour | Unchanged |
| CNAME | `_domainconnect` | `_domainconnect.gd.domaincontrol.com.` | 1 hour | Unchanged |
| SOA | `@` | GoDaddy primary nameserver | 1 hour | Unchanged |
| TXT | `_dmarc` | existing DMARC policy | 1 hour | Unchanged |

There were no MX, SPF, DKIM, AAAA, verification, or unrelated-subdomain records in the visible zone. No GoDaddy forwarding rule was introduced.

## Applied configuration

### Netlify

- Site: `kalm-collective-storefront` (`06334c13-7d82-45f1-b983-4a7295de88d8`)
- Added aliases: `ksactive.co.za` and `www.ksactive.co.za`
- Retained alias: `www.kalmcollective.co.za`
- Existing site HTTPS enforcement remains enabled.

### GoDaddy DNS

| Record | Name | Value | TTL |
|---|---|---|---:|
| A | `@` | `75.2.60.5` | 600 seconds |
| CNAME | `www` | `kalm-collective-storefront.netlify.app.` | 1 hour |

The host-specific 301 rules are deployed in `netlify.toml`, before SPA rewrites, for both HTTP and HTTPS forms of the apex and `www` hosts. They point to the canonical KS Active URL above and do not expose a duplicate storefront.

## Final verification

- GoDaddy authoritative nameserver and public resolvers returned the new A and CNAME values.
- Forced-host HTTP and HTTPS diagnostics reached Netlify and returned a 301 to the exact canonical KS Active URL.
- The Netlify **Renew certificate** control was used after the aliases and authoritative DNS were in place. It completed a Let’s Encrypt certificate containing `*.kalmcollective.co.za`, `kalmcollective.co.za`, `ksactive.co.za`, and `www.ksactive.co.za` (valid to 11 October 2026).
- The redirect is **live and verified**. No redirect loop, certificate warning, parking page, or duplicate storefront was observed.

| Source URL | Status chain | Final result |
|---|---|---|
| `http://ksactive.co.za/` | 301 → `https://ksactive.co.za/` → 301 | `https://kalmcollective.co.za/#/brand/ks-active` (200) |
| `https://ksactive.co.za/` | 301 | `https://kalmcollective.co.za/#/brand/ks-active` (200) |
| `http://www.ksactive.co.za/` | 301 → `https://www.ksactive.co.za/` → 301 | `https://kalmcollective.co.za/#/brand/ks-active` (200) |
| `https://www.ksactive.co.za/` | 301 | `https://kalmcollective.co.za/#/brand/ks-active` (200) |

## Evidence

- `dns-evidence/godaddy-active-portfolio.png` — Active GoDaddy portfolio state and renewal date.
- `dns-evidence/godaddy-before-state.png` — previous editable-zone state.
- `dns-evidence/godaddy-dns-after-netlify.png` — edited A and `www` CNAME, with NS and DMARC retained.
- `dns-evidence/netlify-domain-aliases.png` — the two aliases on the correct Netlify storefront, captured during certificate synchronization.
- `dns-evidence/netlify-aliases-tls-provisioning.png` — Netlify’s certificate-provisioning state before final TLS verification.
- `dns-evidence/http-status-chain.json` — final programmatic HTTP/TLS verification.
