import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
  const { items, occasion, weather, categories } = await request.json()
    const locale = request.headers.get('x-locale') || 'de'
    const isEnglish = locale === 'en'

    const itemList = items.map((item: { name?: string; category: string; color: string; brand?: string; layer_type?: string }) => {
      const layerNote = item.layer_type === 'layer' ? ' [layer piece, worn over a base top]' : item.layer_type === 'base' ? ' [base top, worn alone or under a layer piece]' : ''
      return `- ${item.name ?? item.category} (${item.category}, ${item.color}${item.brand ? ', ' + item.brand : ''})${layerNote}`
    }).join('\n')

    const hasLayerPieces = items.some((item: { layer_type?: string }) => item.layer_type === 'layer')
    const hasBasePieces = items.some((item: { layer_type?: string }) => item.layer_type === 'base')
    const layeringInstruction = hasLayerPieces && hasBasePieces
      ? (isEnglish
          ? '\nLayering rule: Items marked [layer piece] (sweaters, hoodies, cardigans) look best worn OVER an item marked [base top] (t-shirts, shirts). When you pick a layer piece for an outfit, also include a matching base top underneath it as a separate item, unless weather/occasion clearly calls for the layer piece alone.'
          : '\nLayering-Regel: Teile mit [layer piece] (Pullover, Hoodies, Strickjacken) sehen am besten ÜBER einem Teil mit [base top] (T-Shirts, Hemden) aus. Wenn du ein Layer-Piece für ein Outfit wählst, füge zusätzlich ein passendes Base-Top darunter als separates Item hinzu, außer Wetter/Anlass sprechen klar für das Layer-Piece allein.')
      : ''

    const outfitCount = items.length >= 6 ? 3 : items.length >= 4 ? 2 : 1

    const vibes = isEnglish
      ? ['Casual Cool', 'Minimal Chic', 'Bold Statement']
      : ['Casual Cool', 'Minimal Chic', 'Bold Statement']

    const outfitTemplate = (count: number) =>
      Array.from({ length: count }, (_, i) => `    {
      "items": ["exakter Name aus Liste", "exakter Name aus Liste"],
      "reasoning": "kurze Begründung warum das passt",
      "vibe": "${vibes[i]}"
    }`).join(',\n')

const prompt = isEnglish
      ? `You are a fashion stylist. Create ${outfitCount} outfit suggestion${outfitCount > 1 ? 's' : ''} for "${occasion}":

${itemList}

Weather: ${weather}
${layeringInstruction}

Respond ONLY with JSON:
{
  "outfits": [
${outfitTemplate(outfitCount)}
  ]
}

Only use exact names from the list! An outfit can include more than 2 items if layering makes sense.`
      : `Du bist ein Fashion-Stylist. Erstelle ${outfitCount} Outfit-Vorschlag${outfitCount > 1 ? 'schläge' : ''} für "${occasion}":

${itemList}

Wetter: ${weather}
${layeringInstruction}

Antworte NUR mit JSON:
{
  "outfits": [
${outfitTemplate(outfitCount)}
  ]
}

Nur exakte Namen aus der Liste! Ein Outfit kann mehr als 2 Items enthalten, wenn Layering Sinn macht.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const result = JSON.parse(jsonMatch[0])

    const first = result.outfits?.[0]
    return NextResponse.json({
      success: true,
      outfits: result.outfits,
      items: first?.items ?? [],
      reasoning: first?.reasoning ?? '',
    })

  } catch (error) {
    console.error('Outfit error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}