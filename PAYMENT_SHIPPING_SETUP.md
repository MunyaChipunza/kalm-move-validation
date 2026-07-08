# Payment and Shipping Setup

The storefront is ready for cart and order assistance. Live payment and live carrier/rate setup are the remaining ecommerce activation tasks.

## Recommended payment providers

Shortlist for a South African small activewear store:

1. Yoco
   - Good fit for simple card payments and SA merchant onboarding.
   - Docs: `https://developer.yoco.com/`
2. PayFast by Network
   - Common SA ecommerce gateway with broad local payment method support.
   - Docs: `https://developers.payfast.co.za/`
3. Paystack
   - Strong API-first checkout option with South Africa support.
   - Docs: `https://paystack.com/docs/`
4. Peach Payments
   - More enterprise-capable option if later moving into a fuller commerce stack.
   - Docs: `https://developer.peachpayments.com/`

Recommended first implementation: Yoco or PayFast, depending on merchant account approval speed, fee structure and desired payment methods.

## Required environment variables

Use Netlify environment variables, not hardcoded keys:

| Variable | Purpose |
|---|---|
| `PAYMENT_PROVIDER` | `yoco`, `payfast`, `paystack` or `peach` |
| `PAYMENT_PUBLIC_KEY` | Public checkout key where required |
| `PAYMENT_SECRET_KEY` | Server-side secret key |
| `PAYMENT_WEBHOOK_SECRET` | Webhook signature validation |
| `STORE_BASE_URL` | Live storefront URL |
| `ORDER_NOTIFICATION_EMAIL` | Order alert destination |

## Checkout activation steps

1. Confirm provider and merchant account.
2. Create a serverless endpoint under Netlify Functions:
   - `/.netlify/functions/create-checkout`
   - Accept cart lines, customer details and delivery area.
   - Reprice cart server-side from `products.json`.
   - Reject unavailable KS Active stock until physical counts are confirmed.
3. Create a payment provider checkout/session from the serverless function.
4. Redirect customer to the hosted payment page or render provider checkout.
5. Add a webhook endpoint:
   - `/.netlify/functions/payment-webhook`
   - Verify signature.
   - Store paid order reference.
   - Send order notification.
6. Replace the assisted checkout message only after test payments and webhooks pass.

## Shipping options

Shortlist:

1. Bob Go / uAfrica shipping automation
   - Useful for multi-courier SA ecommerce rate and fulfilment workflows.
   - Docs: `https://docs.bobgo.co.za/`
2. The Courier Guy
   - Common local courier option if using direct account/rates.
   - Site: `https://www.thecourierguy.co.za/`
3. Pargo
   - Useful if pickup points become part of the delivery model.
   - Site: `https://pargo.co.za/`
4. Manual flat rate
   - Fastest first version if order volume is low.

Recommended first implementation: manual flat rate for launch, then Bob Go/uAfrica once fulfilment volume justifies automation.

## Shipping rule setup

Initial manual rules:

| Rule | Suggested handling |
|---|---|
| Local handoff | Confirm by WhatsApp |
| Major city courier | Flat rate, configured after courier quote |
| Outlying areas | Quote before payment |
| Free delivery threshold | Add only after gross margin is confirmed |

## Testing checklist

- Sandbox checkout creates payment session.
- Failed payment returns to cart.
- Paid webhook is verified.
- Cart is repriced server-side.
- KS Active products cannot oversell confirmed variant quantity.
- Shipping cost appears before payment.
- POPIA wording remains visible near customer data capture.
- Email/order notification contains product, size, colour, quantity, customer and delivery area.

## Go-live checklist

- Merchant account approved.
- Settlement bank account verified.
- Webhook secret configured.
- Payment test mode disabled.
- Courier/rate rules configured.
- Returns/exchanges policy reviewed.
- Physical KS Active stock count completed before public "in stock" claims.
