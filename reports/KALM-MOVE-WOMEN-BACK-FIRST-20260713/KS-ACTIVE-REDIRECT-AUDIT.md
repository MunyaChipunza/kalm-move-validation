# KS Active domain redirect audit

## Verified target

`https://kalmcollective.co.za/#/brand/ks-active` — the live KS Active brand landing route, not the general KALM homepage.

## Read-only before state

- Registrar/account interface: GoDaddy, accessible through the existing authenticated Chrome profile.
- GoDaddy domain status: **Pending Registration**.
- Expiry shown by GoDaddy: 14 July 2027.
- Auto-renew shown by GoDaddy: Off.
- Public DNS audit: apex and `www` returned NXDOMAIN; therefore no active NS, A, AAAA, CNAME, MX or TXT records could be inventoried.
- GoDaddy did not expose an editable DNS zone while registration remains pending.
- No forwarding product, hosted website product, SSL certificate, or DNS record change was made.
- Netlify's existing domain-management screen shows `kalmcollective.co.za` as the primary domain, `www.kalmcollective.co.za` as its alias, and an active Let's Encrypt certificate for those KALM domains. `ksactive.co.za` and `www.ksactive.co.za` are not yet aliases. See `dns-evidence/netlify-domain-management-before.png`.
- The API inventory independently confirms the KALM site ID is `06334c13-7d82-45f1-b983-4a7295de88d8`, with `kalmcollective.co.za` primary, `www.kalmcollective.co.za` the only alias, `force_ssl: true`, and site SSL enabled.

## Prepared, not activated

`netlify.toml` contains four host-specific 301 redirect rules (HTTP and HTTPS for apex and www) to the verified KS Active route. The rules are inactive until the domains can be assigned to the KALM Netlify site and the pending registration permits DNS setup.

## Required next technical action

Wait for GoDaddy registration to complete. Then add `ksactive.co.za` to the existing Netlify `kalm-collective-storefront` site, use Netlify's displayed external-DNS values only, and add the matching GoDaddy apex and `www` records without changing mail or ownership records.
