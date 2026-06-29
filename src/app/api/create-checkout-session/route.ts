export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-05-28.basil' })
   const { userId, userEmail, locale } = await request.json()
    const lang = locale || 'de'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
  success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kiwardrobe-app.vercel.app'}/${lang}/profile?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kiwardrobe-app.vercel.app'}/${lang}/profile?canceled=true`,
      customer_email: userEmail,
      metadata: { userId },
      subscription_data: { metadata: { userId } },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}