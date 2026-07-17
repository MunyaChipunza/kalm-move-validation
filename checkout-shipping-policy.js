(() => {
  const standardCourier = Object.freeze({
    method: "standard_courier",
    label: "Standard courier",
    estimate: "2 to 5 business days",
    fee: 0
  });

  function migrateStoredCartItem(item) {
    if (!item || typeof item !== "object") return item;
    const migrated = { ...item };
    const hasStoredShipping = Object.hasOwn(migrated, "shippingMethod") || Object.hasOwn(migrated, "deliveryMethod");
    if (hasStoredShipping) migrated.shippingMethod = standardCourier.method;
    delete migrated.deliveryMethod;
    delete migrated.shippingFee;
    delete migrated.shippingFeeCents;
    return migrated;
  }

  globalThis.KALM_CHECKOUT_SHIPPING = Object.freeze({ standardCourier, migrateStoredCartItem });
})();
