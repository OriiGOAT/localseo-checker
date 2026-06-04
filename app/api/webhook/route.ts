import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import axios from 'axios';
import * as fs from 'fs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const resend = new Resend(process.env.RESEND_API_KEY);

interface SessionData {
  [key: string]: {
    domain: string;
    email: string;
    createdAt: string;
  };
}

interface AuditResult {
  score: number;
  performanceScore: number;
  accessibilityScore: number;
  metaTagsScore: number;
  schemaMarkupScore: number;
  issues: string[];
  strengths: string[];
  actionItems: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  metadata: {
    domain: string;
    auditedAt: string;
    hasLocalBusinessSchema: boolean;
    mobileUsable: boolean;
  };
}

function getSessions(): SessionData {
  const sessionsPath = '/tmp/sessions.json';
  if (fs.existsSync(sessionsPath)) {
    const data = fs.readFileSync(sessionsPath, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}

function removeSessions(sessionId: string): void {
  const sessions = getSessions();
  delete sessions[sessionId];
  const sessionsPath = '/tmp/sessions.json';
  fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
}

async function runAudit(domain: string): Promise<AuditResult> {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/audit`,
      { domain },
      { timeout: 30000 }
    );
    return response.data;
  } catch (error) {
    console.error('Audit error:', error);
    throw error;
  }
}

function generateAuditEmailHTML(auditResult: AuditResult): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; background: #f5f5f5; }
    .container { max-width: 650px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { font-size: 16px; opacity: 0.9; }
    .content { padding: 40px 20px; }
    .score-box { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .score-box .score { font-size: 56px; font-weight: bold; }
    .score-box .label { font-size: 16px; opacity: 0.9; margin-top: 10px; }
    .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .metric { background: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #9333ea; }
    .metric .value { font-size: 24px; font-weight: bold; color: #9333ea; }
    .metric .label { font-size: 12px; color: #666; margin-top: 5px; }
    .section { margin: 25px 0; }
    .section h3 { font-size: 18px; color: #333; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #9333ea; }
    .list { list-style: none; }
    .list li { padding: 10px 0; padding-left: 25px; position: relative; color: #555; }
    .list li:before { content: "✓"; position: absolute; left: 0; color: #22c55e; font-weight: bold; font-size: 16px; }
    .issues li:before { content: "✕"; color: #ef4444; }
    .action-item { background: #f9fafb; border-left: 4px solid #f59e0b; padding: 15px; margin: 12px 0; border-radius: 4px; }
    .action-item .title { font-weight: bold; color: #333; }
    .action-item .desc { font-size: 14px; color: #666; margin-top: 5px; }
    .action-item .priority { display: inline-block; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 3px; margin-top: 8px; }
    .priority-high { background: #fee2e2; color: #991b1b; }
    .priority-medium { background: #fef3c7; color: #92400e; }
    .priority-low { background: #dbeafe; color: #0c2340; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; }
    .cta { display: inline-block; background: #9333ea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 15px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LocalSEO Checker</h1>
      <p>Ihr SEO-Audit Report</p>
    </div>

    <div class="content">
      <h2 style="color: #333; margin-bottom: 15px;">Hallo,</h2>
      <p style="margin-bottom: 15px; line-height: 1.6;">vielen Dank für Ihren Kauf! Hier ist Ihr detaillierter SEO-Audit Report für <strong>${auditResult.metadata.domain}</strong>.</p>

      <div class="score-box">
        <div class="score">${auditResult.score}/100</div>
        <div class="label">Gesamt-Score</div>
      </div>

      <div class="metrics">
        <div class="metric">
          <div class="value">${auditResult.performanceScore}</div>
          <div class="label">Performance</div>
        </div>
        <div class="metric">
          <div class="value">${auditResult.accessibilityScore}</div>
          <div class="label">Barrierefreiheit</div>
        </div>
        <div class="metric">
          <div class="value">${auditResult.metaTagsScore}</div>
          <div class="label">Meta-Tags</div>
        </div>
        <div class="metric">
          <div class="value">${auditResult.schemaMarkupScore}</div>
          <div class="label">Schema Markup</div>
        </div>
      </div>

      ${
        auditResult.strengths.length > 0
          ? `
      <div class="section">
        <h3>✅ Stärken</h3>
        <ul class="list">
          ${auditResult.strengths.map((s) => `<li>${s}</li>`).join('')}
        </ul>
      </div>
      `
          : ''
      }

      ${
        auditResult.issues.length > 0
          ? `
      <div class="section">
        <h3>⚠️ Probleme</h3>
        <ul class="list issues">
          ${auditResult.issues.map((i) => `<li>${i}</li>`).join('')}
        </ul>
      </div>
      `
          : ''
      }

      ${
        auditResult.actionItems.length > 0
          ? `
      <div class="section">
        <h3>🎯 Empfohlene Maßnahmen</h3>
        ${auditResult.actionItems
          .map(
            (item) => `
          <div class="action-item">
            <div class="title">${item.title}</div>
            <div class="desc">${item.description}</div>
            <span class="priority priority-${item.priority}">${item.priority.toUpperCase()}</span>
          </div>
        `
          )
          .join('')}
      </div>
      `
          : ''
      }

      <div class="section">
        <h3>📋 Website-Informationen</h3>
        <ul class="list" style="list-style: none; padding: 0;">
          <li style="padding: 8px 0;"><strong>Domain:</strong> ${auditResult.metadata.domain}</li>
          <li style="padding: 8px 0;"><strong>LocalBusiness Schema:</strong> ${auditResult.metadata.hasLocalBusinessSchema ? '✅ Vorhanden' : '❌ Nicht vorhanden'}</li>
          <li style="padding: 8px 0;"><strong>Mobile-freundlich:</strong> ${auditResult.metadata.mobileUsable ? '✅ Ja' : '❌ Nein'}</li>
          <li style="padding: 8px 0;"><strong>Audit-Datum:</strong> ${new Date(auditResult.metadata.auditedAt).toLocaleDateString('de-DE')}</li>
        </ul>
      </div>

      <p style="margin-top: 25px; text-align: center; color: #666;">Bei Fragen zum Report kontaktieren Sie uns gerne!</p>
    </div>

    <div class="footer">
      <p style="margin-bottom: 8px;">© 2026 LocalSEO Checker | Alle Rechte vorbehalten</p>
      <p>Diese E-Mail wurde automatisch erstellt.</p>
    </div>
  </div>
</body>
</html>
  `;
}

async function sendEmail(email: string, auditResult: AuditResult): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error('❌ RESEND_API_KEY not configured in environment');
      throw new Error('RESEND_API_KEY is not set');
    }

    console.log(`🔑 Resend API Key configured: ${apiKey.substring(0, 10)}...`);
    console.log(`📨 Preparing email for: ${email}`);

    const htmlContent = generateAuditEmailHTML(auditResult);

    const emailResponse = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: `Ihr LocalSEO Audit Report – ${auditResult.metadata.domain}`,
      html: htmlContent,
    });

    console.log(`✅ Email response from Resend:`, JSON.stringify(emailResponse, null, 2));
    console.log(`✅ Email sent successfully to ${email}`);
  } catch (error) {
    console.error('❌ Email send error:');
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Full error object:', JSON.stringify(error, null, 2));
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const body = await request.text();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const sessions = getSessions();
      const pendingSession = sessions[session.id];

      if (!pendingSession) {
        console.warn(`No pending session found for ${session.id}`);
        return NextResponse.json({ success: true });
      }

      try {
        const { domain, email } = pendingSession;

        console.log(`🔄 Webhook: Processing audit for ${domain} (${email})`);

        console.log(`📊 Running audit...`);
        const auditResult = await runAudit(domain);
        console.log(`✅ Audit complete - Score: ${auditResult.score}/100`);

        console.log(`📧 Sending email to ${email}...`);
        await sendEmail(email, auditResult);

        console.log(`🗑️ Cleaning up session data...`);
        removeSessions(session.id);

        console.log(`✅ Webhook complete! Payment processed successfully for ${domain}`);
      } catch (error) {
        console.error('❌ Error processing checkout session:');
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error name:', error.name);
          console.error('Stack trace:', error.stack);
        } else {
          console.error('Full error object:', JSON.stringify(error, null, 2));
        }
        return NextResponse.json(
          { error: 'Error processing payment', details: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
