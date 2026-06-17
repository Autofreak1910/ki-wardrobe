export const maxDuration = 60

import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

webpush.setVapidDetails(
  'mailto:business@kiwardrobe.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function GET(req: Request) {
  // Sicherheits-Check: nur Vercel Cron darf das aufrufen
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')

  if (error) {
    console.error('Failed to fetch subscriptions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, sent: 0 })
  }

  let sent = 0
  let failed = 0

  for (const sub of subscriptions) {
    try {
      const payload = JSON.stringify({
        title: '☀️ Dein Outfit ist bereit!',
        body: 'Die KI hat heute schon ein Outfit für dich vorbereitet. Schau es dir an!',
        url: '/de/dresser',
      })

      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }, payload)

      sent++
    } catch (err: any) {
      failed++
      // Falls Subscription ungültig ist (z.B. User hat Notifications deaktiviert), löschen
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }
      console.error('Push failed for subscription', sub.id, err.message)
    }
  }

  return NextResponse.json({ success: true, sent, failed, total: subscriptions.length })
}