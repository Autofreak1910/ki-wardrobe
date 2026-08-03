import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

function parseWeatherCode(code: number, isDay: boolean): { condition: string } {
  if (code === 0) return { condition: isDay ? 'Sonnig' : 'Klar' }
  if (code <= 2) return { condition: 'Leicht bewölkt' }
  if (code === 3) return { condition: 'Bewölkt' }
  if (code <= 49) return { condition: 'Neblig' }
  if (code <= 59) return { condition: 'Nieselregen' }
  if (code <= 69) return { condition: 'Regen' }
  if (code <= 79) return { condition: 'Schnee' }
  if (code <= 82) return { condition: 'Regenschauer' }
  if (code <= 86) return { condition: 'Schneeschauer' }
  return { condition: 'Gewitter' }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { data: existing, error: fetchErr } = await supabase
    .from('daily_outfits')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchErr) {
    console.error('Daily outfit fetch error:', fetchErr)
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  // Schon eins fuer heute da -- einfach zurueckgeben, kein erneutes Generieren noetig.
  if (existing) {
    const { data: items } = await supabase.from('clothing_items').select('*').in('id', existing.item_ids ?? [])
    return NextResponse.json({
      outfit: { id: existing.id, reasoning: existing.reasoning, vibe: existing.vibe, itemObjects: items ?? [] },
    })
  }

  // Kein Outfit fuer heute -- jetzt live generieren, mit allen aktuellen Kleidungsstuecken und Wetter.
  const { data: items, error: itemsError } = await supabase.from('clothing_items').select('*').eq('user_id', userId)
  if (itemsError) {
    console.error('Items fetch error:', itemsError)
    return NextResponse.json({ outfit: null })
  }
  if (!items || items.length < 3) {
    return NextResponse.json({ outfit: null })
  }

  const { data: profile } = await supabase.from('profiles').select('last_lat, last_lon, language').eq('id', userId).single()

  let weatherStr = '18°C'
  if (profile?.last_lat && profile?.last_lon) {
    try {
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${profile.last_lat}&longitude=${profile.last_lon}&current=temperature_2m,weathercode,is_day&timezone=auto`)
      const wd = await weatherRes.json()
      const { condition } = parseWeatherCode(wd.current.weathercode, wd.current.is_day === 1)
      weatherStr = `${Math.round(wd.current.temperature_2m)}°C, ${condition}`
    } catch (err) {
      console.error('Weather fetch failed for daily outfit:', err)
    }
  }

  const tempMatch = weatherStr.match(/(-?\d+)/)
  const tempValue = tempMatch ? parseInt(tempMatch[1]) : 18
  const isEnglish = profile?.language === 'en'

  let weatherRule = ''
  if (isEnglish) {
    if (tempValue >= 25) weatherRule = 'It is HOT (over 25°C). Choose NO jacket and no warm layers. Light, airy clothing.'
    else if (tempValue >= 20) weatherRule = 'It is warm (20-24°C). Usually NO jacket needed, at most a very light one.'
    else if (tempValue >= 16) weatherRule = 'It is mild (16-19°C). A light jacket is optional.'
    else if (tempValue >= 8) weatherRule = 'It is cool (8-15°C). A jacket is recommended.'
    else weatherRule = 'It is COLD (under 8°C). A warm jacket and possibly multiple layers are important.'
  } else {
    if (tempValue >= 25) weatherRule = 'Es ist HEISS (über 25°C). Wähle KEINE Jacke und keine warmen Schichten. Leichte, luftige Kleidung.'
    else if (tempValue >= 20) weatherRule = 'Es ist warm (20-24°C). Normalerweise KEINE Jacke nötig, höchstens eine sehr leichte.'
    else if (tempValue >= 16) weatherRule = 'Es ist mild (16-19°C). Eine leichte Jacke ist optional.'
    else if (tempValue >= 8) weatherRule = 'Es ist kühl (8-15°C). Eine Jacke wird empfohlen.'
    else weatherRule = 'Es ist KALT (unter 8°C). Eine warme Jacke und ggf. mehrere Schichten sind wichtig.'
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const itemsForPrompt = items.map((i: any) => ({ name: i.name, category: i.category, color: i.color }))

    const prompt = isEnglish
      ? `Create ONE outfit for today from this clothing: ${JSON.stringify(itemsForPrompt)}.\n\nWEATHER: ${weatherStr}.\nIMPORTANT WEATHER RULE: ${weatherRule}\n\nA complete outfit has a top, bottom (pants/shorts/skirt) or a dress instead, and shoes. A jacket ONLY if the temperature requires it. Occasion: casual/everyday.\n\nRespond as JSON: {"items": ["Name1", "Name2", "Name3"], "reasoning": "short reasoning in English mentioning the temperature", "vibe": "short keyword"}`
      : `Erstelle EIN Outfit für heute aus dieser Kleidung: ${JSON.stringify(itemsForPrompt)}.\n\nWETTER: ${weatherStr}.\nWICHTIGE WETTER-REGEL: ${weatherRule}\n\nEin vollständiges Outfit hat ein Oberteil, ein Unterteil (Hose/kurze Hose/Rock) oder stattdessen ein Kleid, und Schuhe. Eine Jacke NUR wenn es die Temperatur erfordert. Anlass: Casual/Alltag.\n\nAntworte als JSON: {"items": ["Name1", "Name2", "Name3"], "reasoning": "kurze Begründung auf Deutsch die die Temperatur erwähnt", "vibe": "kurzes Stichwort"}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: isEnglish ? 'You are an AI fashion advisor. You ALWAYS consider the weather and temperature when choosing an outfit. Respond only with valid JSON, no explanations outside the JSON.' : 'Du bist ein KI-Modeberater. Du beachtest IMMER das Wetter und die Temperatur bei der Outfit-Wahl. Antworte ausschließlich mit validem JSON, keine Erklärungen außerhalb des JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content ?? '{}')
    if (!result.items) return NextResponse.json({ outfit: null })

    const matchedItems = result.items
      .map((name: string) => items.find((i: any) => (i.name ?? '').toLowerCase().includes(String(name).toLowerCase()) || String(name).toLowerCase().includes((i.name ?? '').toLowerCase())))
      .filter(Boolean)

    if (matchedItems.length === 0) return NextResponse.json({ outfit: null })

    const { data: inserted, error: insertErr } = await supabase.from('daily_outfits').insert({
      user_id: userId,
      item_ids: matchedItems.map((i: any) => i.id),
      reasoning: result.reasoning ?? '',
      vibe: result.vibe ?? '',
      occasion: 'casual',
    }).select().single()

    if (insertErr) {
      console.error('Daily outfit insert error:', insertErr)
      return NextResponse.json({ outfit: null })
    }

    return NextResponse.json({
      outfit: { id: inserted.id, reasoning: inserted.reasoning, vibe: inserted.vibe, itemObjects: matchedItems },
    })
  } catch (err) {
    console.error('Live daily outfit generation failed:', err)
    return NextResponse.json({ outfit: null })
  }
}