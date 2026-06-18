import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType } = await request.json()
    const safeMimeType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType) ? mimeType : 'image/jpeg'

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
text: `You are a fashion expert. Analyze this clothing item and respond ONLY with a valid JSON object, no markdown, no backticks, no explanation:
{"category":"schuhe","name":"Nike Air Max Plus","color":"Black","style_tags":["streetwear"],"season":["spring","autumn"],"brand":"Nike","layer_type":null}

Rules:
- category must be exactly one of: tops, hosen, jacken, schuhe, acc
- name: specific product name if recognizable, otherwise short descriptive name in English, max 3 words
- color: main color in English (e.g. Black, White, Navy, Grey, Beige, Blue)
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
    return NextResponse.json({ success: true, analysis })

  } catch (error) {
    console.error('OpenAI error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}