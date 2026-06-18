export const maxDuration = 60

import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function parseWeatherCode(code: number, isDay: boolean): { icon: string; condition: string } {
  if (code === 0) return { icon: isDay ? '☀️' : '🌙', condition: isDay ? 'Sonnig' : 'Klar' }
  if (code <= 2)  return { icon: '⛅', condition: 'Leicht bewölkt' }
  if (code === 3) return { icon: '☁️', condition: 'Bewölkt' }
  if (code <= 49) return { icon: '🌫️', condition: 'Neblig' }
  if (code <= 59) return { icon: '🌦️', condition: 'Nieselregen' }
  if (code <= 69) return { icon: '🌧️', condition: 'Regen' }
  if (code <= 79) return { icon: '❄️', condition: 'Schnee' }
  if (code <= 82) return { icon: '🌧️', condition: 'Regenschauer' }
  if (code <= 86) return { icon: '🌨️', condition: 'Schneeschauer' }
  return { icon: '⛈️', condition: 'Gewitter' }
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

  // Pro User nur 1x verarbeiten (falls mehrere Geräte abonniert sind)
  const userIds = [...new Set(subscriptions.map(s => s.user_id))]

  let outfitsGenerated = 0
  let outfitsFailed = 0

for (const userId of userIds) {
    try {
      const { data: items, error: itemsError } = await supabase.from('clothing_items').select('*').eq('user_id', userId)
      if (itemsError) console.error('Items fetch error for', userId, itemsError)
      console.log('Items for', userId, ':', items?.length ?? 0)
      if (!items || items.length < 3) { console.log('Skipping - not enough items'); continue }

      const { data: profile } = await supabase.from('profiles').select('last_lat, last_lon').eq('id', userId).single()

      let weatherStr = '18°C'
      if (profile?.last_lat && profile?.last_lon) {
        try {
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${profile.last_lat}&longitude=${profile.last_lon}&current=temperature_2m,weathercode,is_day&timezone=auto`)
          const wd = await weatherRes.json()
          const { condition } = parseWeatherCode(wd.current.weathercode, wd.current.is_day === 1)
          weatherStr = `${Math.round(wd.current.temperature_2m)}°C, ${condition}`
        } catch {}
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Du bist ein KI-Modeberater. Antworte ausschließlich mit validem JSON, keine Erklärungen außerhalb des JSON.' },
          { role: 'user', content: `Erstelle EIN Outfit für heute aus dieser Kleidung: ${JSON.stringify(items.map((i: any) => ({ name: i.name, category: i.category, color: i.color })))}. Wetter: ${weatherStr}. Anlass: Casual/Alltag. Antworte als JSON: {"items": ["Name1", "Name2"], "reasoning": "kurze Begründung auf Deutsch", "vibe": "kurzes Stichwort"}` },
        ],
        response_format: { type: 'json_object' },
      })
const result = JSON.parse(completion.choices[0].message.content ?? '{}')
      console.log('OpenAI result for', userId, ':', JSON.stringify(result))
      if (!result.items) { console.log('Skipping - no items in result'); continue }

      const matchedItems = result.items.map((name: string) =>
        items.find((i: any) => (i.name ?? '').toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes((i.name ?? '').toLowerCase()))
      ).filter(Boolean)

  console.log('Matched items:', matchedItems.length)
      if (matchedItems.length === 0) { console.log('Skipping - no matched items'); continue }

      const { error: insertErr } = await supabase.from('daily_outfits').insert({
        user_id: userId,
        item_ids: matchedItems.map((i: any) => i.id),
        reasoning: result.reasoning ?? '',
        vibe: result.vibe ?? '',
    occasion: 'casual',
      })

      if (insertErr) { console.error('Daily outfit insert error:', insertErr); outfitsFailed++; continue }
      outfitsGenerated++
    } catch (err) {
      outfitsFailed++
      console.error('Outfit generation failed for user', userId, err)
    }
  }

// Premium-Ablauf-Status pro User vorab laden
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, is_premium, premium_until')
    .in('id', userIds)

  const profileMap = new Map((profilesData ?? []).map(p => [p.id, p]))

  let sent = 0
  let failed = 0

  for (const sub of subscriptions) {
    try {
      const profile = profileMap.get(sub.user_id)
      let payload

      if (profile?.is_premium && profile.premium_until) {
        const daysLeft = Math.ceil((new Date(profile.premium_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        if (daysLeft >= 0 && daysLeft <= 2) {
          payload = JSON.stringify({
            title: daysLeft === 0 ? '⏳ Dein Pro läuft heute ab!' : `⏳ Dein Pro läuft in ${daysLeft} Tag${daysLeft > 1 ? 'en' : ''} ab`,
            body: 'Lade Freunde ein für mehr Gratis-Zeit, oder upgrade jetzt um dranzubleiben.',
            url: '/de/profile',
          })
        }
      }

      if (!payload) {
        payload = JSON.stringify({
          title: '☀️ Dein Outfit ist bereit!',
          body: 'Die KI hat heute schon ein gratis Outfit für dich vorbereitet. Schau es dir an!',
          url: '/de/dresser',
        })
      }

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
      console.error('Push failed for subscription', sub.id, err.message)
    }
  }

  return NextResponse.json({ success: true, sent, failed, outfitsGenerated, outfitsFailed, total: subscriptions.length })
}