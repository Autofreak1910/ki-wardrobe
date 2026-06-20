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

function normalize(s: string): string {
  return String(s).toLowerCase().trim().replace(/\s+/g, ' ')
}

function uniqueId(item: any): string {
  return normalize(item.name ?? item.category) + '|' + normalize(item.color)
}

export async function POST(request: NextRequest) {
  try {
    const { items, occasion, weather, blockedNames } = await request.json()
    const locale = request.headers.get('x-locale') || 'de'
    const isEnglish = locale === 'en'

    const blockedSet = new Set((Array.isArray(blockedNames) ? blockedNames : []).map(normalize))

    const grouped = groupByCategory(items)
    const tops = grouped['tops'] ?? []
    const hosen = grouped['hosen'] ?? []
    const schuhe = grouped['schuhe'] ?? []
    const jacken = grouped['jacken'] ?? []
    const acc = grouped['acc'] ?? []

    // HARTE Entfernung: blockierte Items werden komplett aus dem Pool entfernt, bevor die KI sie ueberhaupt sieht.
    // Nur falls eine Kategorie dadurch komplett leer wuerde, wird sie wieder freigegeben (sonst kein Outfit moeglich).
function filterBlocked(pool: any[]) {
      // Mindestens 1 Item muss immer uebrig bleiben, aber wir entfernen so viele blockierte wie moeglich
      const filtered = pool.filter((p: any) => !blockedSet.has(uniqueId(p)))
      if (filtered.length > 0) return filtered
      // Falls alle blockiert sind: gib nur das zuletzt NICHT verwendete (am laengsten her benutzte) frei, nicht den ganzen Pool
      return pool.length > 0 ? [pool[Math.floor(Math.random() * pool.length)]] : pool
    }

    const availableTops = filterBlocked(tops)
    const availableHosen = filterBlocked(hosen)
    const availableSchuhe = filterBlocked(schuhe)
    const availableJacken = filterBlocked(jacken)
    const availableAcc = filterBlocked(acc)

    const usableItems = [...availableTops, ...availableHosen, ...availableSchuhe, ...availableJacken, ...availableAcc]

    console.log('--- Outfit generation debug ---')
    console.log('Blocked set:', Array.from(blockedSet))
    console.log('All tops:', tops.map((t: any) => uniqueId(t)))
    console.log('Available tops after filter:', availableTops.map((t: any) => uniqueId(t)))
    console.log('All hosen:', hosen.map((h: any) => uniqueId(h)))
    console.log('Available hosen after filter:', availableHosen.map((h: any) => uniqueId(h)))

    const itemList = usableItems.map((item: { name?: string; category: string; color: string; brand?: string; layer_type?: string }) => {
      const layerNote = item.layer_type === 'layer' ? ' [layer piece, worn over a base top]' : item.layer_type === 'base' ? ' [base top, worn alone or under a layer piece]' : ''
      return '- ' + (item.name ?? item.category) + ' (' + item.category + ', ' + item.color + (item.brand ? ', ' + item.brand : '') + ')' + layerNote
    }).join('\n')

    const tempMatch = String(weather).match(/(-?\d+)/)
    const tempValue = tempMatch ? parseInt(tempMatch[1]) : 18
    const isHot = tempValue >= 24

    const hasLayerPieces = usableItems.some((item: any) => item.layer_type === 'layer')
    const hasBasePieces = usableItems.some((item: any) => item.layer_type === 'base')

    let layeringInstruction = ''
    if (hasLayerPieces && hasBasePieces) {
      layeringInstruction = isEnglish
        ? '\nLayering rule: Items marked [layer piece] CAN be worn over an item marked [base top] - but ONLY when it is cold enough (roughly below 16C). Above that, pick just ONE top, never both.'
        : '\nLayering-Regel: Teile mit [layer piece] koennen UEBER einem Teil mit [base top] getragen werden - aber NUR wenn es kalt genug ist (unter 16C). Bei waermerem Wetter waehl nur EIN Oberteil, niemals beides.'
    }
    if (isHot && hasLayerPieces && !hasBasePieces) {
      layeringInstruction += isEnglish
        ? '\nIMPORTANT: It is hot (' + tempValue + 'C) and only heavy tops [layer piece] are available. Pick one anyway, but honestly mention in your reasoning that it is warmer than ideal for this weather.'
        : '\nWICHTIG: Es ist heiss (' + tempValue + 'C) und nur schwere Oberteile [layer piece] sind verfuegbar. Waehl trotzdem eins, aber erwaehne in der Begruendung ehrlich dass es waermer als ideal fuer dieses Wetter ist.'
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
          ? '\nCRITICAL: The ' + outfitCount + ' outfits must each use a DIFFERENT top and DIFFERENT pants from each other.'
          : '\nWICHTIG: Die ' + outfitCount + ' Outfits muessen jeweils ein ANDERES Oberteil und eine ANDERE Hose verwenden.')
      : ''

    const mandatoryNote = isEnglish
      ? '\nMANDATORY: Every single outfit MUST include exactly one top, exactly one pants/bottom, AND exactly one pair of shoes from the list (if shoes are available in the list) - an outfit without shoes is incomplete and not acceptable. A jacket is optional.'
      : '\nPFLICHT: Jedes einzelne Outfit MUSS genau ein Oberteil, genau eine Hose UND genau ein Paar Schuhe aus der Liste enthalten (falls Schuhe in der Liste verfuegbar sind) - ein Outfit ohne Schuhe ist unvollstaendig und nicht akzeptabel. Eine Jacke ist optional.'

    let prompt = ''
    if (isEnglish) {
      prompt = 'You are a fashion stylist with a great eye for color matching. Create ' + outfitCount + ' outfit suggestion' + (outfitCount > 1 ? 's' : '') + ' for "' + occasion + '" using ONLY items from this list (this list already excludes recently used items):\n\n'
      prompt += itemList + '\n\n'
      prompt += 'Weather: ' + weather + '\n'
     prompt += layeringInstruction + distinctNote + mandatoryNote + '\n\n'
      prompt += 'Mention the exact temperature naturally in your reasoning.\n\n'
      prompt += 'Respond ONLY with JSON:\n{\n  "outfits": [\n' + outfitTemplate(outfitCount) + '\n  ]\n}\n\n'
      prompt += 'Only use exact names from the list above!'
    } else {
      prompt = 'Du bist ein Fashion-Stylist mit einem guten Gefuehl fuer Farbabstimmung. Erstelle ' + outfitCount + ' Outfit-Vorschlag' + (outfitCount > 1 ? 'schlaege' : '') + ' fuer "' + occasion + '" NUR mit Items aus dieser Liste (kuerzlich verwendete Items sind hier bereits ausgeschlossen):\n\n'
      prompt += itemList + '\n\n'
      prompt += 'Wetter: ' + weather + '\n'
  prompt += layeringInstruction + distinctNote + mandatoryNote + '\n\n'
      prompt += 'Erwaehne die konkrete Temperatur natuerlich in der Begruendung.\n\n'
      prompt += 'Antworte NUR mit JSON:\n{\n  "outfits": [\n' + outfitTemplate(outfitCount) + '\n  ]\n}\n\n'
      prompt += 'Nur exakte Namen aus der obigen Liste!'
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