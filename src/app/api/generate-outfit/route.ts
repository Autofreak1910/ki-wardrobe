import { NextRequest, NextResponse } from 'next/server'

async function callOpenAI(prompt: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      temperature: 1.0,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await response.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON')
  return JSON.parse(jsonMatch[0])
}

function buildExcludeNote(usedItemsPerOutfit: string[][], isEnglish: boolean): string {
  if (usedItemsPerOutfit.length === 0) return ''
  const parts: string[] = []
  for (let idx = 0; idx < usedItemsPerOutfit.length; idx++) {
    parts.push('Outfit ' + (idx + 1) + ': ' + usedItemsPerOutfit[idx].join(', '))
  }
  const joined = parts.join(' | ')
  if (isEnglish) {
    return '\n\nSTRICT RULE - ALREADY USED in previous outfits: ' + joined + '. You MUST use a DIFFERENT top AND a DIFFERENT pants/bottom than ALL of the above outfits (not just shoes). Pick a top you have not used yet, and pants you have not used yet, from the wardrobe list. Only repeat an item if there is truly no alternative available in that category.'
  }
  return '\n\nSTRENGE REGEL - BEREITS VERWENDET in vorherigen Outfits: ' + joined + '. Du MUSST ein ANDERES Oberteil UND eine ANDERE Hose als ALLE oben genannten Outfits waehlen (nicht nur Schuhe). Waehl ein Oberteil das noch nicht verwendet wurde, und eine Hose die noch nicht verwendet wurde, aus der Kleiderschrank-Liste. Wiederhol ein Teil nur, wenn es in dieser Kategorie wirklich keine Alternative gibt.'
}

function buildRecentNote(recentItemNames: string[], isEnglish: boolean): string {
  if (!recentItemNames || recentItemNames.length === 0) return ''
  const joined = recentItemNames.join(' | ')
  if (isEnglish) {
    return '\nThe user recently saw these combinations, avoid repeating them: ' + joined
  }
  return '\nDer Nutzer hat zuletzt diese Kombinationen gesehen, vermeide Wiederholungen: ' + joined
}

export async function POST(request: NextRequest) {
  try {
    const { items, occasion, weather, categories, recentItemNames } = await request.json()
    const locale = request.headers.get('x-locale') || 'de'
    const isEnglish = locale === 'en'

    const itemList = items.map((item: { name?: string; category: string; color: string; brand?: string; layer_type?: string }) => {
      const layerNote = item.layer_type === 'layer' ? ' [layer piece, worn over a base top]' : item.layer_type === 'base' ? ' [base top, worn alone or under a layer piece]' : ''
      return '- ' + (item.name ?? item.category) + ' (' + item.category + ', ' + item.color + (item.brand ? ', ' + item.brand : '') + ')' + layerNote
    }).join('\n')

    const hasLayerPieces = items.some((item: { layer_type?: string }) => item.layer_type === 'layer')
    const hasBasePieces = items.some((item: { layer_type?: string }) => item.layer_type === 'base')
    const layeringInstruction = hasLayerPieces && hasBasePieces
      ? (isEnglish
          ? '\nLayering rule: Items marked [layer piece] (sweaters, hoodies, cardigans) CAN be worn over an item marked [base top] (t-shirts, shirts) - but ONLY when it is cold enough to need both (roughly below 16C / 60F). Above that temperature, pick just ONE top, never both.'
          : '\nLayering-Regel: Teile mit [layer piece] (Pullover, Hoodies, Strickjacken) koennen UEBER einem Teil mit [base top] getragen werden - aber NUR wenn es kalt genug ist (unter 16C). Bei waermerem Wetter waehl nur EIN Oberteil, niemals beides.')
      : ''

    const outfitCount = items.length >= 6 ? 3 : items.length >= 4 ? 2 : 1
    const vibes = ['Casual Cool', 'Minimal Chic', 'Bold Statement']

    const usedItemsPerOutfit: string[][] = []
    const outfits: { items: string[]; reasoning: string; vibe: string }[] = []

    for (let i = 0; i < outfitCount; i++) {
      const excludeNote = buildExcludeNote(usedItemsPerOutfit, isEnglish)
      const recentNote = buildRecentNote(recentItemNames, isEnglish)

      let prompt = ''
      if (isEnglish) {
        prompt = 'You are a fashion stylist. Create ONE outfit suggestion with vibe "' + vibes[i] + '" for "' + occasion + '":\n\n'
        prompt += itemList + '\n\n'
        prompt += 'Weather: ' + weather + '\n'
        prompt += layeringInstruction + excludeNote + recentNote + '\n\n'
        prompt += 'Mention the exact temperature (' + weather + ') naturally in your reasoning.\n\n'
        prompt += 'Respond ONLY with JSON:\n'
        prompt += '{\n  "items": ["exact name from list", "exact name from list"],\n  "reasoning": "short reasoning why this fits"\n}\n\n'
        prompt += 'Only use exact names from the list! Include 2-4 items depending on what makes sense (top, bottom, shoes, optionally jacket).'
      } else {
        prompt = 'Du bist ein Fashion-Stylist. Erstelle EIN Outfit mit Vibe "' + vibes[i] + '" fuer "' + occasion + '":\n\n'
        prompt += itemList + '\n\n'
        prompt += 'Wetter: ' + weather + '\n'
        prompt += layeringInstruction + excludeNote + recentNote + '\n\n'
        prompt += 'Erwaehne die konkrete Temperatur (' + weather + ') natuerlich in der Begruendung.\n\n'
        prompt += 'Antworte NUR mit JSON:\n'
        prompt += '{\n  "items": ["exakter Name aus Liste", "exakter Name aus Liste"],\n  "reasoning": "kurze Begruendung warum das passt"\n}\n\n'
        prompt += 'Nur exakte Namen aus der Liste! 2-4 Items je nachdem was sinnvoll ist (Oberteil, Hose, Schuhe, optional Jacke).'
      }

      try {
        const result = await callOpenAI(prompt)
        const outfitItems = result.items ?? []
        outfits.push({ items: outfitItems, reasoning: result.reasoning ?? '', vibe: vibes[i] })
        usedItemsPerOutfit.push(outfitItems)
      } catch (err) {
        console.error('Outfit ' + i + ' generation failed:', err)
      }
    }

    if (outfits.length === 0) throw new Error('No outfits generated')

    return NextResponse.json({
      success: true,
      outfits,
      items: outfits[0]?.items ?? [],
      reasoning: outfits[0]?.reasoning ?? '',
    })

  } catch (error) {
    console.error('Outfit error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}