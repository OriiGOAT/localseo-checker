# 🚀 Deployment Checklist

## Pre-Deployment (Local)

### Code Quality
- [x] Build succeeds: `npm run build` ✅
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] All endpoints working locally
- [x] Webhook tested with Stripe CLI
- [x] Email tested with Resend

### Configuration Files
- [x] `vercel.json` created with Puppeteer config
- [x] `.env.example` created with all variables
- [x] `.env.local` has real API keys (for local testing)
- [x] `package.json` has all dependencies

### Features Complete
- [x] Free audit endpoint (`/api/audit`)
- [x] Paid checkout session endpoint (`/api/create-checkout-session`)
- [x] Webhook handler (`/api/webhook`)
- [x] PDF generation route (`/api/generate-pdf`)
- [x] Success page (`/success`)
- [x] Cancel page (`/cancel`)
- [x] Email generation and sending
- [x] Session management with `/tmp/sessions.json`

### Documentation
- [x] `DEPLOYMENT.md` - Complete deployment guide
- [x] `DEPLOY_QUICK_START.md` - Quick reference
- [x] `PAYMENT_FLOW.md` - Payment flow documentation
- [x] `SETUP.md` - General setup guide
- [x] `.env.example` - Environment variables template

---

## Deployment Steps (15 minutes)

### Step 1: Install Vercel CLI (1 min)
```bash
npm install -g vercel
```
- [ ] Completed

### Step 2: Login to Vercel (2 min)
```bash
vercel login
```
- [ ] Completed

### Step 3: Deploy (2 min)
```bash
vercel --prod
```
- [ ] Completed
- [ ] Note deployment URL: `https://__________.vercel.app`

### Step 4: Add Environment Variables (5 min)

**In Vercel Dashboard: Project → Settings → Environment Variables**

Add these 6 variables:

- [ ] `NEXT_PUBLIC_APP_URL` = `https://yourdomain.vercel.app`
- [ ] `NEXT_PUBLIC_PAGESPEED_API_KEY` = (from Google Cloud)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = (from Stripe - starts with `pk_live_`)
- [ ] `STRIPE_SECRET_KEY` = (from Stripe - starts with `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` = (from Stripe webhooks - starts with `whsec_`)
- [ ] `RESEND_API_KEY` = (from Resend - starts with `re_`)

After adding variables, redeploy:
```bash
vercel --prod --force
```
- [ ] Completed

### Step 5: Setup Stripe Webhook (3 min)

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: `https://yourdomain.vercel.app/api/webhook`
4. Select events: `checkout.session.completed`
5. Copy "Signing secret"
6. Paste into Vercel: `STRIPE_WEBHOOK_SECRET`
7. Redeploy: `vercel --prod --force`

- [ ] Webhook endpoint created
- [ ] Webhook secret added to Vercel
- [ ] Vercel redeployed

### Step 6: Test Everything (5 min)

**Test 1: Payment Flow**
```bash
1. Visit https://yourdomain.vercel.app
2. Enter domain: example.com
3. Enter email: your@email.com
4. Click "Jetzt kaufen – €9,90"
5. Use card: 4242 4242 4242 4242
6. Expiry: 12/25
7. CVC: 123
8. Complete payment
```
- [ ] Stripe checkout opens
- [ ] Payment processes
- [ ] Redirected to success page
- [ ] Session ID shown

**Test 2: Webhook Processing**
```bash
# View live logs
vercel logs --follow

# Watch for these messages:
# 🔄 Webhook: Processing audit for example.com
# 📊 Running audit...
# ✅ Audit complete - Score: XX/100
# 📧 Sending email to your@email.com...
# ✅ Email sent successfully
# 🗑️ Cleaning up session data...
# ✅ Webhook complete!
```
- [ ] Webhook received
- [ ] Audit ran successfully
- [ ] Email queued for sending

**Test 3: Email Verification**
```bash
# Check Resend dashboard
1. Go to https://resend.com/emails
2. Look for email from: onboarding@resend.dev
3. Subject: "Ihr LocalSEO Audit Report – example.com"
4. Click to view HTML email
```
- [ ] Email appears in Resend dashboard
- [ ] From address is correct
- [ ] Subject includes domain
- [ ] HTML email renders properly
- [ ] All audit details visible

**Test 4: Free Audit (Optional)**
```bash
1. Visit https://yourdomain.vercel.app
2. Enter domain: example.com (in free tier)
3. Click "Kostenlos starten"
4. Wait for results
```
- [ ] Audit runs
- [ ] Results display immediately
- [ ] Score shown correctly

---

## Post-Deployment

### Monitoring
- [ ] Setup Vercel alerts: https://vercel.com/dashboard
- [ ] Monitor logs daily first week: `vercel logs --follow`
- [ ] Check Stripe webhook deliveries weekly
- [ ] Monitor Resend email delivery

### Optimization (Optional)
- [ ] Enable Vercel Analytics
- [ ] Setup error tracking (Sentry or similar)
- [ ] Configure caching headers
- [ ] Setup CDN for faster performance

### Production Notes
- [ ] Verify HTTPS certificate (automatic on Vercel)
- [ ] Test on mobile devices
- [ ] Confirm email deliverability
- [ ] Document any custom domain setup
- [ ] Setup backup API keys

---

## Go Live Checklist

### Before Making Payment Live
- [ ] All tests pass
- [ ] Stripe webhooks working
- [ ] Emails sending successfully
- [ ] Support contact email setup
- [ ] Privacy policy updated
- [ ] Terms of service updated (if needed)

### Switch from Test to Live
1. [ ] Get Stripe live keys from https://dashboard.stripe.com
2. [ ] Update Vercel env vars with live keys
3. [ ] Redeploy: `vercel --prod --force`
4. [ ] Test one payment with live card
5. [ ] Verify funds received in Stripe
6. [ ] Announce to users

---

## Troubleshooting Reference

| Problem | Solution | Docs |
|---------|----------|------|
| Build fails | Check `vercel logs --follow` | DEPLOYMENT.md |
| Env vars not working | Redeploy after adding | DEPLOYMENT.md |
| Webhook not triggering | Verify secret matches | DEPLOYMENT.md |
| Emails not sending | Check Resend dashboard | DEPLOYMENT.md |
| Payment returns 401 | Verify Stripe keys | DEPLOYMENT.md |
| Memory errors | Increase in `vercel.json` | vercel.json |

---

## Important URLs

Save these:

| Service | URL |
|---------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Vercel Project Logs | `vercel logs --follow` |
| Stripe Dashboard | https://dashboard.stripe.com |
| Stripe Webhooks | https://dashboard.stripe.com/webhooks |
| Resend Dashboard | https://resend.com |
| Resend Emails | https://resend.com/emails |
| Google Cloud | https://console.cloud.google.com/ |

---

## Success Criteria

✅ Deployment is successful when:
1. App loads at https://yourdomain.vercel.app
2. Payment flow completes without errors
3. Webhook receives and processes events
4. Email appears in Resend dashboard
5. All audit data displays correctly
6. No errors in Vercel logs

---

## Timeline Summary

- **Day 1**: Deploy to Vercel (15 min) + test payment flow
- **Day 2**: Monitor webhook processing + verify emails
- **Day 3+**: Monitor metrics + handle support

---

**You're ready to deploy!** 🚀

Run: `vercel --prod`
