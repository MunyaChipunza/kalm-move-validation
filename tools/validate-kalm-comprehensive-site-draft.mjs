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
  "Homepage Find Your Edit": config.homepage.findYourEdit,
  "Homepage Featured Edit": config.homepage.featuredEdit,
  "Homepage Archive Sale": config.homepage.archiveSale,
  "Homepage Most Wanted": config.homepage.mostWanted,
  "New In": config.collections["new-in"],
  "Activewear": config.collections.activewear,
  "Sale": config.collections.sale,
  "Outdoor": config.collections.outdoor
};
const allocationRows = [];
for (const [surface, entries] of Object.entries(surfaces)) {
  for (const entry of entries) {
    const product = productFor(entry);
    const colour = colourFor(entry);
    const image = imageFor(product, colour);
    allocationRows.push({ surface, product, colour, image });
    check(`${surface} product exists: ${entry.productSlug || entry.productId}`, Boolean(product));
    check(`${surface} colour exists: ${entry.productSlug || entry.productId} / ${colour}`, Boolean(product?.colors?.includes(colour)));
    check(`${surface} hero image exists: ${entry.productSlug || entry.productId} / ${colour}`, Boolean(image && exists(image)), image);
  }
}

const keys = allocationRows.map(({ product, colour }) => `${product?.id || "missing"}|${colour}`);
check("Every allocated product-colour key is unique across requested surfaces", new Set(keys).size === keys.length, keys.filter((key, index) => keys.indexOf(key) !== index).join(", "));
const findImages = allocationRows.filter((row) => row.surface === "Homepage Find Your Edit").map((row) => row.image);
const featuredImages = allocationRows.filter((row) => row.surface === "Homepage Featured Edit").map((row) => row.image);
const sharedImage = findImages.find((image) => featuredImages.includes(image));
check("Find Your Edit and Featured Edit do not reuse an image path", !sharedImage, sharedImage || "");
const findHashes = new Set(findImages.map(hash));
const sharedHash = featuredImages.map(hash).find((imageHash) => findHashes.has(imageHash));
check("Find Your Edit and Featured Edit do not reuse an image hash", !sharedHash, sharedHash || "");

const archive = allocationRows.filter((row) => row.surface === "Homepage Archive Sale");
check("Homepage Archive Sale is KS Active only", archive.length > 0 && archive.every(({ product }) => product?.brandId === "ks-active"), archive.map(({ product }) => product?.brandId).join(", "));
check("Homepage Archive Sale contains genuine sale products", archive.every(({ product }) => Number(product?.compareAtPrice) > Number(product?.price)), "compare-at price must exceed sale price");
const newIn = allocationRows.filter((row) => row.surface === "New In");
check("New In excludes KS Active", newIn.every(({ product }) => product?.brandId !== "ks-active"));
check("New In only contains catalogue new-in products", newIn.every(({ product }) => product?.tags?.includes("new-in")));
const sale = allocationRows.filter((row) => row.surface === "Sale");
check("Sale page contains genuine sale products", sale.every(({ product }) => Number(product?.compareAtPrice) > Number(product?.price)), "compare-at price must exceed sale price");
const outdoor = allocationRows.filter((row) => row.surface === "Outdoor");
const approvedOutdoor = new Set([
  "kalm-outdoor-ember-16-gas-pizza-oven",
  "kalm-outdoor-forge-2-portable-gas-griddle",
  "kalm-outdoor-ridge-4-stainless-gas-braai"
]);
check("Outdoor collection contains exactly three appliances", outdoor.length === 3 && outdoor.every(({ product }) => approvedOutdoor.has(product?.id)), outdoor.map(({ product }) => product?.id).join(", "));

const campaigns = [
  config.campaigns.homeHero.desktop,
  config.campaigns.homeHero.tablet,
  config.campaigns.homeHero.mobile,
  config.campaigns.featuredCollection.desktop,
  config.campaigns.featuredCollection.mobile
];
check("All public campaign derivatives exist", campaigns.every(exists), campaigns.filter((path) => !exists(path)).join(", "));
check("Campaign derivatives are unique", new Set(campaigns.map(hash)).size === campaigns.length);
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
check("Sitemap includes all public products", data.products.filter((product) => (product.status || "published") === "published" && (product.visibility || "visible") === "visible").every((product) => sitemap.includes(`/products/${encodeURIComponent(product.slug)}`)));
check("Sitemap includes collection routes", ["new-in", "activewear", "wellness", "home", "outdoor", "sale"].every((category) => sitemap.includes(`/collections/${category}`)));
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
writeFileSync(resolve(root, outputPath), `${JSON.stringify(result, null, 2)}\n`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`PASS: ${checks.length} comprehensive draft checks; ${allocationRows.length} allocated product-colour cards.`);
