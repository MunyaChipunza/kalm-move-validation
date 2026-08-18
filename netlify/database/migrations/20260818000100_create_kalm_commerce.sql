-- KALM Collective Phase 1 commerce ledger.
-- This schema is intentionally relational: payment callbacks and inventory
-- movements must be committed atomically to prevent duplicate fulfilment or
-- overselling limited KS Active Archive units.

CREATE TABLE IF NOT EXISTS commerce_inventory (
  sku TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  colour TEXT NOT NULL,
  size TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  sold_quantity INTEGER NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
  sellable BOOLEAN NOT NULL DEFAULT TRUE,
  authority_source TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (available_quantity + reserved_quantity + sold_quantity >= 0)
);

CREATE TABLE IF NOT EXISTS commerce_orders (
  order_id TEXT PRIMARY KEY,
  order_reference TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  seller_name TEXT NOT NULL,
  seller_registration TEXT NOT NULL,
  checkout_mode TEXT NOT NULL CHECK (checkout_mode IN ('owner_test', 'public', 'closed')),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB NOT NULL,
  shipping_method TEXT NOT NULL,
  shipping_charge_cents INTEGER NOT NULL CHECK (shipping_charge_cents >= 0),
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'ZAR' CHECK (currency = 'ZAR'),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded', 'chargeback')),
  fulfilment_status TEXT NOT NULL DEFAULT 'not_ready' CHECK (fulfilment_status IN ('not_ready', 'ready_to_pack', 'packed', 'dispatched', 'delivered', 'return_requested', 'return_received', 'closed')),
  refund_status TEXT NOT NULL DEFAULT 'none' CHECK (refund_status IN ('none', 'requested', 'authorised', 'received', 'approved', 'rejected', 'processed', 'closed')),
  legal_acceptance JSONB NOT NULL,
  marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  payfast_payment_id TEXT UNIQUE,
  payfast_status TEXT,
  invoice_reference TEXT UNIQUE,
  reserved_until TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (total_cents = subtotal_cents + shipping_charge_cents)
);

CREATE TABLE IF NOT EXISTS commerce_order_items (
  order_id TEXT NOT NULL REFERENCES commerce_orders(order_id) ON DELETE RESTRICT,
  sku TEXT NOT NULL REFERENCES commerce_inventory(sku) ON DELETE RESTRICT,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  colour TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  line_total_cents INTEGER NOT NULL CHECK (line_total_cents >= 0),
  PRIMARY KEY (order_id, sku),
  CHECK (line_total_cents = quantity * unit_price_cents)
);

CREATE TABLE IF NOT EXISTS commerce_reservations (
  order_id TEXT NOT NULL REFERENCES commerce_orders(order_id) ON DELETE CASCADE,
  sku TEXT NOT NULL REFERENCES commerce_inventory(sku) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (order_id, sku)
);

CREATE TABLE IF NOT EXISTS commerce_payment_events (
  event_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES commerce_orders(order_id) ON DELETE RESTRICT,
  gateway TEXT NOT NULL CHECK (gateway = 'payfast'),
  gateway_transaction_id TEXT,
  event_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  verification_state TEXT NOT NULL CHECK (verification_state IN ('received', 'verified', 'rejected', 'duplicate')),
  payload_sha256 TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE (gateway, gateway_transaction_id),
  UNIQUE (gateway, payload_sha256)
);

CREATE TABLE IF NOT EXISTS commerce_fulfilment_events (
  fulfilment_event_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES commerce_orders(order_id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN ('ready_to_pack', 'packed', 'dispatched', 'delivered', 'return_received', 'restocked', 'not_restocked')),
  courier TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commerce_refunds (
  refund_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES commerce_orders(order_id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  reason TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('requested', 'authorised', 'received', 'approved', 'rejected', 'submitted_to_payfast', 'processed', 'closed')),
  payfast_refund_reference TEXT,
  restock_decision TEXT CHECK (restock_decision IN ('pending', 'restockable', 'not_restockable')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commerce_email_outbox (
  email_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES commerce_orders(order_id) ON DELETE RESTRICT,
  message_type TEXT NOT NULL CHECK (message_type IN ('payment_received_customer', 'payment_received_internal', 'dispatch_customer', 'owner_test_access')),
  recipient TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'sending', 'sent', 'failed', 'blocked_configuration')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  provider_message_id TEXT,
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  UNIQUE (order_id, message_type, recipient)
);

CREATE TABLE IF NOT EXISTS commerce_marketing_preferences (
  email TEXT PRIMARY KEY,
  subscribed BOOLEAN NOT NULL,
  source TEXT NOT NULL,
  consent_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commerce_analytics_events (
  analytics_event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  order_id TEXT REFERENCES commerce_orders(order_id) ON DELETE SET NULL,
  sku TEXT,
  source TEXT,
  device_category TEXT,
  data JSONB NOT NULL DEFAULT '{}'::JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS commerce_orders_status_idx ON commerce_orders(payment_status, fulfilment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS commerce_reservations_expiry_idx ON commerce_reservations(expires_at);
CREATE INDEX IF NOT EXISTS commerce_inventory_product_idx ON commerce_inventory(product_id, sellable);
CREATE INDEX IF NOT EXISTS commerce_payment_events_order_idx ON commerce_payment_events(order_id, received_at DESC);
