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

    // Founder/Waitlist-Status serverseitig nachschlagen — niemals dem Client vertrauen
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_founder, signup_number')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Tier-abhängige Werte
    let trialDays = 0
    let couponId: string | undefined = undefined
    let tier = 'none'

    if (profile.is_founder) {
      trialDays = 60
      couponId = process.env.STRIPE_COUPON_FOUNDER
      tier = 'founder'
    } else if (profile.signup_number) {
      // War auf der Warteliste, aber nicht unter den ersten 75
      trialDays = 3
      couponId = process.env.STRIPE_COUPON_EARLY
      tier = 'early'
    }
    // else: signup_number ist null -> war nicht auf der Warteliste -> kein Trial, kein Coupon

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kiwardrobe-app.vercel.app'}/${lang}/profile?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kiwardrobe-app.vercel.app'}/${lang}/profile?canceled=true`,
      customer_email: userEmail,
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