import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed, detail });

const catalogue = JSON.parse(read("products.json"));
const script = read("script.js");
const robots = read("robots.txt");
const sitemap = read("sitemap.xml");
const netlify = read("netlify.toml");
const product = catalogue.products.find((item) => item.id === "KALM-TEE-SIGNATURE-001");
const requiredReports = [
  "PRODUCT-IDENTITY-AND-EMBROIDERY-SPEC.md",
  "ODO-APPLICATION-ANSWER-SHEET.md",
  "GATE-STATUS.md",
  "COMMERCIAL-PILOT-READINESS.json",
  "KALM-ODO-UNIT-ECONOMICS.xlsx",
  "PRODUCT-OPTION-SCORECARD.xlsx"
];
const rejectedNames = [
  ["KALM", "Buffalo", "Tee"].join(" "),
  ["KALM", "Buffalo", "Heavyweight", "Tee"].join(" "),
  ["KALM", "Buffalo", "Crest", "Tee"].join(" "),
  ["KALM", "Nyati", "Heavyweight", "Tee"].join(" "),
  ["KALM", "Signature", "Heavyweight", "Tee"].join(" "),
  ["kalm", "buffalo", "heavyweight"].join("-")
];

check("product exists", Boolean(product), "KALM-TEE-SIGNATURE-001");
check("approved identity", product?.title === "KALM Signature Oversized Tee" && product?.slug === "kalm-signature-oversized-tee", `${product?.title} / ${product?.slug}`);
check("brand and price", product?.brand === "KALM Collective" && product?.price === 699 && product?.currency === "ZAR", `R${product?.price} ${product?.currency}`);
check("approved colours and sizes", JSON.stringify(product?.colors) === JSON.stringify(["Black", "White"]) && JSON.stringify(product?.sizes) === JSON.stringify(["S", "M", "L", "XL", "2XL"]), `${product?.colors?.join(", ")} / ${product?.sizes?.join(", ")}`);
check("ten standard commerce variants", product?.variants?.length === 10 && product?.variants?.every((variant) => variant.quantity === null && variant.availability === "in_stock" && variant.enabled === true), `${product?.variants?.length || 0} variants`);
check("black and white galleries each have thirteen assets", product?.variantImages?.Black?.gallery?.length === 13 && product?.variantImages?.White?.gallery?.length === 13, `${product?.variantImages?.Black?.gallery?.length || 0} black / ${product?.variantImages?.White?.gallery?.length || 0} white`);
const allProductImages = Object.values(product?.variantImages || {}).flatMap((entry) => entry.gallery || []);
check("all 26 gallery assets exist", allProductImages.length === 26 && allProductImages.every(exists), `${allProductImages.filter(exists).length} existing images`);
check("paired campaign asset exists", exists("assets/images/products/kalm-collective/kalm-signature-oversized-tee/campaign/black-white-pair.webp"), "campaign image present");
check("standard product route uses normal renderer", !script.includes("renderOdoPilotProduct") && !script.includes("kalm-odo-pilot.json") && script.includes('route.path.startsWith("/product/")'), "no isolated mockup renderer");
check("product is publicly indexable", !robots.includes(rejectedNames[5]) && sitemap.includes("products/kalm-signature-oversized-tee"), "robots and sitemap updated");
check("private commercial reports are blocked", netlify.includes('from = "/reports/KALM-ODO-PILOT/*"'), "Netlify report block present");
check("customer product data has no supplier or production disclosure", !/tshirtscapetown|bulkalot|onedayonly|yolanda|kuhle|private source/i.test(JSON.stringify(product)), "no restricted names in public product data");
check("rejected product names removed from active implementation", rejectedNames.every((name) => ![read("products.json"), script, robots, sitemap].some((content) => content.includes(name))), "no rejected name in active storefront files");
check("required controlled reports exist", requiredReports.every((file) => exists(`reports/KALM-ODO-PILOT/${file}`)), `${requiredReports.filter((file) => !exists(`reports/KALM-ODO-PILOT/${file}`)).length} missing`);

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({ passed: failed.length === 0, checkCount: checks.length, checks, failed }, null, 2));
process.exit(failed.length ? 1 : 0);
