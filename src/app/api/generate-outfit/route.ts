import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
 const { items, occasion, weather, categories, recentItemNames } = await request.json()
    const locale = request.headers.get('x-locale') || 'de'
    const isEnglish = locale === 'en'

    const itemList = items.map((item: { name?: string; category: string; color: string; brand?: string; layer_type?: string }) => {
      const layerNote = item.layer_type === 'layer' ? ' [layer piece, worn over a base top]' : item.layer_type === 'base' ? ' [base top, worn alone or under a layer piece]' : ''
      return `- ${item.name ?? item.category} (${item.category}, ${item.color}${item.brand ? ', ' + item.brand : ''})${layerNote}`
    }).join('\n')
const hasLayerPieces = items.some((item: { layer_type?: string }) => item.layer_type === 'layer')
    const hasBasePieces = items.some((item: { layer_type?: string }) => item.layer_type === 'base')

    const varietyInstruction = recentItemNames && recentItemNames.length > 0
      ? (isEnglish
          ? `\nVariety rule: The user was recently suggested these exact item combinations: ${recentItemNames.join(' | ')}. Try to create different combinations this time using other items from the wardrobe where reasonably possible, instead of repeating the exact same picks.`
          : `\nAbwechslungs-Regel: Dem Nutzer wurden zuletzt diese exakten Kombinationen vorgeschlagen: ${recentItemNames.join(' | ')}. Versuch dieses Mal andere Kombinationen mit anderen Teilen aus dem Kleiderschrank zu erstellen, wo es sinnvoll möglich ist, statt die exakt gleichen Teile erneut zu wählen.`)
      : ''
    const layeringInstruction = hasLayerPieces && hasBasePieces
      ? (isEnglish
          ? '\nLayering rule: Items marked [layer piece] (sweaters, hoodies, cardigans) CAN be worn over an item marked [base top] (t-shirts, shirts) — but ONLY when it is cold enough to need both (roughly below 16°C / 60°F). Above that temperature, wearing a base top AND a layer piece together is uncomfortable and wrong — pick just ONE top in that case (either the layer piece alone, or a base top alone), never both. Never combine a base top and a layer piece when the weather is warm.'
          : '\nLayering-Regel: Teile mit [layer piece] (Pullover, Hoodies, Strickjacken) können ÜBER einem Teil mit [base top] (T-Shirts, Hemden) getragen werden — aber NUR wenn es kalt genug dafür ist (ungefähr unter 16°C). Bei wärmerem Wetter ist die Kombination aus Base-Top UND Layer-Piece unangenehm und falsch — wähl in diesem Fall nur EIN Oberteil (entweder nur das Layer-Piece oder nur ein Base-Top), niemals beides gleichzeitig. Kombiniere Base-Top und Layer-Piece niemals bei warmem Wetter.')
      : ''

    const outfitCount = items.length >= 6 ? 3 : items.length >= 4 ? 2 : 1

    const vibes = isEnglish
      ? ['Casual Cool', 'Minimal Chic', 'Bold Statement']
      : ['Casual Cool', 'Minimal Chic', 'Bold Statement']

  const outfitTemplate = (count: number) =>
      Array.from({ length: count }, (_, i) => `    {
      "items": ["exakter Name aus Liste", "exakter Name aus Liste"],
      "reasoning": "kurze Begründung warum das passt, erwähne die konkrete Temperatur",
      "vibe": "${vibes[i]}"
    }`).join(',\n')

    const distinctOutfitsInstruction = outfitCount > 1
      ? (isEnglish
          ? `\nIMPORTANT: The ${outfitCount} outfits must be genuinely different from each other — use different combinations of items where possible (not the same items reused for every outfit), so each outfit feels like a distinct styling option.`
          : `\nWICHTIG: Die ${outfitCount} Outfits müssen sich wirklich voneinander unterscheiden — nutze wo möglich unterschiedliche Kombinationen von Teilen (nicht dieselben Teile für jedes Outfit), damit jedes Outfit wie eine eigene Styling-Option wirkt.`)
      : ''

const prompt = isEnglish
      ? `You are a fashion stylist. Create ${outfitCount} outfit suggestion${outfitCount > 1 ? 's' : ''} for "${occasion}":

${itemList}

Weather: ${weather}
${layeringInstruction}
${varietyInstruction}
${distinctOutfitsInstruction}

Mention the exact temperature (${weather}) naturally in your reasoning text for at least one outfit.

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
${varietyInstruction}
${distinctOutfitsInstruction}

Erwähne die konkrete Temperatur (${weather}) natürlich im Begründungstext mindestens eines Outfits.

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
        temperature: 0.9,
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