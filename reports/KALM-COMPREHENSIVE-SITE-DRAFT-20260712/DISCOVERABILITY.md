# Machine discoverability implementation

## Implemented in this draft

- Crawlable public paths for product and collection routes, served through Netlify SPA rewrites.
- Canonical, Open Graph title/description/URL updates per route.
- JSON-LD Organization and WebSite on every route; CollectionPage/ItemList on collection pages; Product data on product pages. Purchasable price and availability offers are emitted only for available, non-coming-soon products.
- `robots.txt` retains a standard `User-agent: *` allow rule and declares `sitemap.xml`.
- `sitemap.xml` lists main public routes and all visible published product routes.
- `llms.txt` gives factual brand and route context without promising AI indexing.

## Boundaries

The draft does not claim a crawler, search engine or AI system will index the site. It permits standard access and exposes stable discovery files; inclusion remains each service’s decision and policy.

Hash-fragment routes are retained for existing in-app compatibility, while cards, main navigation, sitemap entries and canonical targets now use public path equivalents.
