import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Stripe hat in neueren API-Versionen current_period_end vom Subscription-Objekt
// auf die einzelnen Abo-Positionen (subscription.items) verschoben. Dieser Helper
// funktioniert mit beiden Varianten.
function getPeriodEnd(subscription: Stripe.Subscription): number {
  const itemPeriodEnd = (subscription as any).items?.data?.[0]?.current_period_end
  const topLevelPeriodEnd = (subscription as any).current_period_end
  const periodEnd = itemPeriodEnd ?? topLevelPeriodEnd
  if (!periodEnd) {
    console.error('getPeriodEnd: could not find current_period_end on subscription', subscription.id)
    return Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
  }
  return periodEnd
}

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
        accessUntil: new Date(getPeriodEnd(subscription) * 1000).toISOString(),
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
      accessUntil: new Date(getPeriodEnd(updated) * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}