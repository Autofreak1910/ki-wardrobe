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
      max_tokens: 200,
      temperature: 0.8,
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

// Waehlt das am wenigsten benutzte Item, mit kleiner Zufallskomponente unter den am wenigsten benutzten,
// damit es nicht IMMER exakt dasselbe ist wenn mehrere gleich selten benutzt wurden.
type UsageInfo = { count: number; lastUsed: number }

function getUsageInfo(usage: Record<string, UsageInfo>, id: string): UsageInfo {
  return usage[id] ?? { count: 0, lastUsed: 0 }
}

// Waehlt deterministisch: zuerst niedrigste count, bei Gleichstand das mit dem aeltesten lastUsed (am laengsten nicht benutzt). Kein Zufall mehr.
function pickLeastUsed(pool: any[], usage: Record<string, UsageInfo>, excludeIds: Set<string>): any | null {
  const candidates = pool.filter((p: any) => !excludeIds.has(uniqueId(p)))
  const finalPool = candidates.length > 0 ? candidates : pool
  if (finalPool.length === 0) return null

  let best = finalPool[0]
  let bestInfo = getUsageInfo(usage, uniqueId(best))
  for (const item of finalPool) {
    const info = getUsageInfo(usage, uniqueId(item))
    if (info.count < bestInfo.count || (info.count === bestInfo.count && info.lastUsed < bestInfo.lastUsed)) {
      best = item
      bestInfo = info
    }
  }
  return best
}

