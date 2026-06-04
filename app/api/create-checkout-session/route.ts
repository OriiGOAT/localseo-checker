import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import * as fs from 'fs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

interface SessionData {
  [key: string]: {
    domain: string;
    email: string;
    createdAt: string;
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

function saveSessions(sessions: SessionData): void {
  const sessionsPath = '/tmp/sessions.json';
  fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const { domain, email } = await request.json();

    if (!domain || !email) {
      return NextResponse.json(
        { error: 'Domain und Email sind erforderlich' },
        { status: 400 }
      );
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `LocalSEO Audit Report - ${domain}`,
              description: `Detaillierter SEO-Audit für ${domain}`,
            },
            unit_amount: 990, // €9.90 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      customer_email: email,
      metadata: {
        domain,
        email,
      },
    });

    // Store pending audit in /tmp/sessions.json
    const sessions = getSessions();
    sessions[session.id] = {
      domain,
      email,
      createdAt: new Date().toISOString(),
    };
    saveSessions(sessions);

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Checkout-Session' },
      { status: 500 }
    );
  }
}
