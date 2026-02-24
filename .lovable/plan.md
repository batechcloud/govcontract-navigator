

# Enhanced Billing Tab with Stripe Integration

## Current State
The Settings Billing tab currently shows only:
- Current plan name and price
- A "View All Plans" link
- A "contact support" message

It lacks payment management, history, and invoicing — all essential for a subscription product.

## What Will Be Built

### 1. Enable Stripe Integration
Connect Stripe to handle real payments, subscriptions, and invoicing. This is a prerequisite for all billing features.

### 2. Stripe Customer Portal Integration
Rather than building payment forms from scratch, we'll use Stripe's hosted Customer Portal which provides:
- **Update payment method** (credit card, bank account)
- **View payment history** with all past charges
- **Download invoices** as PDFs
- **Cancel or change subscription**
- **Update billing address**

This is the industry-standard approach — secure, PCI-compliant, and maintained by Stripe.

### 3. Checkout Flow for Plan Upgrades
When a user clicks "Upgrade" or selects a new plan from the pricing page, they'll be redirected to a Stripe Checkout session to complete payment.

### 4. Enhanced Billing Tab UI
Redesign the billing section to include:
- **Current Plan card** — plan name, price, renewal date, status badge
- **Payment Method card** — last 4 digits of card, expiration, "Update" button (opens Stripe Portal)
- **Billing History section** — table of recent invoices with date, amount, status, and download link
- **"Manage Billing" button** — opens Stripe Customer Portal for full control
- **"Upgrade Plan" button** — triggers Stripe Checkout for plan changes

### 5. Backend (Edge Functions)

**`create-checkout-session`** — Creates a Stripe Checkout session for new subscriptions or upgrades:
- Accepts plan ID and billing interval (monthly/yearly)
- Creates or retrieves the Stripe customer for the authenticated user
- Returns checkout URL for redirect

**`create-portal-session`** — Creates a Stripe Customer Portal session:
- Looks up the user's Stripe customer ID
- Returns portal URL where users manage payment methods, view invoices, cancel, etc.

**`stripe-webhook`** — Handles Stripe events to keep the database in sync:
- `checkout.session.completed` — Activates subscription in `user_subscriptions`
- `invoice.paid` — Records successful payment
- `customer.subscription.updated` — Syncs plan changes
- `customer.subscription.deleted` — Marks subscription as cancelled

### 6. Database Changes
- Add `stripe_customer_id` column to `profiles` table (to link Supabase users to Stripe customers)
- Add `stripe_subscription_id` column to `user_subscriptions` table
- Create `payment_history` table to cache invoice data for quick display without hitting Stripe API every time

## Technical Details

### New Edge Functions
| Function | Purpose |
|---|---|
| `create-checkout-session` | Generate Stripe Checkout URL for plan purchase |
| `create-portal-session` | Generate Stripe Customer Portal URL |
| `stripe-webhook` | Sync Stripe events to database |

### Database Migration
```text
profiles
  + stripe_customer_id (text, nullable)

user_subscriptions
  + stripe_subscription_id (text, nullable)
  + stripe_price_id (text, nullable)

NEW TABLE: payment_history
  - id (uuid, PK)
  - user_id (uuid, FK)
  - stripe_invoice_id (text)
  - amount (integer, cents)
  - currency (text, default 'usd')
  - status (text: paid, failed, pending)
  - invoice_url (text, Stripe-hosted invoice PDF)
  - period_start (timestamptz)
  - period_end (timestamptz)
  - created_at (timestamptz)
```

### Updated Settings Billing Tab Layout
```text
+------------------------------------------+
| Current Plan                             |
| [Professional]  $149/month               |
| Renews: March 24, 2026    [Upgrade]      |
+------------------------------------------+
| Payment Method                           |
| Visa ending in 4242  Exp 12/27           |
| [Update Payment Method]                  |
+------------------------------------------+
| Recent Invoices                          |
| Date       | Amount | Status | Invoice   |
| Feb 24     | $149   | Paid   | Download  |
| Jan 24     | $149   | Paid   | Download  |
| Dec 24     | $149   | Paid   | Download  |
+------------------------------------------+
| [Manage Billing]  (opens Stripe Portal)  |
+------------------------------------------+
```

### New Secret Required
- `STRIPE_SECRET_KEY` — Stripe secret API key (collected via Stripe integration tool)
- `STRIPE_WEBHOOK_SECRET` — For verifying webhook signatures

### Files Created/Modified
| File | Action |
|---|---|
| `supabase/functions/create-checkout-session/index.ts` | Create |
| `supabase/functions/create-portal-session/index.ts` | Create |
| `supabase/functions/stripe-webhook/index.ts` | Create |
| `src/pages/Settings.tsx` | Modify billing tab |
| `src/hooks/usePaymentHistory.tsx` | Create |
| Database migration | Add columns + new table |

## Implementation Order
1. Enable Stripe integration (collects API key)
2. Run database migration (add columns + payment_history table)
3. Create edge functions (checkout, portal, webhook)
4. Update Settings billing tab UI
5. Test end-to-end flow

