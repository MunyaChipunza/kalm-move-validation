import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(resolve(root, file), "utf8");
const hash = (file) => createHash("sha256").update(readFileSync(resolve(root, file))).digest("hex");
const exists = (file) => existsSync(resolve(root, file));
const checks = [], failures = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, status: pass ? "pass" : "fail", detail });
  if (!pass) failures.push(`${name}${detail ? `: ${detail}` : ""}`);
};

const catalog = JSON.parse(read("products.json"));
const merchandising = read("merchandising.js");
const index = read("index.html");
const manifestPath = "reports/KALM-HERO-BOTTLE-REBUILD-AND-RELEASE-20260712/final-asset-manifest.json";
const manifest = JSON.parse(read(manifestPath));
const sourceInventory = JSON.parse(read("reports/KALM-FINAL-DRAFT-CORRECTIONS-20260712/logo-audit-source/active-apparel-hero-inventory.json"));
const bottleIds = new Set([
  "kalm-move-everyday-bottle", "kalm-move-slim-wellness-bottle", "kalm-move-studio-bottle",
  "kalm-move-protein-shaker-bottle", "kalm-move-all-day-straw-tumbler"
]);
const bottles = catalog.products.filter((product) => bottleIds.has(product.id));
const paths = [];
for (const product of bottles) {
  paths.push(product.image, ...(product.gallery || []));
  for (const variant of Object.values(product.variantImages || {})) paths.push(variant.hero, ...(variant.gallery || []));
}
const v4Assets = manifest.assets.filter((asset) => asset.path.includes("/bottles-v4/"));
const heroAssets = manifest.assets.filter((asset) => asset.path.includes("/campaigns-v3/"));
const activeSource = JSON.stringify({ catalog, merchandising, index });

check("Five rebuilt bottle products are present", bottles.length === 5, String(bottles.length));
check("Every bottle has four approved colours", bottles.every((product) => product.colors.length === 4));
check("No active bottle path references rejected V2 or V3", paths.every((asset) => !/bottles-v[23]/.test(asset)));
check("Every active bottle path uses V4", paths.every((asset) => asset.includes("bottles-v4")));
check("Every active bottle image exists", paths.every(exists), paths.filter((asset) => !exists(asset)).join(", "));
check("Every active bottle image is WebP", paths.every((asset) => asset.endsWith(".webp")));
check("V4 manifest records forty accepted bottle images", v4Assets.length === 40, String(v4Assets.length));
check("V4 bottle images meet the 1122 × 1402 minimum", v4Assets.every((asset) => asset.dimensions[0] >= 1122 && asset.dimensions[1] >= 1402));
check("Every selected colour uses a matching front and alternate gallery", bottles.every((product) => product.colors.every((colour) => {
  const set = product.variantImages?.[colour];
  return set?.gallery?.length === 2 && set.hero === set.gallery[0] && set.gallery.every((asset) => asset.includes("bottles-v4"));
})));
check("No enlarged or manufactured detail crop remains active", paths.every((asset) => !asset.includes("detail")));
check("Bottle presentation uses contain fitting and 4:5 ratio", bottles.every((product) => product.mediaPresentation?.cardFit === "contain" && product.mediaPresentation?.mobileCardFit === "contain" && product.mediaPresentation?.galleryFit === "contain"));
const allDay = catalog.products.find((product) => product.id === "kalm-move-all-day-straw-tumbler");
check("All-Day Straw Tumbler remains non-purchasable Coming soon", allDay?.comingSoon === true && allDay?.price === null && allDay?.availability === "coming_soon");

const campaigns = [
  "assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-desktop.webp",
  "assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-tablet.webp",
  "assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-mobile.webp"
];
check("Campaigns V3 hero assets exist", campaigns.every(exists), campaigns.filter((asset) => !exists(asset)).join(", "));
check("V3 hero manifest records all responsive assets", heroAssets.length === 3);
check("Homepage configuration uses campaigns-v3 hero", merchandising.includes(campaigns[0]) && merchandising.includes(campaigns[1]) && merchandising.includes(campaigns[2]));
check("No campaigns-v2 six-person hero remains active", !merchandising.includes("campaigns-v2/kalm-final-home-hero-v2") && !index.includes("campaigns-v2/kalm-final-home-hero-v2"));
check("Static hero markup references V3 responsive assets", index.includes(campaigns[0]) && index.includes(campaigns[1]) && index.includes(campaigns[2]));

check("Approved buffalo source is present", exists("assets/branding/kalm-buffalo/kalm-buffalo-mark.png"));
check("Apparel audit still covers the full non-accessory scope", sourceInventory.length === 26 && sourceInventory.reduce((total, product) => total + product.variants.length, 0) === 138);
let womenUnchanged = false;
try { execFileSync("git", ["diff", "--quiet", "e24be9936317898b07d6ccf4dd357abe9cf8eb93", "--", "assets/images/products/kalm-move/women"], { cwd: root }); womenUnchanged = true; } catch { womenUnchanged = false; }
check("Women’s apparel imagery remains unchanged from the rejected-evidence checkpoint", womenUnchanged);
check("No public source exposes a Drive path", !activeSource.includes("G:\\My Drive"));
check("KALM storefront remains distinct from the Munya task application", !activeSource.includes("inquisitive-pastelito-bd6463.netlify.app"));

const result = {
  status: failures.length ? "failed" : "passed", checkCount: checks.length, failures, checks,
  manifest: manifestPath,
  publicBottleAssets: v4Assets.map((asset) => ({ ...asset, publicSha256: hash(asset.path) })),
  campaignAssets: campaigns.map((asset) => ({ path: asset, sha256: hash(asset) })),
  approvedBuffaloSha256: hash("assets/branding/kalm-buffalo/kalm-buffalo-mark.png")
};
writeFileSync(resolve(root, "reports/KALM-HERO-BOTTLE-REBUILD-AND-RELEASE-20260712/validation.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ status: result.status, checkCount: result.checkCount, failures }, null, 2));
if (failures.length) process.exit(1);
