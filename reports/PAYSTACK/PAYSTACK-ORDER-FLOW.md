# Paystack Order Flow

1. The customer reviews the bag and enters delivery details.
2. The browser submits selected SKUs, colours, sizes and quantities to the server. Browser prices and totals are ignored.
3. The server reads the authoritative catalogue, validates sellability, re-calculates ZAR cents and creates a `pending_payment` order in Netlify Blobs.
4. The server initialises the Paystack transaction using the active secret key and returns only the authorisation URL, access code and safe reference.
5. Paystack redirects to `/checkout/payment-result?reference=…` after its own checkout flow.
6. The callback page calls the server verification route. It never trusts the redirect query string as payment proof.
7. The server obtains the transaction from Paystack, checks success status, amount, ZAR currency, reference, test domain and customer email.
8. The signed webhook independently performs the same verification for `charge.success`.
9. The first valid verification transitions the order to `paid`; later callback or webhook deliveries return the same paid order idempotently.
10. In test mode, the order remains visibly flagged `TEST PAYMENT — NO REAL MONEY — DO NOT FULFIL`; inventory is not decremented, fulfilment is not created and `zohoPostingEnabled=false`.

Possible order states: `draft`, `pending_payment`, `payment_processing`, `paid`, `payment_failed`, `payment_abandoned`, `cancelled`, `refunded`.

## Live-mode boundary

Live activation is intentionally absent from this change. A future approved live flow may post a verified paid order to Zoho and fulfilment only after the live-readiness gate is complete.
