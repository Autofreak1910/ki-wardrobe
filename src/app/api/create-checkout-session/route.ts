export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })
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
      .select('is_founder, signup_number, stripe_customer_id, is_premium, premium_until')
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
    let tier = 'none'

    if (profile.is_founder) {
      trialDays = 30
      tier = 'founder'
    } else if (profile.signup_number) {
      trialDays = 3
      tier = 'early'
    }

    // Falls der Nutzer aktuell noch eine kostenlose Pro-Phase hat (z.B. durch eine
    // Einladung geschenkt bekommen), darf Stripe erst NACH deren Ablauf abbuchen --
    // sonst würde sofort abgerechnet, obwohl noch gratis Pro-Zeit übrig ist.
    if (profile.is_premium && profile.premium_until) {
      const remainingMs = new Date(profile.premium_until).getTime() - Date.now()
      const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24))
      if (remainingDays > trialDays) {
        trialDays = remainingDays
        tier = tier === 'none' ? 'remaining_free_period' : tier
      }
    }
    // Stripe erlaubt max. 730 Tage Trial -- zur Sicherheit deckeln
    trialDays = Math.min(trialDays, 730)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ui_mode: 'embedded',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kiwardrobe-app.vercel.app'}/${lang}/profile?session_id={CHECKOUT_SESSION_ID}`,
      metadata: { userId, tier },
      subscription_data: {
        metadata: { userId, tier },
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
      },
    })

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}