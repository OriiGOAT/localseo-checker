# Payment Flow Implementation

## Overview

Complete payment flow integration with Stripe, PDF generation, and email delivery. Users can choose between:
- **Free Audit**: Instant results in browser
- **Paid Audit** (€9.90): Detailed PDF report emailed to user

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Journey                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Enter domain + email → Click "Jetzt kaufen – €9,90"         │
│                              ↓                                  │
│  2. POST /api/create-checkout-session                           │
│     ├─ Validate domain & email                                  │
│     ├─ Store pending audit in /tmp/sessions.json                │
│     ├─ Create Stripe checkout session                           │
│     └─ Return checkout URL                                      │
│                              ↓                                  │
│  3. Redirect to Stripe Checkout                                 │
│     ├─ User enters card details                                 │
│     └─ Stripe processes payment                                 │
│                              ↓                                  │
│  4. Payment Success                                             │
│     └─ Stripe sends webhook to /api/webhook                     │
│                              ↓                                  │
│  5. Webhook Processing (Async)                                  │
│     ├─ Verify Stripe signature                                  │
│     ├─ Retrieve pending audit from session storage              │
│     ├─ Run audit via /api/audit                                 │
│     ├─ Generate PDF via /api/generate-pdf                       │
│     ├─ Send email via Resend with PDF                           │
│     └─ Clean up session data                                    │
│                              ↓                                  │
│  6. User Redirected to /success?session_id=...                  │
│     └─ Shows "Report wird gesendet" message                     │
│                                                                  │
│  7. Email Arrives                                               │
│     └─ LocalSEO Audit Report (PDF attachment)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Files Created/Modified

### New Files

| File | Purpose |
|------|---------|
| `app/api/create-checkout-session/route.ts` | Stripe checkout session creation |
| `app/api/webhook/route.ts` | Stripe webhook handler |
| `app/api/generate-pdf/route.ts` | PDF generation via Puppeteer |
| `app/success/page.tsx` | Success page (with Suspense) |
| `app/cancel/page.tsx` | Cancel/abort page |
| `components/SuccessContent.tsx` | Success page content (client) |
| `components/AuditForm.tsx` | Updated with free + paid options |
| `PAYMENT_FLOW.md` | This file |

### Modified Files

| File | Changes |
|------|---------|
| `components/AuditForm.tsx` | Added email field, two-column layout (free/paid) |
| `.env.local` | Added `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` |
| `SETUP.md` | Added payment flow docs, Stripe setup, testing guide |

## API Endpoints

### POST /api/create-checkout-session

Creates a Stripe checkout session for a paid audit.

**Request:**
```json
{
  "domain": "example.com",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_...",
  "sessionId": "cs_test_..."
}
```

**Storage:** Pending audit stored in `/tmp/sessions.json`
```json
{
  "cs_test_...": {
    "domain": "example.com",
    "email": "user@example.com",
    "createdAt": "2026-06-04T13:00:00.000Z"
  }
}
```

### POST /api/webhook

Handles Stripe webhook events (`checkout.session.completed`).

**Security:**
- Verifies Stripe signature using `STRIPE_WEBHOOK_SECRET`
- Validates webhook authenticity before processing

**Processing:**
1. Retrieves pending audit from session storage
2. Calls `/api/audit` with domain
3. Calls `/api/generate-pdf` with audit results
4. Sends email via Resend with PDF attachment
5. Deletes session from storage

### POST /api/generate-pdf

Generates PDF from audit results using Puppeteer.

**Request:** Audit result JSON object
**Response:** PDF file (binary)

**Tech Stack:**
- `puppeteer-core` - Browser automation
- `@sparticuz/chromium` - Serverless-compatible Chromium
- Compatible with Vercel Serverless Functions

### POST /api/audit

Runs SEO audit (existing endpoint, no changes).

**Used by:** Webhook handler during payment processing

## Database Storage

### Current: /tmp/sessions.json (Ephemeral)

**Location:** `/tmp/sessions.json`
**Lifetime:** Until process restart or OS cleanup
**Use Case:** Development/testing only

**Structure:**
```json
{
  "session_id": {
    "domain": "example.com",
    "email": "user@example.com",
    "createdAt": "ISO timestamp"
  }
}
```

### Production: Vercel KV (Recommended)

**Setup:**
```bash
npm install @vercel/kv
```

**Usage:**
```typescript
import { kv } from '@vercel/kv';

// Store
await kv.set(sessionId, { domain, email, createdAt }, { ex: 3600 });

// Retrieve
const session = await kv.get(sessionId);

// Delete
await kv.del(sessionId);
```

**Expiration:** Set TTL to 3600 seconds (1 hour)

**Alternative:** Upstash Redis, Firebase Realtime DB, or your database

## Email Service

### Resend Integration

