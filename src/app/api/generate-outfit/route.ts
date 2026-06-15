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
      ? `You are a fashion stylist. Create 3 DIFFERENT outfit suggestions for the occasion "${occasion}" from these clothing items:

${itemList}

Weather: ${weather}

Create 3 distinct combinations with different styles/moods. Respond ONLY with JSON:
{
  "outfits": [
    {
      "items": ["exact name from list", "exact name from list"],
      "reasoning": "brief explanation why this works",
      "vibe": "Casual Cool"
    },
    {
      "items": ["exact name from list", "exact name from list"],
      "reasoning": "brief explanation why this works",
      "vibe": "Minimal Chic"
    },
    {
      "items": ["exact name from list", "exact name from list"],
      "reasoning": "brief explanation why this works",
      "vibe": "Bold Statement"
    }
  ]
}

Only use exact names from the list! Each outfit must be different!`
      : `Du bist ein Fashion-Stylist. Erstelle 3 VERSCHIEDENE Outfit-Vorschläge für den Anlass "${occasion}" aus diesen Kleidungsstücken:

${itemList}

Wetter: ${weather}

Erstelle 3 verschiedene Kombinationen mit unterschiedlichen Styles. Antworte NUR mit JSON:
{
  "outfits": [
    {
      "items": ["exakter Name aus Liste", "exakter Name aus Liste"],
      "reasoning": "kurze Begründung warum das passt",
      "vibe": "Casual Cool"
    },
    {
      "items": ["exakter Name aus Liste", "exakter Name aus Liste"],
      "reasoning": "kurze Begründung warum das passt",
      "vibe": "Minimal Chic"
    },
    {
      "items": ["exakter Name aus Liste", "exakter Name aus Liste"],
      "reasoning": "kurze Begründung warum das passt",
      "vibe": "Bold Statement"
    }
  ]
}

Nur exakte Namen aus der Liste! Jedes Outfit muss anders sein!`

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

    // Backwards compatibility — erster Outfit auch als items/reasoning
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