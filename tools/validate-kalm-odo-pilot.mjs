import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed, detail });

const pilot = JSON.parse(read("data/kalm-odo-pilot.json"));
const script = read("script.js");
const robots = read("robots.txt");
const sitemap = read("sitemap.xml");
const requiredReports = [
  "SUPPLIER-WEBSITE-AUDIT.md",
  "SUPPLIER-PRODUCT-CATALOGUE.json",
  "SUPPLIER-EVIDENCE-REGISTER.json",
  "PRODUCT-OPTION-SCORECARD.xlsx",
  "PRODUCT-SHORTLIST.md",
  "FIT-AND-SHRINKAGE-TEST.md",
  "SIZE-GUIDE-DRAFT.md",
  "STOCK-RESERVATION-MODEL.md",
  "SUPPLIER-CAPACITY-CONFIRMATION.json",
  "KALM-ODO-UNIT-ECONOMICS.xlsx",
  "PRICING-RECOMMENDATION.md",
  "ODO-MARGIN-SENSITIVITY.json",
  "PRODUCT-IDENTITY-AND-EMBROIDERY-SPEC.md",
  "SAMPLE-PROCUREMENT-PLAN.md",
  "SAMPLE-QA-CHECKLIST.md",
  "IMAGE-GENERATION-BRIEF.md",
  "ODO-APPLICATION-ANSWER-SHEET.md",
  "THREE-DAY-FULFILMENT-PLAN.md",
  "FULFILMENT-CAPACITY.json",
  "ODO-DELIVERY-CHECKLIST.md",
  "GATE-STATUS.md",
  "COMMERCIAL-PILOT-READINESS.json"
];

check("review route uses approved slug", pilot.slug === "kalm-buffalo-heavyweight-tee", pilot.slug);
check("review product is non-commerce", pilot.customerCommerce === false && pilot.publicationStatus === "review-only", "customerCommerce=false; publicationStatus=review-only");
check("planned colours are black and white", JSON.stringify(pilot.colours) === JSON.stringify(["Black", "White"]), pilot.colours.join(", "));
check("intended sizes are S to 2XL", JSON.stringify(pilot.sizes) === JSON.stringify(["S", "M", "L", "XL", "2XL"]), pilot.sizes.join(", "));
check("review price is a plain proposed retail price", pilot.proposedRetailPrice === 699 && pilot.currency === "ZAR", `R${pilot.proposedRetailPrice} ${pilot.currency}`);
check("direct route renderer exists", script.includes('route.path === "/product/kalm-buffalo-heavyweight-tee"') && script.includes("function renderOdoPilotProduct()"), "Dedicated route and renderer found");
const pilotBlock = script.slice(script.indexOf("function renderOdoPilotProduct"), script.indexOf("function renderCartPage"));
check("review route exposes no Add to Bag", !/data-add-to-bag|Buy Now|Add to Bag/i.test(pilotBlock), "No commerce control in pilot renderer");
check("review route has no Product Offer structured data", pilotBlock.includes('setStructuredData({ type: "website" })'), "WebSite-only structured data");
check("review route is noindex", robots.includes("Disallow: /products/kalm-buffalo-heavyweight-tee") && script.includes("noindex,nofollow,noarchive"), "robots.txt and dynamic robots meta");
check("review route absent from sitemap", !sitemap.includes("kalm-buffalo-heavyweight-tee"), "No sitemap entry");
check("public product data contains no supplier or private-source disclosure", !/tshirtscapetown|bulkalot|onedayonly|kuhle|source reference/i.test(JSON.stringify(pilot)), "No supplier/private names in product data");
check("approved buffalo artwork is used", pilotBlock.includes("assets/branding/kalm-buffalo/kalm-buffalo-mark-cropped.png"), "Approved source path only");
check("concept disclosure appears", pilotBlock.includes('"CON" + "CEPT MOCKUP — NOT PRODUCT EVIDENCE"'), "Disclosure present");
check("required commercial reports exist", requiredReports.every((file) => exists(`reports/KALM-ODO-PILOT/${file}`)), `${requiredReports.filter((file) => !exists(`reports/KALM-ODO-PILOT/${file}`)).length} missing`);
const protectedPaths = ["products.json", "merchandising.js", "data/kalm-move-preview-prices.json"];
let protectedDataUnchanged = true;
try {
  execFileSync("git", ["diff", "--quiet", "origin/master", "--", ...protectedPaths], { cwd: root, stdio: "ignore" });
} catch {
  protectedDataUnchanged = false;
}
check("no protected catalogue data is edited", protectedDataUnchanged, `Compared ${protectedPaths.join(", ")} against origin/master`);

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({ passed: failed.length === 0, checkCount: checks.length, checks, failed }, null, 2));
process.exit(failed.length ? 1 : 0);
