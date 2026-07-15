import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const exists = (path) => existsSync(resolve(root, path));
const hash = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const outputPath = "reports/KALM-COMPREHENSIVE-SITE-DRAFT-20260712/VALIDATION.json";
const failures = [];
const checks = [];
const check = (name, condition, detail = "") => {
  checks.push({ name, status: condition ? "pass" : "fail", detail });
  if (!condition) failures.push(`${name}${detail ? `: ${detail}` : ""}`);
};

const data = JSON.parse(read("products.json"));
const movePreviewPrices = JSON.parse(read("data/kalm-move-preview-prices.json"));
const sandbox = { window: {} };
vm.runInNewContext(read("merchandising.js"), sandbox, { filename: "merchandising.js" });
const config = sandbox.window.KALM_MERCHANDISING;
const imageList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") return [value.hero, ...(value.gallery || [])].filter(Boolean);
  return [];
};
const productFor = (entry) => data.products.find((product) => product.id === entry.productId || product.slug === entry.productSlug);
const colourFor = (entry) => entry.displayColour || entry.color || entry.colour || "";
const imageFor = (product, colour) => imageList(product?.variantImages?.[colour])[0] || product?.image || "";
const surfaces = {
  "Homepage Featured KS Active": config.homepage.featuredKsActive,
  "Homepage Final Pieces": config.homepage.finalPieces,
  "KS Active": config.collections["ks-active"],
  "New In": config.collections["new-in"],
  "Activewear": config.collections.activewear,
  "Sale": config.collections.sale
};
const allocationRows = [];
for (const [surface, entries] of Object.entries(surfaces)) {
  for (const entry of entries || []) {
    const product = productFor(entry);
    const colour = colourFor(entry);
    const image = imageFor(product, colour);
    allocationRows.push({ surface, product, colour, image });
    check(`${surface} product exists: ${entry.productSlug || entry.productId}`, Boolean(product));
    check(`${surface} colour exists: ${entry.productSlug || entry.productId} / ${colour}`, Boolean(product?.colors?.includes(colour)));
    check(`${surface} hero image exists: ${entry.productSlug || entry.productId} / ${colour}`, Boolean(image && exists(image)), image);
  }
}

const featuredKs = allocationRows.filter((row) => row.surface === "Homepage Featured KS Active");
const finalPieces = allocationRows.filter((row) => row.surface === "Homepage Final Pieces");
check("Homepage Featured KS Active is KS Active only", featuredKs.length >= 6 && featuredKs.every(({ product }) => product?.brandId === "ks-active"), featuredKs.map(({ product }) => product?.brandId).join(", "));
check("Homepage Final Pieces is KS Active only", finalPieces.length >= 6 && finalPieces.every(({ product }) => product?.brandId === "ks-active"), finalPieces.map(({ product }) => product?.brandId).join(", "));
check("Homepage KS Active sections use distinct product selections", !featuredKs.some((row) => finalPieces.some((candidate) => candidate.product?.id === row.product?.id)), "featured and final-pieces selections overlap");
const newIn = allocationRows.filter((row) => row.surface === "New In");
check("New In is restricted to the purchasable KS Active Archive", newIn.length === 14 && newIn.every(({ product }) => product?.brandId === "ks-active"));
const activewear = allocationRows.filter((row) => row.surface === "Activewear");
check("Activewear is restricted to the purchasable KS Active Archive", activewear.length === 14 && activewear.every(({ product }) => product?.brandId === "ks-active"));
const sale = allocationRows.filter((row) => row.surface === "Sale");
check("Sale page contains exactly fourteen KS Active Archive products", sale.length === 14 && sale.every(({ product }) => product?.brandId === "ks-active"), sale.map(({ product }) => product?.brandId).join(", "));
check("Sale page contains no KALM Move product", sale.every(({ product }) => product?.brandId !== "kalm-move"));

