import { publicInventorySnapshot } from "./_shared/commerce-store.mjs";
import { json, safeError } from "./_shared/http.mjs";

export const config = { path: "/api/commerce/inventory", method: ["GET"] };

export default async function commerceInventory() {
  try {
    return json({ source: "verified_phase_one_inventory", variants: await publicInventorySnapshot() });
  } catch (error) { return safeError(error); }
}
