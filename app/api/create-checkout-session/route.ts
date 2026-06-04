import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

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

    console.log(`✅ Checkout session created: ${session.id}`);
    console.log(`📋 Domain: ${domain}, Email: ${email}`);

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