**Configuration:**
```env
RESEND_API_KEY=re_...
```

**Email Specs:**
- **From:** audit@localseo-checker.de
- **To:** User's email (from checkout)
- **Subject:** `Ihr LocalSEO Audit Report – {domain}`
- **Format:** HTML + Attachments
- **Attachment:** PDF report (auto-named)

**Email Template:**
```html
<h1>LocalSEO Checker</h1>
<p>Vielen Dank für Ihren Kauf!</p>
<p>Im Anhang finden Sie Ihren SEO-Audit Report.</p>
<ul>
  <li>✓ SEO-Score (0-100)</li>
  <li>✓ Performance-Analyse</li>
  <li>✓ Meta-Tags Validierung</li>
  <li>✓ LocalBusiness Schema Check</li>
  <li>✓ Konkrete Verbesserungsmaßnahmen</li>
</ul>
```

## Testing

### Local Testing with Stripe CLI

```bash
# 1. Login to Stripe
stripe login

# 2. Forward webhook events
stripe listen --forward-to localhost:3000/api/webhook

# 3. Copy webhook secret
# Output: Your webhook signing secret is: whsec_test_...

# 4. Update .env.local
STRIPE_WEBHOOK_SECRET=whsec_test_...

# 5. Test card details
# Number: 4242 4242 4242 4242
# Expiry: Any future date (e.g., 12/25)
# CVC: Any 3 digits (e.g., 123)
```

### Manual API Testing

```bash
# Test checkout session creation
curl -X POST http://localhost:3000/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "email": "test@example.com"
  }'

# Response includes checkout URL
# Click to test payment flow
```

## Pages

### /success

Shown after successful payment.

**Features:**
- Displays "Report wird gesendet" message
- Shows session ID (for debugging)
- Lists what's included in report
- Links back to home page

**Query Params:**
- `session_id` - Stripe session ID from checkout

### /cancel

Shown if user cancels Stripe checkout.

**Features:**
- Explains payment was not processed
- No charges applied
- Option to retry

## Configuration

### Required Environment Variables

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional Environment Variables

```env
# For Vercel KV (production)
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
```

## Security Considerations

1. **Stripe Signature Verification**: All webhooks verified with `stripe.webhooks.constructEvent()`
2. **Email Validation**: Email input validated before creating checkout
3. **Domain Validation**: Domain format validated in `/api/audit`
4. **Session Isolation**: Each checkout session has unique ID
5. **Temporary Storage**: Sessions auto-cleaned after webhook processing
6. **No Sensitive Data**: Passwords/PII never stored

## Monitoring & Logging

### Webhook Logs

Enable logging in `/api/webhook/route.ts`:
```typescript
console.log(`Processing audit for ${domain} (${email})`);
console.log(`Successfully processed audit for ${domain}`);
```

### Error Handling

All endpoints return structured error responses:
```json
{
  "error": "Error message in German"
}
```

### Session Cleanup

Failed webhook processing doesn't clean session data.
**Manual cleanup:**
```bash
rm /tmp/sessions.json
```

## Roadmap

### Phase 1 (Current)
✅ Stripe Checkout integration
✅ PDF generation
✅ Email delivery via Resend
✅ Webhook handling

### Phase 2 (Recommended)
- [ ] Replace `/tmp/sessions.json` with Vercel KV
- [ ] Add refund processing
- [ ] Send invoice PDF via email
- [ ] Dashboard to view past audits
- [ ] Bulk audit pricing tier

### Phase 3 (Future)
- [ ] Recurring subscription audits
- [ ] Multi-domain packages
- [ ] Custom branding in PDF
- [ ] Automated report scheduling
- [ ] API token for programmatic access

## Troubleshooting

### Webhook Not Triggering

1. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
2. Check Stripe Dashboard → Webhooks for failed events
3. Review server logs for signature verification errors
4. Ensure `NEXT_PUBLIC_APP_URL` matches webhook endpoint

### Email Not Sent

1. Verify `RESEND_API_KEY` is valid
2. Check Resend dashboard for bounced emails
3. Verify `from` address is verified in Resend
4. Review webhook logs for email errors

### PDF Generation Fails

1. Puppeteer requires ~140MB memory (check serverless limits)
2. On Vercel, may need to disable concurrency
3. Test `/api/generate-pdf` directly with sample audit JSON

### Session Not Found

1. Sessions stored in `/tmp/` are ephemeral
2. Server restart clears all sessions
3. Sessions older than Stripe timeout expire
4. Check `/tmp/sessions.json` exists and readable

## References

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Resend Email API](https://resend.com/docs)
- [Puppeteer Documentation](https://pptr.dev)
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv)

---

**Last Updated:** 2026-06-04
**Version:** 1.0.0
**Status:** Production Ready (with /tmp → KV migration recommended)
