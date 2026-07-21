export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-05-28.basil' })
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { userId, userEmail, locale } = await request.json()
    const lang = locale || 'de'

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_founder, signup_number, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Stripe-Customer wiederverwenden falls schon vorhanden, sonst neu anlegen
    let customerId = profile.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId)
    }

    let trialDays = 0
    let couponId: string | undefined = undefined
    let tier = 'none'

    if (profile.is_founder) {
      trialDays = 60
      couponId = process.env.STRIPE_COUPON_FOUNDER
      tier = 'founder'
    } else if (profile.signup_number) {
      trialDays = 3
      couponId = process.env.STRIPE_COUPON_EARLY
      tier = 'early'
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kiwardrobe-app.vercel.app'}/${lang}/profile?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kiwardrobe-app.vercel.app'}/${lang}/profile?canceled=true`,
      metadata: { userId, tier },
      subscription_data: {
        metadata: { userId, tier },
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
      },
      discounts: couponId ? [{ coupon: couponId }] : undefined,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}