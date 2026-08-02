import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, premium_source')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })

    // Aktives Abo suchen (auch waehrend der Trial-Phase kuendbar)
    const [activeSubs, trialingSubs] = await Promise.all([
      stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: 'active', limit: 1 }),
      stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: 'trialing', limit: 1 }),
    ])
    const subscription = activeSubs.data[0] ?? trialingSubs.data[0]

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    if (subscription.cancel_at_period_end) {
      // Bereits gekuendigt -- einfach das bestehende Enddatum zurueckgeben
      return NextResponse.json({
        success: true,
        alreadyCancelled: true,
        accessUntil: new Date(subscription.current_period_end * 1000).toISOString(),
      })
    }

    // Kuendigung zum Ende der aktuellen Abrechnungsperiode -- Zugang bleibt bis dahin
    // bestehen (keine anteilige Rueckerstattung, konsistent mit den AGB §5), aber es
    // wird garantiert NICHT mehr weiterverlaengert/abgebucht.
    const updated = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    })

    return NextResponse.json({
      success: true,
      alreadyCancelled: false,
      accessUntil: new Date(updated.current_period_end * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}