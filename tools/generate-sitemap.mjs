import { readFile, writeFile } from "node:fs/promises";

const SITE = "https://kalmcollective.co.za";
const timestamp = "2026-07-12";
const data = JSON.parse(await readFile(new URL("../products.json", import.meta.url), "utf8"));
const routes = [
  "/",
  "/brands",
  "/collections/new-in",
  "/collections/activewear",
  "/collections/wellness",
  "/collections/home",
  "/collections/outdoor",
  "/collections/sale",
  "/contact",
  "/policies"
];
const publicProducts = data.products.filter((product) => (product.publicationStatus || product.status || "published") === "published" && (product.visibility || "visible") === "visible");
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
