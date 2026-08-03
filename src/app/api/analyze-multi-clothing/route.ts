import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json()
    const locale = req.headers.get('x-locale') || 'de'

const prompt = locale === 'de'
      ? `Du siehst ein Foto eines Kleiderschranks oder mehrerer Kleidungsstücke. Identifiziere JEDES einzelne, klar erkennbare Kleidungsstück. Gib für jedes Teil eine großzügige Bounding Box in Prozent (x, y = obere linke Ecke, width, height), Kategorie (tops, hosen, kurze_hosen, roecke, kleider, jacken, schuhe, acc), Farbe, Namen und Marke falls erkennbar. "hosen" = lange Hosen/Jeans. "kurze_hosen" = Shorts/Bermudas. "roecke" = Röcke jeder Länge. "kleider" = Kleider, Jumpsuits, Overalls. Lieber etwas zu groß als zu klein. Ignoriere verdeckte oder unscharfe Teile. Antworte NUR mit JSON: {"items": [{"x": 5, "y": 8, "width": 25, "height": 60, "category": "tops", "color": "Grau", "name": "Grauer Hoodie", "brand": null}]}`
      : `You see a photo of a closet or multiple clothing items. Identify EVERY clearly visible clothing item. Give a generous bounding box in percent (x, y = top-left, width, height), category (tops, hosen, kurze_hosen, roecke, kleider, jacken, schuhe, acc), color, name and brand if visible. "hosen" = long pants/jeans. "kurze_hosen" = shorts/bermudas. "roecke" = skirts of any length. "kleider" = dresses, jumpsuits, overalls. Err on the side of too large rather than too small. Ignore obscured or blurry items. Respond ONLY with JSON: {"items": [{"x": 5, "y": 8, "width": 25, "height": 60, "category": "tops", "color": "Gray", "name": "Gray Hoodie", "brand": null}]}`

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

    // Normalisiert die Kategorie pro erkanntem Teil -- falls die KI mal ein englisches
    // Wort oder Synonym statt unseres exakten Kategorie-Keys zurückgibt.
    const categoryAliases: Record<string, string> = {
      skirt: 'roecke', skirts: 'roecke', rock: 'roecke', röcke: 'roecke',
      dress: 'kleider', dresses: 'kleider', kleid: 'kleider',
      shorts: 'kurze_hosen', short: 'kurze_hosen', 'kurze hose': 'kurze_hosen',
      pants: 'hosen', trousers: 'hosen', jeans: 'hosen', hose: 'hosen',
      shirt: 'tops', top: 'tops', oberteil: 'tops',
      jacket: 'jacken', jacke: 'jacken',
      shoes: 'schuhe', shoe: 'schuhe',
      accessory: 'acc', accessories: 'acc',
    }
    const validKeys = ['tops', 'hosen', 'kurze_hosen', 'roecke', 'kleider', 'jacken', 'schuhe', 'acc']
    const items = (parsed.items ?? []).map((item: any) => {
      if (!item.category) return item
      const normalized = String(item.category).toLowerCase().trim()
      if (!validKeys.includes(normalized)) {
        return { ...item, category: categoryAliases[normalized] ?? 'tops' }
      }
      return item
    })

    return NextResponse.json({ success: true, items })
  } catch (err: any) {
    console.error('Multi-clothing analyze error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}