import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const catalog = JSON.parse(readFileSync(resolve(root, "products.json"), "utf8"));
const affectedProductIds = new Set([
  "kalm-move-align-strappy-jumpsuit",
  "kalm-move-ease-flare-set",
  "kalm-move-form-short-set",
  "kalm-move-balance-strappy-set",
  "kalm-move-halter-biker-short-set",
  "kalm-move-core-seamless-tank",
  "kalm-move-align-ruched-short",
  "kalm-move-open-back-short-romper"
]);
const baseline = JSON.parse(execFileSync("git", ["show", "44d46ed8ce10817de05773984d9efda98d4b3153:products.json"], { cwd: root, encoding: "utf8" }));
const baselineById = new Map(baseline.products.map((product) => [product.id, product]));
const checks = [];
const check = (name, pass, detail = "") => checks.push({ name, pass: Boolean(pass), detail });
const isBack = (value) => /\/back\.(webp|jpg|jpeg|png)$/i.test(value || "");
const isSide = (value) => /\/(angle|side|three-quarter)\.(webp|jpg|jpeg|png)$/i.test(value || "");
const isFront = (value) => /\/front\.(webp|jpg|jpeg|png)$/i.test(value || "");

for (const product of catalog.products) {
  const original = baselineById.get(product.id);
  if (affectedProductIds.has(product.id)) {
    check(`${product.title}: women-only KALM Move scope`, product.brandId === "kalm-move" && product.collection === "KALM Move Women");
    check(`${product.title}: product default is back-first`, isBack(product.image) && isBack(product.gallery?.[0]));
    for (const [colour, variant] of Object.entries(product.variantImages || {})) {
      const gallery = variant.gallery || [];
      check(`${product.title} ${colour}: back-first`, isBack(variant.hero) && isBack(gallery[0]));
      check(`${product.title} ${colour}: side/three-quarter second when present`, !gallery.some(isSide) || isSide(gallery[1]));
      check(`${product.title} ${colour}: front last`, !gallery.some(isFront) || isFront(gallery.at(-1)));
      check(`${product.title} ${colour}: all mapped images exist`, gallery.length >= 2 && gallery.every((image) => existsSync(resolve(root, image))));
    }
  } else if (original) {
    const unchanged = JSON.stringify({ image: product.image, gallery: product.gallery, variantImages: product.variantImages }) === JSON.stringify({ image: original.image, gallery: original.gallery, variantImages: original.variantImages });
    check(`${product.title}: excluded product remains unchanged`, unchanged);
  }
}

const netlifyConfig = readFileSync(resolve(root, "netlify.toml"), "utf8");
const redirectDestination = "https://kalmcollective.co.za/#/brand/ks-active";
for (const source of [
  "http://ksactive.co.za/*",
  "https://ksactive.co.za/*",
  "http://www.ksactive.co.za/*",
  "https://www.ksactive.co.za/*"
]) {
  const escapedSource = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockPattern = new RegExp(
    `\\[\\[redirects\\]\\][\\s\\S]*?from\\s*=\\s*"${escapedSource}"[\\s\\S]*?to\\s*=\\s*"${redirectDestination.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[\\s\\S]*?status\\s*=\\s*301`,
    "m"
  );
  check(`${source}: permanent KS Active canonical redirect is configured`, blockPattern.test(netlifyConfig));
}

const failures = checks.filter((check) => !check.pass);
console.log(JSON.stringify({ pass: failures.length === 0, checkCount: checks.length, failures, checks }, null, 2));
if (failures.length) process.exit(1);
