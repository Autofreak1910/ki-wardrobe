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
      max_tokens: 1000,
      temperature: 0.9,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const data = await response.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON')
  return JSON.parse(jsonMatch[0])
}

function groupByCategory(list: any[]) {
  const groups: Record<string, any[]> = {}
  for (const item of list) {
    const cat = item.category
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(item)
  }
  return groups
}

export async function POST(request: NextRequest) {
  try {
    // blockedNames = Namen von Items, die in den letzten 5 Generierungen schon verwendet wurden — diese werden HART aus der Auswahl entfernt
    const { items, occasion, weather, blockedNames } = await request.json()
    const locale = request.headers.get('x-locale') || 'de'
    const isEnglish = locale === 'en'

    const blocked: string[] = Array.isArray(blockedNames) ? blockedNames : []

    const grouped = groupByCategory(items)
    const tops = grouped['tops'] ?? []
    const hosen = grouped['hosen'] ?? []
    const schuhe = grouped['schuhe'] ?? []
    const jacken = grouped['jacken'] ?? []
    const acc = grouped['acc'] ?? []

    // Für jede Kategorie: falls genug unblockierte Items übrig sind, nutze nur die. Sonst (zu wenig Auswahl) gib alle frei, damit ueberhaupt ein Outfit entstehen kann.
  function uniqueId(item: any): string {
      return (item.name ?? item.category) + '|' + item.color
    }

    function unlockIfNeeded(pool: any[], minNeeded: number) {
      const unblocked = pool.filter((p: any) => !blocked.includes(uniqueId(p)))
      return unblocked.length >= minNeeded ? unblocked : pool
    }

    const availableTops = unlockIfNeeded(tops, 1)
    const availableHosen = unlockIfNeeded(hosen, 1)
    const availableSchuhe = unlockIfNeeded(schuhe, 1)
    const availableJacken = unlockIfNeeded(jacken, 1)
    const availableAcc = unlockIfNeeded(acc, 1)

   const usableItems = [...availableTops, ...availableHosen, ...availableSchuhe, ...availableJacken, ...availableAcc]
    console.log('Blocked names:', blocked)
    console.log('Available tops:', availableTops.map((t: any) => t.name))
    console.log('Available hosen:', availableHosen.map((h: any) => h.name))

    const itemList = usableItems.map((item: { name?: string; category: string; color: string; brand?: string; layer_type?: string }) => {
      const layerNote = item.layer_type === 'layer' ? ' [layer piece, worn over a base top]' : item.layer_type === 'base' ? ' [base top, worn alone or under a layer piece]' : ''
      return '- ' + (item.name ?? item.category) + ' (' + item.category + ', ' + item.color + (item.brand ? ', ' + item.brand : '') + ')' + layerNote
    }).join('\n')

    const hasLayerPieces = usableItems.some((item: any) => item.layer_type === 'layer')
    const hasBasePieces = usableItems.some((item: any) => item.layer_type === 'base')
   const tempMatch = String(weather).match(/(-?\d+)/)
    const tempValue = tempMatch ? parseInt(tempMatch[1]) : 18
    const isHot = tempValue >= 24

    let layeringInstruction = ''
    if (hasLayerPieces && hasBasePieces) {
      layeringInstruction = isEnglish
        ? '\nLayering rule: Items marked [layer piece] (sweaters, hoodies, cardigans) CAN be worn over an item marked [base top] (t-shirts, shirts) - but ONLY when it is cold enough to need both (roughly below 16C / 60F). Above that temperature, pick just ONE top, never both.'
        : '\nLayering-Regel: Teile mit [layer piece] (Pullover, Hoodies, Strickjacken) koennen UEBER einem Teil mit [base top] getragen werden - aber NUR wenn es kalt genug ist (unter 16C). Bei waermerem Wetter waehl nur EIN Oberteil, niemals beides.'
    }
    if (isHot && hasLayerPieces && !hasBasePieces) {
      layeringInstruction += isEnglish
        ? '\nIMPORTANT: It is hot (' + tempValue + 'C). The only available tops are heavy items like sweaters/hoodies marked [layer piece] - these are NOT ideal for this heat, but you must still pick one since no lighter top is available. In your reasoning, honestly mention that this top is warmer than ideal for the weather, and the user might want to add a lighter t-shirt to their wardrobe.'
        : '\nWICHTIG: Es ist heiss (' + tempValue + 'C). Die einzig verfuegbaren Oberteile sind schwere Teile wie Pullover/Hoodies mit [layer piece] - diese sind NICHT ideal fuer diese Hitze, aber du musst trotzdem eines waehlen da kein leichteres Top verfuegbar ist. Erwaehne in der Begruendung ehrlich, dass dieses Top waermer als ideal fuer das Wetter ist, und der Nutzer sich evtl. ein leichteres T-Shirt zulegen sollte.'
    }

    const outfitCount = usableItems.length >= 6 ? 3 : usableItems.length >= 4 ? 2 : 1
    const vibes = ['Casual Cool', 'Minimal Chic', 'Bold Statement']

    const outfitTemplate = (count: number) => {
      const lines: string[] = []
      for (let i = 0; i < count; i++) {
        lines.push('    {\n      "items": ["exact name from list", "exact name from list"],\n      "reasoning": "short reasoning, mention the temperature",\n      "vibe": "' + vibes[i] + '"\n    }')
      }
      return lines.join(',\n')
    }

    const distinctNote = outfitCount > 1
      ? (isEnglish
          ? '\nCRITICAL: The ' + outfitCount + ' outfits must each use a DIFFERENT top and DIFFERENT pants from each other - do not repeat the same top or pants across outfits. Vary the color combinations sensibly.'
          : '\nWICHTIG: Die ' + outfitCount + ' Outfits muessen jeweils ein ANDERES Oberteil und eine ANDERE Hose verwenden - wiederhol nicht das gleiche Oberteil oder die gleiche Hose ueber die Outfits hinweg. Variiere die Farbkombinationen sinnvoll.')
      : ''

    let prompt = ''
    if (isEnglish) {
      prompt = 'You are a fashion stylist with a great eye for color matching. Create ' + outfitCount + ' outfit suggestion' + (outfitCount > 1 ? 's' : '') + ' for "' + occasion + '":\n\n'
      prompt += itemList + '\n\n'
      prompt += 'Weather: ' + weather + '\n'
      prompt += layeringInstruction + distinctNote + '\n\n'
      prompt += 'Mention the exact temperature naturally in your reasoning.\n\n'
      prompt += 'Respond ONLY with JSON:\n{\n  "outfits": [\n' + outfitTemplate(outfitCount) + '\n  ]\n}\n\n'
      prompt += 'Only use exact names from the list! An outfit can include more than 2 items if layering makes sense.'
    } else {
      prompt = 'Du bist ein Fashion-Stylist mit einem guten Gefuehl fuer Farbabstimmung. Erstelle ' + outfitCount + ' Outfit-Vorschlag' + (outfitCount > 1 ? 'schlaege' : '') + ' fuer "' + occasion + '":\n\n'
      prompt += itemList + '\n\n'
      prompt += 'Wetter: ' + weather + '\n'
      prompt += layeringInstruction + distinctNote + '\n\n'
      prompt += 'Erwaehne die konkrete Temperatur natuerlich in der Begruendung.\n\n'
      prompt += 'Antworte NUR mit JSON:\n{\n  "outfits": [\n' + outfitTemplate(outfitCount) + '\n  ]\n}\n\n'
      prompt += 'Nur exakte Namen aus der Liste! Ein Outfit kann mehr als 2 Items enthalten, wenn Layering Sinn macht.'
    }

    const result = await callOpenAI(prompt)

    return NextResponse.json({
      success: true,
      outfits: result.outfits,
      items: result.outfits?.[0]?.items ?? [],
      reasoning: result.outfits?.[0]?.reasoning ?? '',
    })

  } catch (error) {
    console.error('Outfit error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}