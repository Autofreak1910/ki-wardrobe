import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const locale = searchParams.get('locale') ?? 'de'
  const refCode = searchParams.get('ref')

  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (data?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, referred_by')
        .eq('id', data.user.id)
        .single()

      if (refCode && profile && !profile.referred_by) {
        await supabase.from('profiles').update({ referred_by: refCode }).eq('id', data.user.id)
      }

      if (profile && profile.onboarding_completed === false) {
        // WICHTIG: den ref-Code bei der Weiterleitung mitgeben, sonst geht er hier verloren
        // und die Register-Seite kann apply-referral-server nie aufrufen (Referral-Bonus faellt weg).
        const refParam = refCode ? '?ref=' + refCode : ''
        return NextResponse.redirect(origin + '/' + locale + '/auth/register' + refParam)
      }
    }
  }

  return NextResponse.redirect(origin + '/' + locale + '/dresser')
}