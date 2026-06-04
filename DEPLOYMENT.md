# Vercel Deployment Guide

## Prerequisites

- Vercel account (free at https://vercel.com)
- GitHub account with the repository
- All API keys ready (see Environment Variables section)

## Step-by-Step Deployment

### 1. Connect Repository to Vercel

**Option A: Via Vercel Dashboard**
```bash
1. Go to https://vercel.com/new
2. Select "Next.js" template
3. Import your GitHub repository
4. Click "Deploy"
```

**Option B: Via Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel
```

### 2. Configure Environment Variables

**Via Vercel Dashboard:**
1. Go to your project → Settings → Environment Variables
2. Add all variables listed below (see Environment Variables section)
3. Each variable should be added individually

**Via Vercel CLI:**
```bash
vercel env add NEXT_PUBLIC_PAGESPEED_API_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add NEXT_PUBLIC_APP_URL
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add RESEND_API_KEY
```

### 3. Set Production Domain

1. Go to project → Settings → Domains
2. Add your custom domain or use Vercel's provided domain
3. Update `NEXT_PUBLIC_APP_URL` environment variable to match

Example:
```
NEXT_PUBLIC_APP_URL=https://localseo-checker.yourdomain.com
```

### 4. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Create new endpoint with URL: `https://yourdomain.vercel.app/api/webhook`
3. Select events: `checkout.session.completed`
4. Copy webhook signing secret
5. Add to Vercel environment variable: `STRIPE_WEBHOOK_SECRET`

### 5. Verify Deployment

```bash
# Check deployment logs
vercel logs

# Test webhook endpoint
curl -X POST https://yourdomain.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Expected response: 400 (missing signature) or 401 (invalid signature)
# This confirms the endpoint is accessible
```

## Environment Variables

### Required

| Variable | Description | Get From |
|----------|-------------|----------|
| `NEXT_PUBLIC_PAGESPEED_API_KEY` | Google PageSpeed API key | https://console.cloud.google.com/ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | https://dashboard.stripe.com/apikeys |
| `STRIPE_SECRET_KEY` | Stripe secret key | https://dashboard.stripe.com/apikeys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | https://dashboard.stripe.com/webhooks |
| `RESEND_API_KEY` | Resend email API key | https://resend.com/api-keys |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL | Example: `https://localseo-checker.vercel.app` |

### Optional

- None (all required variables are listed above)

## Getting API Keys

### Google PageSpeed Insights API

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable "PageSpeed Insights API"
4. Go to Credentials → Create Credentials → API Key
5. Copy and save the key

### Stripe API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy "Publishable key" → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy "Secret key" → `STRIPE_SECRET_KEY`

### Stripe Webhook Secret

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.vercel.app/api/webhook`
4. Events: `checkout.session.completed`
5. Copy "Signing secret" → `STRIPE_WEBHOOK_SECRET`

### Resend API Key

1. Go to https://resend.com/api-keys
2. Copy your API key → `RESEND_API_KEY`
3. **Important:** Free tier can only send from `onboarding@resend.dev`
4. Pro tier allows custom domain verification

## Deployment Commands

### One-Time Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Automatic Deployments

Once connected to GitHub, Vercel automatically deploys on:
- Push to main branch
- Pull requests (preview deployment)

### Manual Redeployment

```bash
# Trigger redeploy without code changes
vercel --prod --force
```

### View Logs

```bash
# Stream live logs
vercel logs --follow

# View logs from specific time
vercel logs --since 1h
```

## Vercel Configuration (vercel.json)

The `vercel.json` file is pre-configured with:

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "functions": {
    "app/api/**": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

**What this does:**
- `buildCommand`: Runs Next.js build
- `installCommand`: Installs dependencies
- `functions.memory`: Allocates 1GB RAM to API routes (needed for Puppeteer)
- `functions.maxDuration`: Sets 60-second timeout for API routes (for long-running audits)

### Important: Puppeteer Memory Requirements

The PDF generation requires significant memory (~1GB). If you get memory errors:

1. Disable PDF generation (recommended for MVP):
   - Already disabled in webhook - uses HTML email instead
   
2. Or increase memory allocation in `vercel.json`:
   ```json
   "functions": {
     "app/api/**": {
       "memory": 3008,
       "maxDuration": 120
     }
   }
   ```

## Testing in Production

### Test Payment Flow

1. Go to your Vercel deployment URL
2. Enter test domain and email
3. Click "Jetzt kaufen – €9,90"
4. Use Stripe test card: `4242 4242 4242 4242`
5. Verify webhook received:
   ```bash
   vercel logs --follow
   ```
6. Check email in Resend dashboard

### Test Webhook Directly

```bash
# Using Stripe CLI (recommended)
stripe listen --forward-to https://yourdomain.vercel.app/api/webhook

# Or with curl
curl -X POST https://yourdomain.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"type":"checkout.session.completed"}'
```

## Troubleshooting

### Build Fails

```bash
# Check build logs
vercel logs --follow

# Common issues:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. Dependency issues

# Solution: Test locally first
npm run build
```

### Webhook Not Triggering

1. Verify webhook secret in Stripe dashboard matches `STRIPE_WEBHOOK_SECRET`
2. Check webhook URL is correct: `https://yourdomain.vercel.app/api/webhook`
3. View webhook history in Stripe dashboard
4. Check logs: `vercel logs --follow`

### Emails Not Sending

1. Verify `RESEND_API_KEY` is correct
2. Check from address is `onboarding@resend.dev` (free tier)
3. View email logs in Resend dashboard
4. Check webhook logs: `vercel logs --follow`

### High Latency/Timeouts

1. Check audit duration in logs
2. Consider caching PageSpeed results
3. Increase `maxDuration` in `vercel.json` to 120 seconds
4. Consider upgrading Vercel plan for more resources

## Performance Optimization

### Caching Strategy

For production, consider caching audit results:
```typescript
// In /api/audit route
const cache = new Map();
const cacheKey = `audit-${domain}`;
if (cache.has(cacheKey)) return cache.get(cacheKey);
```

### Database Storage

Replace `/tmp/sessions.json` with Vercel KV:
```bash
vercel kv create localseo-sessions
```

Then update webhook route to use Vercel KV instead.

## Cost Considerations

### Free Tier Limits

- Vercel: 100GB bandwidth/month (ample)
- Stripe: Free for all features
- Resend: 100 emails/day free
- Google PageSpeed: 25,000 queries/day free

### Upgrade When

- Resend: After 100 emails/day → Pro tier (€20/month)
- Vercel: After 100GB bandwidth → Pro plan ($20/month)
- Google: After 25k queries/day → API pricing (~$5/million queries)

## Security Best Practices

✅ **Done:**
- Environment variables secured
- Webhook signature verification
- Stripe webhook secret validation
- API keys in environment, not code

✅ **Recommended:**
- Enable Vercel's "Protected Branches"
- Set up branch protection rules on GitHub
- Use signed commits
- Regular security audits
- Rotate API keys quarterly

## Monitoring

### Set Up Alerts

1. Vercel Dashboard → Settings → Alerts
2. Enable:
   - Build failures
   - Deployment errors
   - High error rate

### Check Metrics

```bash
# View analytics
vercel analytics

# View function metrics
vercel status
```

## Rolling Back

If deployment causes issues:

```bash
# View deployment history
vercel deployments

# Promote previous deployment to production
vercel promote <DEPLOYMENT_ID>
```

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Resend Docs**: https://resend.com/docs

---

**Deployment Ready!** ✅ Your LocalSEO Checker is ready for production deployment.
