import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId, referralCode } = await request.json()
    if (!userId || !referralCode) {
      return NextResponse.json({ success: false, error: 'missing params' })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

 const { data, error } = await supabase.rpc('apply_referral', {
      p_new_user_id: userId,
      p_referral_code: referralCode,
    })

    console.log('apply_referral result:', data, 'error:', error)

    // Push-Notification an den Referrer schicken, falls erfolgreich
    if (data?.success) {
      try {
        const { data: referrerProfile } = await supabase
          .from('profiles')
          .select('id, language')
          .eq('referral_code', referralCode)
          .single()

        if (referrerProfile) {
          const lang = referrerProfile.language === 'en' ? 'en' : 'de'
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kiwardrobe-app.vercel.app'
          await fetch(baseUrl + '/api/send-push-to-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
              userId: referrerProfile.id,
              title: lang === 'en' ? '🎉 New friend joined!' : '🎉 Neuer Freund ist dabei!',
              body: (() => {
                const invitesCount = data?.invites_this_month ?? 0
                const bonusClaimed = data?.bonus_claimed ?? false
                if (lang === 'en') {
                  if (bonusClaimed) return 'Someone joined via your link — and you just hit 15 invites this month, +30 BONUS days Pro! Check your profile.'
                 if (invitesCount <= 4) return 'Someone joined via your invite link — you got +7 days Pro! ' + Math.max(0, 15 - invitesCount) + ' more invites until your bonus month.'
                  return 'Someone joined via your invite link! Only ' + Math.max(0, 15 - invitesCount) + ' more invites this month until your bonus month.'
                }
                if (bonusClaimed) return 'Jemand hat sich über deinen Link registriert — und du hast diesen Monat 15 Einladungen erreicht: +30 BONUS-Tage Pro! Schau in dein Profil.'
                if (invitesCount <= 4) return 'Jemand hat sich über deinen Einladungslink registriert — du hast +7 Tage Pro bekommen! Noch ' + Math.max(0, 15 - invitesCount) + ' Einladungen bis zum Bonus-Monat.'
                return 'Jemand hat sich über deinen Einladungslink registriert! Nur noch ' + Math.max(0, 15 - invitesCount) + ' Einladungen diesen Monat bis zum Bonus-Monat.'
              })(),
          url: '/' + lang + '/dresser?referral_reward=true',
            }),
          })
        }
      } catch (pushErr) {
        console.error('Referral push notification failed:', pushErr)
      }
    }

    return NextResponse.json({ success: data?.success ?? false, data, error: error?.message })
  } catch (err) {
    console.error('apply_referral_server error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}