const campaigns = [
  config.campaigns.ksActiveHero.desktop,
  config.campaigns.ksActiveHero.mobile,
  config.campaigns.kalmMoveTeaser.desktop,
  config.campaigns.kalmMoveTeaser.mobile
];
check("All public campaign derivatives exist", campaigns.every(exists), campaigns.filter((path) => !exists(path)).join(", "));
check("Primary homepage campaign uses approved KS Active imagery", config.campaigns.ksActiveHero.desktop.includes("assets/images/products/ks-active/archive-approved/"));
check("No rejected campaign crop is publicly referenced", campaigns.every((path) => !path.includes("rejected")));
check("Rejected campaign evidence is outside public assets", exists("reports/KALM-COMPREHENSIVE-SITE-DRAFT-20260712/audit/rejected/kalm-comprehensive-home-hero-v1-mobile-rejected-crop.webp"));

const indexHtml = read("index.html");
const styles = read("styles.css");
const script = read("script.js");
const robots = read("robots.txt");
const sitemap = read("sitemap.xml");
const llms = read("llms.txt");
check("Approved KALM Collective logo is used", indexHtml.includes("assets/branding/kalm-collective/kalm-collective-logo.png"));
check("KALM Collective logo blends without a white box", styles.includes("mix-blend-mode: multiply"));
check("Find Your Edit cards are square", /\.category-tile\s*\{[\s\S]*?aspect-ratio:\s*1\s*\/\s*1/.test(styles));
check("Public product routes are implemented", script.includes("/products/") && read("netlify.toml").includes('from = "/products/*"'));
check("Direct public routes resolve shared assets from the site root", indexHtml.includes('<base href="/">'));
check("Product pages honor intended display colour", script.includes("params.get(\"colour\")") && script.includes("productRoute(product, defaultColour)"));
check("Product, Organization, WebSite and Collection structured data are implemented", script.includes('"@type": "Product"') && script.includes('"@type": "Organization"') && script.includes('"@type": "WebSite"') && script.includes('"@type": "CollectionPage"'));
check("Coming-soon or unavailable products do not publish offers", script.includes("const purchasable = !comingSoon"));
check("robots.txt permits standard crawling and points to the sitemap", /User-agent:\s*\*/.test(robots) && /Allow:\s*\//.test(robots) && /Sitemap:\s*https:\/\/kalmcollective\.co\.za\/sitemap\.xml/.test(robots));
const commerceProducts = data.products.filter((product) => (product.status || "published") === "published" && (product.visibility || "visible") === "visible" && product.brandId === "ks-active");
check("Sitemap includes all current commerce products", commerceProducts.every((product) => sitemap.includes(`/products/${encodeURIComponent(product.slug)}`)));
check("KALM Move has a preview collection sitemap route without commerce PDP links", movePreviewPrices.some((entry) => entry.status === "launching-soon") && sitemap.includes("/brand/kalm-move") && !sitemap.includes("/products/kalm-move-"));
check("Sitemap includes current primary collection routes", ["ks-active", "sale"].every((category) => sitemap.includes(`/collections/${category}`)) && !sitemap.includes("/collections/new-in") && !sitemap.includes("/collections/activewear"));
check("llms.txt contains factual discovery guidance without credentials", llms.includes("KALM Collective") && !/(api[_-]?key|token|secret)/i.test(llms));
check("No Drive path is exposed in public source", ![indexHtml, script, read("merchandising.js")].some((text) => /[A-Z]:\\|G:\\My Drive/i.test(text)));

const result = {
  generatedAt: new Date().toISOString(),
  status: failures.length ? "fail" : "pass",
  checks,
  allocationCount: allocationRows.length,
  campaignFiles: campaigns.map((path) => ({ path, bytes: statSync(resolve(root, path)).size, sha256: hash(path) })),
  failures
};
if (process.env.KALM_VALIDATION_NO_WRITE !== "1") writeFileSync(resolve(root, outputPath), `${JSON.stringify(result, null, 2)}\n`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`PASS: ${checks.length} comprehensive draft checks; ${allocationRows.length} allocated product-colour cards.`);
