import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import catalogue from "../products.json" with { type: "json" };

const source = "reports/KS-ACTIVE-ARCHIVE/FINAL-PRODUCTION-RELEASE-20260714/FINAL-INVENTORY-MANIFEST.json";
const destination = "netlify/database/migrations/20260818000200_seed_ks_active_archive_inventory.sql";
const manifestBuffer = await readFile(source);
const manifest = JSON.parse(manifestBuffer.toString("utf8"));
const sourceHash = createHash("sha256").update(manifestBuffer).digest("hex");
const productIdBySku = new Map(catalogue.products.flatMap((product) =>
  (product.variants || []).map((variant) => [variant.sku, product.id])
));

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

const values = manifest.variants.map((variant) => `(${[
  variant.sku,
  productIdBySku.get(variant.sku) || (() => { throw new Error(`Missing catalogue product for ${variant.sku}`); })(),
  variant.productCode,
  variant.productName,
  variant.productSlug,
  variant.colour,
  variant.size,
  Math.round(variant.price * 100),
  variant.quantity,
  variant.authority || manifest.authority,
  sourceHash
].map(sql).join(", ")})`).join(",\n");

const content = `-- Generated from ${source}; source sha256: ${sourceHash}\n-- Initial stock only. Deploy migrations are immutable and never overwrite a sale.\nINSERT INTO commerce_inventory (sku, product_id, product_code, product_name, product_slug, colour, size, unit_price_cents, available_quantity, authority_source, source_hash)\nVALUES\n${values}\nON CONFLICT (sku) DO NOTHING;\n`;
await writeFile(destination, content, "utf8");
