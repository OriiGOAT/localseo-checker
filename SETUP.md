# LocalSEO Checker - Setup & Deployment Guide

## ✨ Features

- **Domain Audit**: Enter any domain to get an SEO analysis
- **Performance Analysis**: Integrates with Google PageSpeed Insights API
- **Meta Tag Validation**: Checks for title, description, viewport, canonical URL
- **LocalBusiness Schema Detection**: Identifies if LocalBusiness structured data is present
- **Accessibility Scoring**: Analyzes accessibility compliance
- **Branded HTML Reports**: Download professional audit reports
- **German UI**: Complete German language interface
- **Tailwind CSS**: Modern, responsive design
- **Payment Flow**: Stripe integration for €9.90 audit reports
- **PDF Generation**: Serverless-compatible PDF rendering via Puppeteer
- **Email Delivery**: Reports sent via Resend email service

## 🚀 Quick Start

### 1. Install Dependencies

The project is already initialized. If you need to reinstall:

```bash
cd localseo-checker
npm install
```

### 2. Configure Environment Variables

Edit `.env.local` and add your API keys:

```env
# Application URL (for webhook callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google PageSpeed Insights API Key (required)
# Get one from: https://console.cloud.google.com/
NEXT_PUBLIC_PAGESPEED_API_KEY=your_key_here

# Resend Email Service (required for paid audits)
# Get one from: https://resend.com
RESEND_API_KEY=your_resend_key_here

# Stripe (required for payment flow)
# Get keys from: https://dashboard.stripe.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## 🏗️ Project Structure

```
localseo-checker/
├── app/
│   ├── page.tsx              # Main page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── api/
│       └── audit/
│           └── route.ts      # Audit API endpoint
├── components/
│   ├── AuditForm.tsx         # Domain input form
│   ├── AuditResults.tsx      # Results display & report
│   ├── ScoreCard.tsx         # Score visualization
│   └── ActionItems.tsx       # Action items list
├── public/                   # Static assets
└── package.json
```

## 💳 Payment Flow

### Setup Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Create new endpoint pointing to: `https://yourdomain.com/api/webhook`
4. Subscribe to: `checkout.session.completed`
5. Copy webhook secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`

### Payment Process

1. User enters domain and email → clicks "Jetzt kaufen – €9,90"
2. Creates Stripe checkout session → stores pending audit in `/tmp/sessions.json`
3. User completes payment on Stripe Checkout
4. Stripe sends webhook to `/api/webhook`
5. Webhook handler:
   - Runs audit via `/api/audit`
   - Generates PDF via `/api/generate-pdf`
   - Sends email via Resend with PDF attachment
   - Cleans up session data
6. User sees success page with confirmation

### Free vs Paid Audit

- **Free Audit**: Instant results, no email
- **Paid Audit** (€9.90): 
  - Detailed PDF report
  - Sent to email via Resend
  - Webhook-triggered processing

### Storage

Pending audits are stored in `/tmp/sessions.json` (ephemeral):
```json
{
  "cs_1234567890": {
    "domain": "example.com",
    "email": "user@example.com",
    "createdAt": "2026-06-04T13:00:00.000Z"
  }
}
```

**Note**: For production, replace `/tmp/sessions.json` with Vercel KV or another persistent store.

## 📊 Audit Scoring

The final score (0-100) is calculated from:

- **Performance** (25%): Google Lighthouse performance score
- **Accessibility** (15%): Google Lighthouse accessibility score
- **Meta Tags** (30%): Title, description, viewport, canonical URL, OG image
- **Schema Markup** (30%): LocalBusiness JSON-LD structured data

### Score Interpretation

- 90-100: 🟢 Ausgezeichnet (Excellent)
- 75-89: 🟡 Gut (Good)
- 50-74: 🟠 Befriedigend (Satisfactory)
- 0-49: 🔴 Verbesserungsbedürftig (Needs Improvement)

## 🔧 API Endpoints

### POST /api/audit

Runs SEO audit on a domain.

**Request:**
```json
{
  "domain": "example.com"
}
```

**Response:**
```json
{
  "score": 75,
  "performanceScore": 85,
  "accessibilityScore": 90,
  "metaTagsScore": 60,
  "schemaMarkupScore": 100,
  "issues": ["Meta-Beschreibung fehlt"],
  "strengths": ["LocalBusiness Schema vorhanden"],
  "actionItems": [
    {
      "title": "Meta-Beschreibung hinzufügen",
      "description": "...",
      "priority": "high"
    }
  ],
  "metadata": {
    "domain": "example.com",
    "auditedAt": "2026-06-04T...",
    "metaTags": {...},
    "hasLocalBusinessSchema": true,
    "mobileUsable": true
  }
}
```

### POST /api/create-checkout-session

Creates Stripe checkout session for paid audit.

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
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_1234567890"
}
```

**Note**: Session data stored in `/tmp/sessions.json`

### POST /api/generate-pdf

Generates PDF from audit results.

**Request:**
```json
{
  "score": 75,
  "metadata": {...},
  ...
}
```

**Response:** PDF file (binary)

