import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

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

    // Push-Notification + Mail an den Referrer schicken, falls erfolgreich
    if (data?.success) {
      try {
        const { data: referrerProfile } = await supabase
          .from('profiles')
          .select('id, language, username')
          .eq('referral_code', referralCode)
          .single()

        // Name des neu beigetretenen Nutzers holen, fuer eine persoenliche Mail statt "Jemand"
        const { data: newUserProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', userId)
          .single()
        const newUserName = newUserProfile?.username || (referrerProfile?.language === 'en' ? 'Someone' : 'Jemand')

        if (referrerProfile) {
          const lang = referrerProfile.language === 'en' ? 'en' : 'de'
          const bonusClaimed = data?.bonus_claimed ?? false
          const invitesCount = data?.invites_this_month ?? 0

          // Einlader-Popup in Supabase speichern
          await supabase.from('profiles')
            .update({
              referral_popup_pending: JSON.stringify({
                newUserName,
                bonusDays: 7,
              })
            })
            .eq('id', referrerProfile.id)

          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kiwardrobe.com'
          await fetch(baseUrl + '/api/send-push-to-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: referrerProfile.id,
              title: lang === 'en' ? '🎉 New friend joined!' : '🎉 Neuer Freund ist dabei!',
              body: (() => {
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

          // Mail an den Referrer
          try {
            const { data: { user: referrerUser } } = await supabase.auth.admin.getUserById(referrerProfile.id)
            if (referrerUser?.email) {
              await sendReferralAcceptedEmail({
                email: referrerUser.email,
                referrerName: referrerProfile.username,
                newUserName,
                language: lang,
                bonusDays: bonusClaimed ? 30 : 7,
                bonusClaimed,
                invitesCount,
              })
            }
          } catch (mailErr) {
            console.error('Referral accepted email failed:', mailErr)
          }
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

async function sendReferralAcceptedEmail({
  email, referrerName, newUserName, language, bonusDays, bonusClaimed, invitesCount,
}: {
  email: string; referrerName?: string; newUserName: string; language: string
  bonusDays: number; bonusClaimed: boolean; invitesCount: number
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const isDe = language === 'de'
  const you = referrerName || (isDe ? 'da' : 'there')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kiwardrobe.com'
  const lang = isDe ? 'de' : 'en'
  const remaining = Math.max(0, 15 - invitesCount)

  const subject = bonusClaimed
    ? (isDe ? '🎁 +30 Bonus-Tage Pro freigeschaltet!' : '🎁 +30 bonus days Pro unlocked!')
    : (isDe ? `✦ Dein Premium wurde durch ${newUserName} aktiviert` : `✦ Your Premium was activated by ${newUserName}`)

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#F7F4EC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EC; padding: 32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:20px; overflow:hidden; font-family: -apple-system, 'Poppins', sans-serif;">

          <tr>
            <td style="background: linear-gradient(135deg, #7FA98E, #355C7D); padding: 28px 32px; text-align: center;">
              <p style="margin:0 0 4px; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(255,255,255,0.85);">
                ${isDe ? 'Einladung angenommen' : 'Invite accepted'}
              </p>
              <p style="margin:0; font-size: 22px; font-weight: 800; color: #fff;">
                +${bonusDays} ${isDe ? 'Tage Pro' : 'days Pro'}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 10px; font-size: 19px; font-weight: 700; color: #1D1D20;">
                ${isDe ? `Hey ${you}, das hat geklappt! 🎉` : `Hey ${you}, it worked! 🎉`}
              </h1>
              <p style="margin: 0 0 20px; font-size: 14px; color: #8C8776; line-height: 1.6;">
                ${bonusClaimed
                  ? (isDe
                      ? `<strong>${newUserName}</strong> hat sich über deinen Einladungslink registriert — und du hast diesen Monat <strong>15 Einladungen</strong> erreicht! Dafür gibt's <strong>+30 Bonus-Tage Pro</strong> obendrauf.`
                      : `<strong>${newUserName}</strong> joined via your invite link — and you just hit <strong>15 invites</strong> this month! That earns you <strong>+30 bonus days</strong> of Pro on top.`)
                  : (isDe
                      ? `<strong>${newUserName}</strong> hat sich über deinen Einladungslink registriert. Dein Premium wurde automatisch um <strong>${bonusDays} Tage</strong> verlängert (bzw. aktiviert, falls du noch kein Pro hattest).`
                      : `<strong>${newUserName}</strong> joined via your invite link. Your Premium was automatically extended by <strong>${bonusDays} days</strong> (or activated, if you didn't have Pro yet).`)}
              </p>

              ${!bonusClaimed ? `
              <table cellpadding="0" cellspacing="0" style="width:100%; background:#F7F4EC; border-radius:14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; text-align: center;">
                    <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #355C7D;">
                      ${isDe ? `Noch ${remaining} Einladungen bis zum Bonus-Monat` : `${remaining} more invites until your bonus month`}
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #8C8776;">
                      ${isDe ? '15 Einladungen in einem Monat = +30 Tage Pro extra.' : '15 invites in one month = +30 extra days of Pro.'}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <table cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/${lang}/profile" style="display:inline-block; background: linear-gradient(135deg, #F1B951, #C98A3A); color:#24211B; font-size:14px; font-weight:700; text-decoration:none; padding:13px 28px; border-radius:12px;">
                      ${isDe ? 'Weitere Freunde einladen' : 'Invite more friends'}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #E7E2D5; text-align:center;">
              <p style="margin:0; font-size: 11px; color:#B0AA9A;">
                KiWardrobe · Luca Darvas · Bernd-Rosemeyer-Straße 14, 85551 Kirchheim bei München
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  await resend.emails.send({ from: 'KiWardrobe <noreply@kiwardrobe.com>', to: email, subject, html })
}