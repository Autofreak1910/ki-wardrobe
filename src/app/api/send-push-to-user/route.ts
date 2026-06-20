import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userId, title, body, url } = await req.json()
    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'missing params' }, { status: 400 })
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

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0 })
    }

    const payload = JSON.stringify({ title, body, url: url ?? '/de/profile' })

    let sent = 0
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        }, payload)
        sent++
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
        console.error('Push failed for subscription', sub.id, err.message)
      }
    }

    return NextResponse.json({ success: true, sent })
  } catch (error) {
    console.error('Send push to user error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}