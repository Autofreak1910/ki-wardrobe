import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // --- AUTH CHECK ---
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    // --- ENDE AUTH CHECK ---

const { imageBase64, mimeType, locale: bodyLocale } = await request.json()
    const safeMimeType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType) ? mimeType : 'image/jpeg'
    const locale = request.headers.get('x-locale') || bodyLocale || 'de'

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
                  url: `data:${safeMimeType};base64,${imageBase64}`,
                  detail: 'high',
                }
              },
{
                type: 'text',
                text: `You are a fashion expert. First check: does this image show a piece of clothing, footwear, or a wearable fashion accessory (bag, belt, hat, jewelry, scarf, etc.)? Everyday objects, electronics, furniture, food, animals, people without focus on an item, or anything else that is NOT wearable fashion must be rejected.

Respond ONLY with a valid JSON object, no markdown, no backticks, no explanation.

If it IS a clothing/fashion item:
{"is_clothing":true,"category":"schuhe","name":"Nike Air Max Plus","color":"Black","style_tags":["streetwear"],"season":["spring","autumn"],"brand":"Nike","layer_type":null,"length":null}

If it is NOT a clothing/fashion item:
{"is_clothing":false,"reason":"short description of what the image actually shows"}
Rules when is_clothing is true:
- category must be exactly one of these English words: top, pants, shorts, skirt, dress, jacket, shoes, accessory
- "top" = shirts, t-shirts, blouses, sweaters, hoodies. "pants" = long pants/jeans/trousers. "shorts" = shorts/bermudas (anything ending above or at the knee). "skirt" = skirts of any length (mini, midi, maxi). "dress" = dresses, jumpsuits, overalls (one-piece garments covering both upper and lower body). "jacket" = jackets, coats, blazers. "shoes" = any footwear. "accessory" = bags, belts, hats, jewelry, scarves.
- Always respond with the English category word above for the "category" field specifically, regardless of what language everything else is in.
- name: specific product name if recognizable, otherwise short descriptive name, max 3 words. Respond in ${locale === 'de' ? 'German' : 'English'}.
- color: main color. Respond in ${locale === 'de' ? 'German (e.g. Schwarz, Weiß, Marineblau, Grau, Beige, Blau)' : 'English (e.g. Black, White, Navy, Grey, Beige, Blue)'}.
- style_tags: array from: streetwear, casual, formal, vintage, sporty, minimalist, luxury
- season: array from: spring, summer, autumn, winter
- brand: brand name if logo visible, otherwise omit
- layer_type: ONLY set this if category is "tops". Use "base" for thin items worn against the skin or alone (t-shirt, tank top, blouse, button-up shirt). Use "layer" for thicker items typically worn over a base layer (sweater, hoodie, sweatshirt, cardigan, knit). If category is not "tops", set layer_type to null.

Respond with ONLY the JSON, no explanation, no markdown.`
              }
            ]
          }
        ]
      })
    })

    const data = await response.json()
    console.log('OpenAI response:', JSON.stringify(data))

    const text = data.choices?.[0]?.message?.content ?? ''
    console.log('OpenAI text:', text)

    if (!text) {
      return NextResponse.json({ success: false, error: 'No response from OpenAI', raw: data }, { status: 500 })
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ success: false, error: 'No JSON in response', raw: text }, { status: 500 })
    }
const analysis = JSON.parse(jsonMatch[0])

    // Die KI antwortet immer mit einem festen englischen Wort (siehe Prompt oben).
    // Hier wird das 1:1 auf unseren internen Datenbank-Kategorie-Key gemappt.
    // Die Anzeige auf Deutsch/Englisch passiert dann später rein übers Frontend (catLabels).
    const categoryMap: Record<string, string> = {
      top: 'tops',
      pants: 'hosen',
      shorts: 'kurze_hosen',
      skirt: 'roecke',
      dress: 'kleider',
      jacket: 'jacken',
      shoes: 'schuhe',
      accessory: 'acc',
    }
    if (analysis.category) {
      const normalized = String(analysis.category).toLowerCase().trim()
      analysis.category = categoryMap[normalized] ?? 'tops'
    }

    if (analysis.is_clothing === false) {
      return NextResponse.json({ success: false, notClothing: true, reason: analysis.reason }, { status: 200 })
    }

    return NextResponse.json({ success: true, analysis })

  } catch (error) {
    console.error('OpenAI error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}