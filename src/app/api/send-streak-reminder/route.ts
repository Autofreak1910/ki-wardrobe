import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

function localDateStr(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  }
}

function localHour(date: Date, timezone: string): number {
  try {
    return parseInt(new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(date))
  } catch {
    return date.getUTCHours()
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  webpush.setVapidDetails(
    'mailto:business@kiwardrobe.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

const { data: profiles } = await supabase
    .from('profiles')
    .select('id, current_streak, last_outfit_date, language, timezone, is_premium, premium_until, streak_freeze_used_month')
    .gt('current_streak', 0)

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ success: true, sent: 0, reset: 0 })
  }

 const now = new Date()
  let sent = 0
  let failed = 0
  let reset = 0
  const toWarn: typeof profiles = []
  const toNotifyFreeze: typeof profiles = []

  for (const p of profiles) {
    const tz = p.timezone || 'UTC'
    const today = localDateStr(now, tz)
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = localDateStr(yesterday, tz)
    const hour = localHour(now, tz)

    if (p.last_outfit_date === today) continue // schon generiert, alles gut
if (p.last_outfit_date === yesterdayStr) {
      // Streak noch intakt, aber heute noch nicht generiert -> zwischen 19-22 Uhr lokal warnen
      if (hour >= 19 && hour < 22) toWarn.push(p)
    } else {
      // Streak ist gerissen (weder heute noch gestern generiert)
      const isPremiumActive = p.is_premium && p.premium_until && new Date(p.premium_until) > now
      const currentMonth = localDateStr(now, tz).slice(0, 7) // "2026-07"
      const freezeAlreadyUsedThisMonth = p.streak_freeze_used_month === currentMonth
if (isPremiumActive && !freezeAlreadyUsedThisMonth) {
        // Freeze einsetzen: Streak bleibt erhalten, last_outfit_date wird auf "gestern" gesetzt,
        // damit der Nutzer heute noch generieren kann ohne dass die Kette reißt
        await supabase.from('profiles').update({
          last_outfit_date: yesterdayStr,
          streak_freeze_used_month: currentMonth,
        }).eq('id', p.id)
        toNotifyFreeze.push(p)
      } else {
        await supabase.from('profiles').update({ current_streak: 0 }).eq('id', p.id)
        reset++
      }
    }
  }

  if (toWarn.length === 0) {
    return NextResponse.json({ success: true, sent: 0, failed: 0, reset })
  }

  const userIds = toWarn.map(p => p.id)
  const profileMap = new Map(toWarn.map(p => [p.id, p]))

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', userIds)

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, sent: 0, failed: 0, reset })
  }

  for (const sub of subscriptions) {
    try {
      const profile = profileMap.get(sub.user_id)
      if (!profile) continue

      const lang = profile.language === 'en' ? 'en' : 'de'
      const streak = profile.current_streak ?? 0

      const payload = JSON.stringify({
        title: lang === 'en'
          ? `🔥 Your ${streak}-day streak is at risk!`
          : `🔥 Dein ${streak}-Tage-Streak bricht gleich ab!`,
        body: lang === 'en'
          ? 'Generate your outfit now to keep your streak alive. Only a few hours left!'
          : 'Generiere jetzt dein Outfit, um deinen Streak zu retten. Nur noch wenige Stunden!',
        url: '/' + lang + '/dresser',
      })

      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }, payload)

      sent++
    } catch (err: any) {
      failed++
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }
    }
  }
if (toNotifyFreeze.length > 0) {
    const freezeUserIds = toNotifyFreeze.map(p => p.id)
    const { data: freezeSubs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', freezeUserIds)

    const freezeProfileMap = new Map(toNotifyFreeze.map(p => [p.id, p]))

    for (const sub of freezeSubs ?? []) {
      try {
        const profile = freezeProfileMap.get(sub.user_id)
        if (!profile) continue
        const lang = profile.language === 'en' ? 'en' : 'de'

        const payload = JSON.stringify({
          title: lang === 'en' ? '🧊 Streak Freeze used!' : '🧊 Streak-Schutz eingesetzt!',
          body: lang === 'en'
            ? `Your ${profile.current_streak}-day streak was saved automatically. Generate today to keep it going!`
            : `Dein ${profile.current_streak}-Tage-Streak wurde automatisch gerettet. Generier heute, damit er weiterläuft!`,
          url: '/' + lang + '/dresser',
        })

        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        }, payload)
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    }
  }

  return NextResponse.json({ success: true, sent, failed, reset, freezeUsed: toNotifyFreeze.length })
}