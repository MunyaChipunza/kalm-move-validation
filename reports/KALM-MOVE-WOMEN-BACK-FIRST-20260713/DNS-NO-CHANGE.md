# KS Active DNS change control — superseded no-change record

The earlier no-change record is retained as historical context only. It is superseded by the fresh GoDaddy audit and controlled domain configuration performed on 13 July 2026.

Only two records changed:

| Record | Previous value | Current value | TTL |
|---|---|---|---:|
| A `@` | GoDaddy `Parked` | `75.2.60.5` | 600 seconds |
| CNAME `www` | `ksactive.co.za.` | `kalm-collective-storefront.netlify.app.` | 1 hour |

No nameserver, MX, SPF, DKIM, DMARC, verification, unrelated-subdomain, or forwarding configuration was changed. See [KS-ACTIVE-REDIRECT-AUDIT.md](KS-ACTIVE-REDIRECT-AUDIT.md) for the current evidence and TLS/redirect verification state.
