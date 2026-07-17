import catalogue from "../../../products.json" with { type: "json" };

// This is bundled with each function deploy. Payment functions never accept
// catalogue prices, availability, or variants from the browser as authority.
export function loadAuthoritativeProducts() {
  return structuredClone(catalogue.products || []);
}
