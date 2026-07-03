import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

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

  const today = new Date().toISOString().split('T')[0]

  // Nur User mit Streak >= 2 die heute noch kein Outfit generiert haben
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, current_streak, last_outfit_date, language')
    .gte('current_streak', 2)
    .neq('last_outfit_date', today)

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ success: true, sent: 0 })
  }

  const userIds = profiles.map(p => p.id)
  const profileMap = new Map(profiles.map(p => [p.id, p]))

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', userIds)

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, sent: 0 })
  }

  let sent = 0
  let failed = 0

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

  return NextResponse.json({ success: true, sent, failed })
}