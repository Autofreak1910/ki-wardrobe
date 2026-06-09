import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { items, occasion, weather, categories } = await request.json()
    const locale = request.headers.get('x-locale') || 'de'
    const isEnglish = locale === 'en'

    const itemList = items.map((item: { name?: string; category: string; color: string; brand?: string }) =>
      `- ${item.name ?? item.category} (${item.category}, ${item.color}${item.brand ? ', ' + item.brand : ''})`
    ).join('\n')

    const prompt = isEnglish
      ? `You are a fashion stylist. Create an outfit for the occasion "${occasion}" from these clothing items:

${itemList}

Weather: ${weather}

Choose 2-4 matching pieces and respond ONLY with JSON:
{
  "items": ["exact name from list above", "exact name from list above"],
  "reasoning": "brief explanation in English why this combination works"
}

Only use exact names from the list!`
      : `Du bist ein Fashion-Stylist. Erstelle ein Outfit für den Anlass "${occasion}" aus diesen Kleidungsstücken:

${itemList}

Wetter: ${weather}

Wähle 2-4 passende Teile und antworte NUR mit JSON:
{
  "items": ["exakter Name aus Liste oben", "exakter Name aus Liste oben"],
  "reasoning": "kurze Begründung auf Deutsch warum diese Kombination passt"
}

Nur exakte Namen aus der Liste verwenden!`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, ...result })

  } catch (error) {
    console.error('Outfit error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}