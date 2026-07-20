import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const reportDirectory = new URL("../reports/KALM-MOVE-LAUNCHING-SOON/", import.meta.url);
const products = JSON.parse(await readFile(new URL("products.json", root), "utf8")).products;
const priceEntries = JSON.parse(await readFile(new URL("data/kalm-move-preview-prices.json", root), "utf8"));
const prices = new Map(priceEntries.map((entry) => [entry.productId, entry]));
const allMoveProducts = products.filter((product) => product.brandId === "kalm-move");
const availableNowProducts = allMoveProducts.filter((product) => product.launchStatus === "available-now");
const moveProducts = allMoveProducts.filter((product) => product.launchStatus !== "available-now");

await mkdir(reportDirectory, { recursive: true });

const audit = {
  generatedAt: new Date().toISOString(),
  source: "products.json",
  scope: "KALM Move Launching Soon products plus the available-now Signature Tee",
  totalKalmMoveProducts: allMoveProducts.length,
  totalExistingLaunchingSoonKalmMoveProducts: moveProducts.length,
  availableNowKalmMoveProducts: availableNowProducts.length,
  visibleLaunchingSoonProducts: moveProducts.filter((product) => prices.get(product.id)?.status === "launching-soon").length,
  excludedProducts: moveProducts.filter((product) => prices.get(product.id)?.status !== "launching-soon").length,
  products: allMoveProducts.map((product) => {
    const price = prices.get(product.id) || null;
    return {
      currentProductId: product.id,
      currentName: product.title,
      genderOrCollection: product.collection,
      category: product.type,
      currentColours: product.colors,
      currentSizes: product.sizes,
      currentImages: [...new Set([product.image, ...(product.gallery || []), ...Object.values(product.variantImages || {}).flatMap((value) => Array.isArray(value) ? value : [value])].filter(Boolean))],
      currentPrice: product.price,
      currentPurchasability: !product.comingSoon && product.availability !== "coming_soon",
      currentPublicRoute: `/products/${product.slug}`,
      proposedNewPrice: price?.price ?? product.price,
      previewCategory: price?.category ?? product.category,
      previewStatus: price?.status ?? (product.launchStatus === "available-now" ? "available-now" : "missing-price-mapping"),
      excludedReason: price?.exclusionReason ?? null
    };
  })
};

const demandDashboardBaseline = {
  generatedAt: new Date().toISOString(),
  title: "KALM Move Launching Soon demand dashboard baseline",
  access: "Authenticated Netlify Forms owner export processed locally; this source-only report is blocked from Netlify public paths.",
  collector: "Netlify Form: kalm-move-launch-interest",
  dataStatus: "No customer event export has been processed for this preview baseline.",
  totals: {
    wishlistSaves: 0,
    uniqueInterestedVisitors: 0,
    notifyMeRegistrations: 0,
    productViewToWishlistConversion: 0,
    wishlistToNotifyConversion: 0
  },
  dimensions: ["product", "displayed price", "colour", "size", "women's or men's range", "date"],
  duplicateAndSuspiciousActivityFilters: {
    eventId: "Discard duplicate event_id values.",
    wishlist: "Keep one wishlist save per anonymous_session_id, product_id, colour and size per 24 hours.",
    notify: "Keep one notify registration per normalized email, product_id, colour and size per 24 hours.",
    suspicious: "Flag sessions with more than 30 wishlist events in five minutes or malformed product/price mappings for review."
  },
  csvExport: {
    command: "node tools/export-kalm-move-demand.mjs <authenticated-netlify-forms-export.json>",
    outputs: ["DEMAND-DASHBOARD.json", "DEMAND-EVENTS-RECONCILED.csv"]
  },
  privacy: "No customer email addresses are included in this report. Email is retained only in the authenticated collection export for launch communication."
};

await writeFile(new URL("KALM-MOVE-CATALOGUE-AUDIT.json", reportDirectory), `${JSON.stringify(audit, null, 2)}\n`);
await writeFile(new URL("DEMAND-DASHBOARD-BASELINE.json", reportDirectory), `${JSON.stringify(demandDashboardBaseline, null, 2)}\n`);
console.log(`Created KALM Move catalogue audit for ${audit.totalKalmMoveProducts} KALM Move products.`);
