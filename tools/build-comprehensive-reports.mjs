import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const fileHash = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const data = JSON.parse(read("products.json"));
const sandbox = { window: {} };
vm.runInNewContext(read("merchandising.js"), sandbox, { filename: "merchandising.js" });
const config = sandbox.window.KALM_MERCHANDISING;
const reportRoot = "reports/KALM-COMPREHENSIVE-SITE-DRAFT-20260712";
const imageList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") return [value.hero, ...(value.gallery || [])].filter(Boolean);
  return [];
};
const productFor = (entry) => data.products.find((product) => product.id === entry.productId || product.slug === entry.productSlug);
const colourFor = (entry) => entry.displayColour || entry.color || entry.colour || "";
const imageFor = (product, colour) => imageList(product.variantImages?.[colour])[0] || product.image;
const surfaces = {
  "Homepage Find Your Edit": config.homepage.findYourEdit,
  "Homepage Featured Edit": config.homepage.featuredEdit,
  "Homepage Archive Sale": config.homepage.archiveSale,
  "Homepage Most Wanted": config.homepage.mostWanted,
  "New In": config.collections["new-in"],
  Activewear: config.collections.activewear,
  Sale: config.collections.sale,
  Outdoor: config.collections.outdoor
};
const rows = Object.entries(surfaces).flatMap(([surface, entries]) => entries.map((entry) => {
  const product = productFor(entry);
  const colour = colourFor(entry);
  const image = imageFor(product, colour);
  return {
    surface,
    productId: product.id,
    slug: product.slug,
    title: product.title,
    brand: product.brand,
    brandId: product.brandId,
    colour,
    image,
    imageSha256: fileHash(image),
    price: product.price,
    compareAtPrice: product.compareAtPrice || null,
    availability: product.availability || "in_stock",
    tags: product.tags || []
  };
}));
const map = {
  generatedAt: new Date().toISOString(),
  source: "merchandising.js",
  allocationCount: rows.length,
  invariant: "A product-colour key may appear once only across the requested merchandising surfaces.",
  rows
};
writeFileSync(resolve(root, `${reportRoot}/MERCHANDISING-MAP.json`), `${JSON.stringify(map, null, 2)}\n`);
const table = rows.map((row) => `| ${row.surface} | ${row.brand} | ${row.title} | ${row.colour} | \`${row.image}\` |`).join("\n");
writeFileSync(resolve(root, `${reportRoot}/MERCHANDISING-UNIQUENESS.md`), `# KALM merchandising allocation and uniqueness\n\nEach requested surface receives a unique product–colour key. This map resolves the display colour to its actual current catalogue hero source.\n\n| Surface | Brand | Product | Display colour | Resolved hero source |\n| --- | --- | --- | --- | --- |\n${table}\n\nChecks enforced by \`tools/validate-kalm-comprehensive-site-draft.mjs\`: key uniqueness, intended-colour existence, image existence, Find Your Edit / Featured Edit image and hash separation, KS Active-only archive sale, New In KS Active exclusion, genuine sale pricing, and exact-three Outdoor collection.\n`, "utf8");

