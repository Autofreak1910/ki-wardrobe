import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json()
    const locale = req.headers.get('x-locale') || 'de'

const categoryInstruction = 'category must be exactly one of these English words: top, pants, shorts, skirt, dress, jacket, shoes, accessory. Always use the English word regardless of what language you respond in otherwise. "top" = shirts/t-shirts/sweaters/hoodies. "pants" = long pants/jeans. "shorts" = shorts/bermudas. "skirt" = skirts of any length. "dress" = dresses/jumpsuits/overalls. "jacket" = jackets/coats/blazers. "shoes" = any footwear. "accessory" = bags/belts/hats/jewelry.'

    const prompt = locale === 'de'
      ? `Du siehst ein Foto eines Kleiderschranks oder mehrerer Kleidungsstücke. Identifiziere JEDES einzelne, klar erkennbare Kleidungsstück. Gib für jedes Teil eine großzügige Bounding Box in Prozent (x, y = obere linke Ecke, width, height), Kategorie, Farbe, Namen und Marke falls erkennbar. ${categoryInstruction} Lieber etwas zu groß als zu klein. Ignoriere verdeckte oder unscharfe Teile. Antworte NUR mit JSON: {"items": [{"x": 5, "y": 8, "width": 25, "height": 60, "category": "top", "color": "Grau", "name": "Grauer Hoodie", "brand": null}]}`
      : `You see a photo of a closet or multiple clothing items. Identify EVERY clearly visible clothing item. Give a generous bounding box in percent (x, y = top-left, width, height), category, color, name and brand if visible. ${categoryInstruction} Err on the side of too large rather than too small. Ignore obscured or blurry items. Respond ONLY with JSON: {"items": [{"x": 5, "y": 8, "width": 25, "height": 60, "category": "top", "color": "Gray", "name": "Gray Hoodie", "brand": null}]}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            ],
          },
        ],
      }),
    })

 const data = await response.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const parsed = JSON.parse(jsonMatch[0])

// Die KI antwortet immer mit einem festen englischen Wort (siehe Prompt oben).
    // Hier wird das 1:1 auf unseren internen Datenbank-Kategorie-Key gemappt.
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
    const items = (parsed.items ?? []).map((item: any) => {
      if (!item.category) return item
      const normalized = String(item.category).toLowerCase().trim()
      return { ...item, category: categoryMap[normalized] ?? 'tops' }
    })

    return NextResponse.json({ success: true, items })
  } catch (err: any) {
    console.error('Multi-clothing analyze error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}