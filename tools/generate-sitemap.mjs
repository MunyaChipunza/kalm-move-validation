import { readFile, writeFile } from "node:fs/promises";

const SITE = "https://kalmcollective.co.za";
const timestamp = "2026-07-15";
const data = JSON.parse(await readFile(new URL("../products.json", import.meta.url), "utf8"));
const movePrices = JSON.parse(await readFile(new URL("../data/kalm-move-preview-prices.json", import.meta.url), "utf8"));
const movePreviewIds = new Set(movePrices.filter((entry) => entry.status === "launching-soon").map((entry) => entry.productId));
if (!movePreviewIds.size) throw new Error("KALM Move preview price data is missing.");
const routes = [
  "/",
  "/collections/new-in",
  "/collections/activewear",
  "/brand/kalm-move",
  "/collections/sale",
  "/contact",
  "/policies"
];
const publicProducts = data.products.filter((product) => {
  const publicState = (product.publicationStatus || product.status || "published") === "published" && (product.visibility || "visible") === "visible";
  if (!publicState) return false;
  return product.brandId === "ks-active";
});
for (const product of publicProducts) routes.push(`/products/${encodeURIComponent(product.slug)}`);
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map((route) => `  <url><loc>${SITE}${route}</loc><lastmod>${timestamp}</lastmod></url>`),
  "</urlset>",
  ""
].join("\n");
await writeFile(new URL("../sitemap.xml", import.meta.url), xml, "utf8");
console.log(`Generated sitemap.xml with ${routes.length} URLs.`);