### POST /api/webhook

Stripe webhook handler for `checkout.session.completed`.

**Expects:**
- Stripe signature in `stripe-signature` header
- Raw JSON body from Stripe

**Process:**
1. Verifies Stripe signature
2. Retrieves pending audit from session storage
3. Runs audit
4. Generates PDF
5. Sends email via Resend
6. Cleans up session data

## 📧 Email Integration (Resend)

To enable report sending via email, set up Resend API key in `.env.local` and configure the email logic in the components.

## 💳 Stripe Integration

To enable payment features:

1. Add Stripe keys to `.env.local`
2. Install Stripe: `npm install stripe @stripe/react-stripe-js`
3. Create payment routes as needed

## 📝 Database (Optional)

For storing audit history, add a database:

```bash
npm install @prisma/client
npx prisma init
```

Configure your database URL in `.env.local`.

## 🌐 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Environment Variables in Vercel Dashboard:**
1. Go to Project → Settings → Environment Variables
2. Add all vars from `.env.local`
3. Set `NEXT_PUBLIC_APP_URL` to your production domain

**Update Stripe Webhook:**
1. Stripe Dashboard → Webhooks → add endpoint
2. URL: `https://yourdomain.vercel.app/api/webhook`
3. Subscribe to: `checkout.session.completed`
4. Copy secret → update `STRIPE_WEBHOOK_SECRET`

### Production Session Storage

By default, `/tmp/sessions.json` is ephemeral and not suitable for production.

**Upgrade to Vercel KV:**

1. **Create KV store**
   ```bash
   vercel env pull  # Get production env vars
   ```

2. **Install @vercel/kv**
   ```bash
   npm install @vercel/kv
   ```

3. **Replace session storage logic**
   
   In `/api/create-checkout-session/route.ts`:
   ```typescript
   import { kv } from '@vercel/kv';
   
   // Save: await kv.set(sessionId, { domain, email, createdAt }, { ex: 3600 });
   // Get: const session = await kv.get(sessionId);
   // Delete: await kv.del(sessionId);
   ```

4. **Update webhook handler** similarly

**Alternative: Upstash Redis**
- Serverless Redis compatible with Vercel Edge Functions
- See: https://upstash.com

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_PAGESPEED_API_KEY: ${NEXT_PUBLIC_PAGESPEED_API_KEY}
```

## 🧪 Testing

### Test Stripe Integration Locally

1. **Install Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Linux/Windows: Download from https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**
   ```bash
   stripe login
   ```

3. **Forward webhook events**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
   
   This will output:
   ```
   Ready! Your webhook signing secret is: whsec_test_...
   ```
   Copy this secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`

4. **Test payment flow**
   - Visit http://localhost:3000
   - Click "Jetzt kaufen – €9,90"
   - Enter domain and email
   - Use test card: `4242 4242 4242 4242`
   - Future date expiry, any CVC

### Manual API Testing

```bash
# Test audit endpoint
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"domain":"example.com"}'

# Test checkout session (requires STRIPE_SECRET_KEY)
curl -X POST http://localhost:3000/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"domain":"example.com","email":"test@example.com"}'

# Test PDF generation
curl -X POST http://localhost:3000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{...audit result...}' > report.pdf
```

### Run Linting & Build

```bash
# Run linting
npm run lint

# Build check
npm run build

# Type check
npx tsc --noEmit
```

## 🔐 Security Notes

- Never commit `.env.local` (add to `.gitignore`)
- Rotate API keys regularly
- Use environment variables for all secrets
- PageSpeed API key can be marked as NEXT_PUBLIC since it's rate-limited per domain

## 📱 Mobile Optimization

The app is fully responsive and mobile-friendly. The Tailwind CSS grid adapts to all screen sizes.

## 🎨 Customization

### Colors

Edit `globals.css` to change the color scheme. Current theme uses:
- Purple/Pink gradients
- Slate gray accents
- Green for successes
- Red for issues

### Language

The UI is in German. To change text:
1. Create a translations file
2. Update text in components
3. Add language switcher in layout

## 📚 Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Google PageSpeed API](https://developers.google.com/speed/docs/insights/v5/get-started)
- [JSON-LD for LocalBusiness](https://schema.org/LocalBusiness)
- [Resend Docs](https://resend.com/docs)
- [Stripe Docs](https://stripe.com/docs)

## 🐛 Troubleshooting

**PageSpeed API returns 0 scores:**
- Add `NEXT_PUBLIC_PAGESPEED_API_KEY` to `.env.local`
- Get a free key from [Google Cloud Console](https://console.cloud.google.com/)

**Scraping fails:**
- Check if domain is accessible
- Some sites block automated requests
- Consider using a proxy service

**Build errors:**
- Delete `node_modules` and `.next`: `rm -rf node_modules .next`
- Reinstall: `npm install && npm run build`

## 📞 Support

For issues, check:
1. The error message in browser console
2. Server logs: `npm run dev` output
3. API response: Check POST request to `/api/audit`

---

Built with ❤️ using Next.js 14, Tailwind CSS, and TypeScript
