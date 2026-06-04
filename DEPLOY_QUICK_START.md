# 🚀 Quick Deploy Guide

## Exact Deploy Commands

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login
```bash
vercel login
```

### 3. Deploy to Production
```bash
vercel --prod
```

Or with one command:
```bash
npm install -g vercel && vercel login && vercel --prod
```

## Environment Variables to Add

**In Vercel Dashboard: Settings → Environment Variables**

Add these 6 variables:

```
NEXT_PUBLIC_APP_URL = https://yourdomain.vercel.app
NEXT_PUBLIC_PAGESPEED_API_KEY = AIzaSy...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
STRIPE_SECRET_KEY = sk_live_...
STRIPE_WEBHOOK_SECRET = whsec_...
RESEND_API_KEY = re_...
```

## Getting Each API Key (2 minutes)

### Google PageSpeed API
1. Go to https://console.cloud.google.com/
2. Create project → Enable "PageSpeed Insights API" → Create API Key
3. Copy key

### Stripe Keys
1. Go to https://dashboard.stripe.com/apikeys
2. Copy "Publishable key" and "Secret key"

### Stripe Webhook Secret
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://yourdomain.vercel.app/api/webhook`
3. Subscribe to: `checkout.session.completed`
4. Copy signing secret

### Resend API Key
1. Go to https://resend.com/api-keys
2. Copy API key

## Timeline

- **Deploy**: 2 minutes
- **Add env vars**: 5 minutes  
- **Setup Stripe webhook**: 3 minutes
- **Test payment flow**: 5 minutes
- **Total**: ~15 minutes

## Verify Deployment Works

After deploying:

```bash
# View live logs
vercel logs --follow

# Test payment (visit your URL and click "Jetzt kaufen – €9,90")
# Then check logs for:
# ✅ Webhook received
# ✅ Audit complete
# ✅ Email sent successfully
```

## What's Included

✅ `vercel.json` - Optimization for Puppeteer (1GB RAM, 60s timeout)
✅ Environment variables documented in `.env.example`
✅ Webhook endpoint ready at `/api/webhook`
✅ All dependencies included in `package.json`
✅ Next.js optimizations built-in

## Important Notes

### Puppeteer Memory
The Puppeteer + Chromium setup requires **1GB RAM**. This is configured in `vercel.json`:
```json
"functions": {
  "app/api/**": {
    "memory": 1024,
    "maxDuration": 60
  }
}
```

If you get memory errors, either:
1. Keep PDF disabled (current: uses HTML email) ✅ **Recommended**
2. Increase memory to 3008MB in `vercel.json`

### Resend Free Tier
Emails must come from `onboarding@resend.dev` (free tier).
- Free: 100 emails/day
- Pro: Custom domain after verification (~€20/month)

### Stripe Test vs Live
Before going live:
1. Use test keys in development: `pk_test_...` and `sk_test_...`
2. Vercel deployment uses env vars
3. Switch to live keys only after testing webhook flow
4. Test payment with card `4242 4242 4242 4242`

## Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check logs: `vercel logs --follow` |
| Env vars not loaded | Redeploy after adding: `vercel --prod --force` |
| Webhook not triggering | Verify webhook secret matches Stripe |
| Emails not sending | Check Resend dashboard + verify API key |
| Timeout errors | Increase maxDuration in `vercel.json` |

## Dashboard Links

Keep these handy:
- Vercel: https://vercel.com/dashboard
- Stripe: https://dashboard.stripe.com
- Resend: https://resend.com/emails
- Google Cloud: https://console.cloud.google.com/

## After Deployment

1. ✅ Test payment flow with test card
2. ✅ Check webhook logs in Vercel
3. ✅ Verify email in Resend dashboard
4. ✅ Check audit scores in /success page
5. ✅ Switch to Stripe live keys (optional)

---

**Ready to deploy?** Run: `vercel --prod` 🚀
