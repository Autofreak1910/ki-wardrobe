import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType } = await request.json()
    const locale = request.headers.get('x-locale') || 'de'
    const isEnglish = locale === 'en'

    const prompt = isEnglish
      ? `You are a fashion expert. Analyze this clothing item and respond ONLY with a valid JSON object:
{"category":"schuhe","name":"Nike Air Max Plus","color":"Black","style_tags":["streetwear"],"season":["spring","autumn"],"brand":"Nike"}

Rules:
- category: exactly one of: tops, hosen, jacken, schuhe, acc
- name: specific product name if recognizable, otherwise short English name max 3 words
- color: in English (Black, White, Navy, Grey, Beige, Blue, Green, Red)
- style_tags: from: streetwear, casual, formal, vintage, sporty, minimalist, luxury
- season: from: spring, summer, autumn, winter
- brand: if logo visible, otherwise omit
Respond with ONLY the JSON.`
      : `Du bist ein Fashion-Experte. Analysiere dieses Kleidungsstück und antworte NUR mit einem JSON-Objekt:
{"category":"schuhe","name":"Nike Air Max Plus","color":"Schwarz","style_tags":["streetwear"],"season":["frühling","herbst"],"brand":"Nike"}

Regeln:
- category: genau eines von: tops, hosen, jacken, schuhe, acc
- name: spezifischer Produktname falls erkennbar, sonst kurzer deutscher Name max 3 Wörter
- color: auf Deutsch (Schwarz, Weiß, Navy, Grau, Beige, Blau, Grün, Rot)
- style_tags: aus: streetwear, casual, formal, vintage, sportlich, minimalistisch, luxury
- season: aus: frühling, sommer, herbst, winter
- brand: falls Logo sichtbar, sonst weglassen
Nur JSON antworten.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: 'high',
                }
              },
              { type: 'text', text: prompt }
            ]
          }
        ]
      })
    })

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ success: false, error: 'No JSON in response', raw: text }, { status: 500 })
    }
    const analysis = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, analysis })

  } catch (error) {
    console.error('OpenAI error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}