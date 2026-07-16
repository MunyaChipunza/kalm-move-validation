import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const baseline = JSON.parse(execFileSync("git", ["show", "52a0e1d4ddde20b7766a1a4a6b63faa6ac0efcb2:products.json"], { cwd: root, encoding: "utf8" }));
const current = JSON.parse(read("products.json"));
const assetManifest = JSON.parse(read("reports/KALM-ODO-PILOT/IMAGE-ASSET-MANIFEST.json"));
const script = read("script.js");
const index = read("index.html");
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed, detail });
const product = current.products.find((item) => item.id === "KALM-TEE-SIGNATURE-001");
const matchingBrand = (catalogue, id) => catalogue.products.filter((item) => item.brandId === id);
const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);

check("KS Active catalogue unchanged", sameJson(matchingBrand(current, "ks-active"), matchingBrand(baseline, "ks-active")), "Compared against protected pilot base");
check("KALM Move catalogue unchanged", sameJson(matchingBrand(current, "kalm-move"), matchingBrand(baseline, "kalm-move")), "Compared against protected pilot base");
check("KALM Move preview prices unchanged", read("data/kalm-move-preview-prices.json") === execFileSync("git", ["show", "52a0e1d4ddde20b7766a1a4a6b63faa6ac0efcb2:data/kalm-move-preview-prices.json"], { cwd: root, encoding: "utf8" }), "Compared against protected pilot base");
check("primary navigation unchanged", /KS Active[\s\S]*Archive Sale[\s\S]*KALM Move/.test(index), "KS Active → Archive Sale → KALM Move");
check("tee uses normal commerce controls", product?.ctaLabel === "Add to bag" && script.includes("data-add-to-bag"), "normal product renderer and bag control");
check("tee does not display a count", product?.trackInventory === false && product?.variants?.every((variant) => variant.quantity === null), "quantity hidden in public product data");
check("delivery and returns guidance present", Boolean(product?.deliveryGuidance) && Boolean(product?.returnsGuidance) && Boolean(product?.sizeGuide), "size, delivery and returns properties set");
check("adult male and female views supplied", ["male-front.webp", "female-front.webp", "male-back.webp", "female-back.webp"].every((name) => ["black", "white"].every((colour) => exists(`assets/images/products/kalm-collective/kalm-signature-oversized-tee/${colour}/${name}`))), "both colours include adult male and female views");
check("complete 27-image public asset set supplied", assetManifest.assetCount === 27 && Object.values(assetManifest.imageSet).flat().length === 27 && Object.values(assetManifest.imageSet).flat().every((file) => exists(`assets/images/products/kalm-collective/kalm-signature-oversized-tee/${file}`)), "manifest and public files agree");
check("public asset metadata is safe", Object.values(assetManifest.publicMetadata).every((value) => value === false), "no source, supplier, prompt or internal-commercial metadata");
check("public paths are supplier-free", !/tshirtscapetown|bulkalot|onedayonly|yolanda|kuhle/i.test(JSON.stringify(product)) && !/tshirtscapetown|bulkalot|onedayonly|yolanda|kuhle/i.test(index), "no restricted names in customer-facing source");
check("private reports blocked", read("netlify.toml").includes('from = "/reports/KALM-ODO-PILOT/*"'), "Netlify redirect present");
check("no Netlify runtime staged", !execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: root, encoding: "utf8" }).split("\n").some((line) => line.includes(".netlify-runtime")), "runtime remains untracked and excluded");

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({ passed: failed.length === 0, checkCount: checks.length, checks, failed }, null, 2));
process.exit(failed.length ? 1 : 0);
