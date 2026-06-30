import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json()
    const locale = req.headers.get('x-locale') || 'de'

    const prompt = locale === 'de'
      ? `Du siehst ein Foto eines Kleiderschranks oder mehrerer Kleidungsstücke. Identifiziere JEDES einzelne, klar erkennbare Kleidungsstück im Bild. Für jedes Teil gib die ungefähre Position als Bounding Box in Prozent der Bildgröße an (x, y = obere linke Ecke, width, height), sowie Kategorie (tops, hosen, jacken, schuhe, acc), Farbe, einen kurzen Namen und falls erkennbar die Marke. Ignoriere Teile die zu klein, unscharf oder verdeckt sind. Antworte NUR mit JSON: {"items": [{"x": 12, "y": 8, "width": 20, "height": 35, "category": "tops", "color": "Blau", "name": "Blaues T-Shirt", "brand": null}]}`
      : `You see a photo of a closet or multiple clothing items. Identify EVERY individual, clearly visible clothing item in the image. For each item give the approximate position as a bounding box in percent of image size (x, y = top-left corner, width, height), plus category (tops, hosen, jacken, schuhe, acc), color, a short name, and brand if visible. Ignore items that are too small, blurry, or obscured. Respond ONLY with JSON: {"items": [{"x": 12, "y": 8, "width": 20, "height": 35, "category": "tops", "color": "Blue", "name": "Blue t-shirt", "brand": null}]}`

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

    return NextResponse.json({ success: true, items: parsed.items ?? [] })
  } catch (err: any) {
    console.error('Multi-clothing analyze error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}