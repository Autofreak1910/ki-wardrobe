import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json()
    const locale = request.headers.get('x-locale') || 'de'
    const isEnglish = locale === 'en'

    if (!items || items.length < 3) {
      return NextResponse.json({ success: false, error: 'Not enough items' }, { status: 400 })
    }

    const itemList = items.map((item: { name?: string; category: string; color: string; style_tags?: string[]; brand?: string }) =>
      `- ${item.name ?? item.category} | ${item.color} | ${item.category}${item.brand ? ' | ' + item.brand : ''}${item.style_tags?.length ? ' | ' + item.style_tags.join(', ') : ''}`
    ).join('\n')

    const prompt = isEnglish
      ? `You are a professional fashion stylist. Analyze this wardrobe and create a Style DNA profile.

Wardrobe (${items.length} items):
${itemList}

Respond ONLY with JSON:
{
  "styleType": "Streetwear Minimalist",
  "styleEmoji": "🖤",
  "description": "2-3 sentence description of their personal style",
  "dominantColors": ["Black", "White", "Navy"],
  "colorEmojis": ["⚫", "⚪", "🔵"],
  "stylePercentages": [
    { "style": "Streetwear", "percent": 60 },
    { "style": "Casual", "percent": 30 },
    { "style": "Minimalist", "percent": 10 }
  ],
  "strengths": ["Great color coordination", "Versatile basics"],
  "missing": ["A statement jacket", "Formal options"],
  "tip": "One actionable style tip"
}`
      : `Du bist ein professioneller Mode-Stylist. Analysiere diesen Kleiderschrank und erstelle ein Style DNA Profil.

Kleiderschrank (${items.length} Teile):
${itemList}

Antworte NUR mit JSON:
{
  "styleType": "Streetwear Minimalist",
  "styleEmoji": "🖤",
  "description": "2-3 Sätze über den persönlichen Stil",
  "dominantColors": ["Schwarz", "Weiß", "Navy"],
  "colorEmojis": ["⚫", "⚪", "🔵"],
  "stylePercentages": [
    { "style": "Streetwear", "percent": 60 },
    { "style": "Casual", "percent": 30 },
    { "style": "Minimalist", "percent": 10 }
  ],
  "strengths": ["Gute Farbkombinationen", "Vielseitige Basics"],
  "missing": ["Eine Statement-Jacke", "Formelle Optionen"],
  "tip": "Ein konkreter Style-Tipp"
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const dna = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, dna })

  } catch (error) {
    console.error('Style DNA error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}