const campaignPaths = {
  homeHero: [
    "assets/images/recovered/campaigns-v1/kalm-comprehensive-home-hero-v1-master.png",
    config.campaigns.homeHero.desktop,
    config.campaigns.homeHero.tablet,
    config.campaigns.homeHero.mobile
  ],
  featuredCollection: [
    "assets/images/recovered/campaigns-v1/kalm-move-performance-collection-v1-master.png",
    config.campaigns.featuredCollection.desktop,
    config.campaigns.featuredCollection.mobile
  ]
};
const campaignFiles = Object.fromEntries(Object.entries(campaignPaths).map(([name, paths]) => [name, paths.map((path) => ({
  path,
  bytes: statSync(resolve(root, path)).size,
  sha256: fileHash(path)
}))]));
const audit = {
  generatedAt: new Date().toISOString(),
  exception: "KALM comprehensive-site draft-only photorealistic campaign exception, 12 July 2026",
  authorisedAssetClasses: ["Homepage hero", "Featured Collection campaign image"],
  imageGenerationSystem: "OpenAI image generation tool",
  generationCalls: 3,
  acceptedMasters: 3,
  acceptedAssetClasses: 2,
  rejectedOrNotUsedDerivatives: [
    {
      path: `${reportRoot}/audit/rejected/kalm-comprehensive-home-hero-v1-mobile-rejected-crop.webp`,
      reason: "The centre crop excluded people from the required six-person inclusive hero cast."
    },
    {
      path: `${reportRoot}/audit/rejected/kalm-comprehensive-home-hero-v1-mobile-v2-wide-crop-not-used.webp`,
      reason: "Non-public derivative generated solely during responsive processing; not used because it is not an approved mobile art direction."
    }
  ],
  cost: "Not available from the generation runtime.",
  reviewStatus: "Awaiting Munya visual approval; draft only; production use is not authorised.",
  sourceLocks: [
    `${reportRoot}/HERO-REFERENCE-LOCK.md`,
    `${reportRoot}/FEATURED-COLLECTION-REFERENCE-LOCK.md`
  ],
  files: campaignFiles
};
writeFileSync(resolve(root, `${reportRoot}/CAMPAIGN-IMAGE-AUDIT.json`), `${JSON.stringify(audit, null, 2)}\n`);
writeFileSync(resolve(root, `${reportRoot}/CAMPAIGN-IMAGE-AUDIT.md`), `# Campaign-image provenance and QA\n\n- Authorised asset classes: homepage hero and Featured Collection only.\n- Image-generation calls: **3** (one mobile art-direction correction within the homepage-hero class).\n- Accepted masters: **3**.\n- Rejected or not-used derivatives: **2**, retained outside public asset paths.\n- Cost: not available from the generation runtime.\n- Status: awaiting Munya visual approval; draft only.\n\n## Homepage hero\n\nThe hero uses an inclusive six-adult cast, with separate landscape, tablet and mobile art directions. Its mobile first crop was rejected because it dropped people from the frame. The accepted vertical reframe preserves the complete cast. See \`HERO-REFERENCE-LOCK.md\`, \`HERO-STYLE-REFERENCE-BOARD.jpg\`, and \`HERO-GENERATION-CONTACT-SHEET.jpg\`.\n\n## Featured Collection\n\nThe KALM Move Performance Essentials campaign image represents the navy Core Performance Tee and olive Flow Training Short from the locked men’s catalogue references. The stone Pace Jogger is supporting collection context, not a claimed product image. See \`FEATURED-COLLECTION-REFERENCE-LOCK.md\` and \`FEATURED-COLLECTION-CONTACT-SHEET.jpg\`.\n\nNo customer-facing copy calls the images generated. No existing approved product asset was overwritten.\n`, "utf8");

const discoverability = `# Machine discoverability implementation\n\n## Implemented in this draft\n\n- Crawlable public paths for product and collection routes, served through Netlify SPA rewrites.\n- Canonical, Open Graph title/description/URL updates per route.\n- JSON-LD Organization and WebSite on every route; CollectionPage/ItemList on collection pages; Product data on product pages. Purchasable price and availability offers are emitted only for available, non-coming-soon products.\n- \`robots.txt\` retains a standard \`User-agent: *\` allow rule and declares \`sitemap.xml\`.\n- \`sitemap.xml\` lists main public routes and all visible published product routes.\n- \`llms.txt\` gives factual brand and route context without promising AI indexing.\n\n## Boundaries\n\nThe draft does not claim a crawler, search engine or AI system will index the site. It permits standard access and exposes stable discovery files; inclusion remains each service’s decision and policy.\n\nHash-fragment routes are retained for existing in-app compatibility, while cards, main navigation, sitemap entries and canonical targets now use public path equivalents.\n`;
writeFileSync(resolve(root, `${reportRoot}/DISCOVERABILITY.md`), discoverability, "utf8");
console.log(`Wrote merchandising map (${rows.length} rows), campaign audit and discoverability report.`);
