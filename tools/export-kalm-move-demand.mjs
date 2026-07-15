import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const input = process.argv[2];
if (!input) throw new Error("Usage: node tools/export-kalm-move-demand.mjs <authenticated-netlify-forms-export.json>");
const rows = JSON.parse(await readFile(resolve(input), "utf8"));
const events = (Array.isArray(rows) ? rows : rows.submissions || rows.events || []).map((entry) => entry.data || entry).filter(Boolean);
const reportDirectory = new URL("../reports/KALM-MOVE-LAUNCHING-SOON/", import.meta.url);
await mkdir(reportDirectory, { recursive: true });

const normalized = events.map((event) => ({
  eventId: String(event.event_id || event.eventId || ""),
  eventType: String(event.event_type || event.eventType || ""),
  timestamp: String(event.timestamp || event.created_at || event.createdAt || ""),
  sessionId: String(event.anonymous_session_id || event.anonymousSessionId || ""),
  productId: String(event.product_id || event.productId || ""),
  productName: String(event.product_name || event.productName || ""),
  displayedPrice: String(event.displayed_price || event.displayedPrice || ""),
  colour: String(event.preferred_colour || event.preferredColour || ""),
  size: String(event.preferred_size || event.preferredSize || ""),
  range: String(event.range || ""),
  email: String(event.email || "").trim().toLowerCase()
})).filter((event) => event.eventType && event.productId);

const seenEventIds = new Set();
const seenDedupe = new Set();
const reconciled = [];
const exceptions = [];
for (const event of normalized) {
  if (event.eventId && seenEventIds.has(event.eventId)) {
    exceptions.push({ event, reason: "duplicate-event-id" });
    continue;
  }
  if (event.eventId) seenEventIds.add(event.eventId);
  const day = event.timestamp.slice(0, 10);
  const identity = event.eventType === "notify_registration" ? event.email : event.sessionId;
  const dedupeKey = `${event.eventType}::${identity}::${event.productId}::${event.colour}::${event.size}::${day}`;
  if (identity && seenDedupe.has(dedupeKey)) {
    exceptions.push({ event, reason: "duplicate-selection-within-24-hours" });
    continue;
  }
  if (identity) seenDedupe.add(dedupeKey);
  reconciled.push(event);
}

const count = (type) => reconciled.filter((event) => event.eventType === type).length;
const uniqueVisitors = new Set(reconciled.map((event) => event.sessionId).filter(Boolean)).size;
const views = count("product_view");
const saves = count("wishlist_save");
const registrations = count("notify_registration");
const dashboard = {
  sourceFile: basename(input),
  generatedAt: new Date().toISOString(),
  totals: {
    productViews: views,
    wishlistSaves: saves,
    uniqueInterestedVisitors: uniqueVisitors,
    notifyMeRegistrations: registrations,
    productViewToWishlistConversion: views ? Number((saves / views).toFixed(4)) : 0,
    wishlistToNotifyConversion: saves ? Number((registrations / saves).toFixed(4)) : 0
  },
  byProduct: Object.values(reconciled.reduce((result, event) => {
    const key = event.productId;
    result[key] ||= { productId: key, productName: event.productName, displayedPrice: event.displayedPrice, views: 0, wishlistSaves: 0, notifyMeRegistrations: 0 };
    if (event.eventType === "product_view") result[key].views += 1;
    if (event.eventType === "wishlist_save") result[key].wishlistSaves += 1;
    if (event.eventType === "notify_registration") result[key].notifyMeRegistrations += 1;
    return result;
  }, {})),
  duplicateAndSuspiciousActivityExceptions: exceptions.map(({ event, reason }) => ({ ...event, email: event.email ? "redacted" : "", reason }))
};
const csvColumns = ["eventId", "eventType", "timestamp", "sessionId", "productId", "productName", "displayedPrice", "colour", "size", "range"];
const csv = [csvColumns.join(","), ...reconciled.map((event) => csvColumns.map((column) => `"${String(event[column] || "").replaceAll('"', '""')}"`).join(","))].join("\n");
await writeFile(new URL("DEMAND-DASHBOARD.json", reportDirectory), `${JSON.stringify(dashboard, null, 2)}\n`);
await writeFile(new URL("DEMAND-EVENTS-RECONCILED.csv", reportDirectory), `${csv}\n`);
console.log(`Reconciled ${reconciled.length} event(s); ${exceptions.length} duplicate or suspicious event(s) excluded.`);