export async function POST(request: NextRequest) {
  try {
    const { items, occasion, weather, blockedNames, usageCounts, recentCombos } = await request.json()
    const recentComboSet = new Set(Array.isArray(recentCombos) ? recentCombos : [])
    const locale = request.headers.get('x-locale') || 'de'
    const isEnglish = locale === 'en'
const usage: Record<string, UsageInfo> = usageCounts && typeof usageCounts === 'object' ? usageCounts : {}
    console.log('=== USAGE DEBUG ===')
    console.log('Received usage object:', JSON.stringify(usage))
    const blocked = new Set((Array.isArray(blockedNames) ? blockedNames : []).map(normalize))

    const grouped = groupByCategory(items)
    const tops = grouped['tops'] ?? []
    const hosen = grouped['hosen'] ?? []
    const schuhe = grouped['schuhe'] ?? []
    const jacken = grouped['jacken'] ?? []

    console.log('All schuhe with usage:', schuhe.map((s: any) => uniqueId(s) + ' -> ' + JSON.stringify(usage[uniqueId(s)] ?? 'none')))
    console.log('All jacken with usage:', jacken.map((j: any) => uniqueId(j) + ' -> ' + JSON.stringify(usage[uniqueId(j)] ?? 'none')))

    const tempMatch = String(weather).match(/(-?\d+)/)
    const tempValue = tempMatch ? parseInt(tempMatch[1]) : 18
    const isCold = tempValue < 16

    const outfitCount = items.length >= 6 ? 3 : items.length >= 4 ? 2 : 1
    const vibes = ['Casual Cool', 'Minimal Chic', 'Bold Statement']
    const outfits: { items: string[]; reasoning: string; vibe: string }[] = []

const sessionUsedTops = new Set<string>(blocked)
    const sessionUsedHosen = new Set<string>(blocked)
    const sessionUsedSchuhe = new Set<string>(blocked)
    const generatedComboKeys: string[] = []

    for (let i = 0; i < outfitCount; i++) {
      let pickedTop: any = null
      let pickedBaseTop: any = null

      if (isCold) {
        const layerPieces = tops.filter((t: any) => t.layer_type === 'layer')
        const basePieces = tops.filter((t: any) => t.layer_type === 'base')
        if (layerPieces.length > 0 && basePieces.length > 0 && Math.random() > 0.4) {
          pickedTop = pickLeastUsed(layerPieces, usage, sessionUsedTops)
          if (pickedTop) sessionUsedTops.add(uniqueId(pickedTop))
          pickedBaseTop = pickLeastUsed(basePieces, usage, sessionUsedTops)
        } else {
          pickedTop = pickLeastUsed(tops, usage, sessionUsedTops)
        }
      } else {
        pickedTop = pickLeastUsed(tops, usage, sessionUsedTops)
      }

      const pickedHose = pickLeastUsed(hosen, usage, sessionUsedHosen)
      const pickedSchuh = pickLeastUsed(schuhe, usage, sessionUsedSchuhe)
      const pickedJacke = jacken.length > 0 && Math.random() > 0.45
        ? pickLeastUsed(jacken, usage, new Set())
        : null

      if (pickedTop) sessionUsedTops.add(uniqueId(pickedTop))
      if (pickedBaseTop) sessionUsedTops.add(uniqueId(pickedBaseTop))
      if (pickedHose) sessionUsedHosen.add(uniqueId(pickedHose))
      if (pickedSchuh) sessionUsedSchuhe.add(uniqueId(pickedSchuh))

let chosenItems = [pickedTop, pickedBaseTop, pickedHose, pickedSchuh, pickedJacke].filter(Boolean)
      let comboKey = chosenItems.map((it: any) => uniqueId(it)).sort().join('+')

      // Falls diese exakte Kombination kuerzlich schon vorkam: tausche das Top gegen die naechstbeste Alternative
      if (recentComboSet.has(comboKey)) {
        const altTop = pickLeastUsed(tops.filter((t: any) => uniqueId(t) !== uniqueId(pickedTop)), usage, sessionUsedTops)
        if (altTop) {
          pickedTop = altTop
          sessionUsedTops.add(uniqueId(pickedTop))
          chosenItems = [pickedTop, pickedBaseTop, pickedHose, pickedSchuh, pickedJacke].filter(Boolean)
          comboKey = chosenItems.map((it: any) => uniqueId(it)).sort().join('+')
        }
      }

      const chosenNames = chosenItems.map((item: any) => item.name ?? item.category)
      const chosenDescriptions = chosenItems.map((item: any) =>
        (item.name ?? item.category) + ' (' + item.color + (item.brand ? ', ' + item.brand : '') + ')'
      ).join(', ')

      let prompt = ''
      if (isEnglish) {
        prompt = 'You are a fashion stylist. The user will wear exactly these items for "' + occasion + '" with vibe "' + vibes[i] + '": ' + chosenDescriptions + '. Weather: ' + weather + '. '
        prompt += 'Write a short, natural one-sentence reasoning (max 25 words) why this combination works together (colors, style, weather), naturally mentioning the temperature. Respond ONLY with JSON: {"reasoning": "your text here"}'
      } else {
        prompt = 'Du bist ein Fashion-Stylist. Der Nutzer traegt genau diese Teile fuer "' + occasion + '" mit Vibe "' + vibes[i] + '": ' + chosenDescriptions + '. Wetter: ' + weather + '. '
        prompt += 'Schreib eine kurze, natuerliche ein-Satz-Begruendung (max 25 Woerter) warum diese Kombination zusammenpasst (Farben, Stil, Wetter), erwaehne dabei natuerlich die Temperatur. Antworte NUR mit JSON: {"reasoning": "dein Text hier"}'
      }

try {
        const result = await callOpenAI(prompt)
        outfits.push({ items: chosenNames, reasoning: result.reasoning ?? '', vibe: vibes[i] })
      } catch (err) {
        console.error('Outfit ' + i + ' reasoning generation failed:', err)
        outfits.push({ items: chosenNames, reasoning: '', vibe: vibes[i] })
      }
      generatedComboKeys.push(comboKey)
    }

    if (outfits.length === 0) throw new Error('No outfits generated')

    return NextResponse.json({
      success: true,
      outfits,
      items: outfits[0]?.items ?? [],
      reasoning: outfits[0]?.reasoning ?? '',
      comboKeys: generatedComboKeys,
    })

  } catch (error) {
    console.error('Outfit error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}