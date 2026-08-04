import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

type UsageInfo = { count: number; lastUsed: number }

function getUsageInfo(usage: Record<string, any>, id: string): UsageInfo {
  const normalizedId = normalize(id)
  for (const key of Object.keys(usage)) {
    if (normalize(key) === normalizedId) {
      const val = usage[key]
      if (typeof val === 'number') return { count: val, lastUsed: 0 }
      if (val && typeof val === 'object') return { count: Number(val.count) || 0, lastUsed: Number(val.lastUsed) || 0 }
    }
  }
  return { count: 0, lastUsed: 0 }
}

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

// --- Farb-Kompatibilitaet ---
function normalizeColor(c: string): string {
  return String(c || '').toLowerCase().trim()
}

const NEUTRAL_COLORS = ['schwarz', 'black', 'weiss', 'weiß', 'white', 'grau', 'grey', 'gray', 'beige', 'navy', 'marine', 'creme', 'cream', 'anthrazit', 'anthracite', 'denim', 'jeansblau']

const COLOR_FAMILIES: Record<string, string[]> = {
  red: ['rot', 'red', 'bordeaux', 'weinrot', 'kirschrot'],
  pink: ['pink', 'rosa', 'magenta', 'fuchsia'],
  orange: ['orange', 'terracotta', 'rostorange'],
  yellow: ['gelb', 'yellow', 'senf', 'mustard'],
  green: ['gruen', 'grün', 'green', 'olive', 'oliv', 'khaki', 'mint', 'salbei'],
  blue: ['blau', 'blue', 'hellblau', 'dunkelblau', 'tuerkis', 'türkis', 'teal', 'cyan', 'petrol'],
  purple: ['lila', 'violett', 'purple', 'lavendel', 'lavender'],
  brown: ['braun', 'brown', 'camel', 'tan', 'cognac', 'karamell'],
}

// Farbkombis die typischerweise nicht gut zusammenpassen (grelle Kontraste)
const COLOR_CLASHES: Record<string, string[]> = {
  red: ['pink', 'orange'],
  pink: ['red', 'orange', 'yellow'],
  orange: ['red', 'pink', 'purple'],
  green: ['pink'],
  purple: ['orange', 'yellow'],
}

function getColorFamily(color: string): string | null {
  const c = normalizeColor(color)
  for (const [family, keywords] of Object.entries(COLOR_FAMILIES)) {
    if (keywords.some(k => c.includes(k))) return family
  }
  return null
}

function isNeutralColor(color: string): boolean {
  const c = normalizeColor(color)
  return NEUTRAL_COLORS.some(n => c.includes(n))
}

// 2 = passt gut (Neutral oder gleiche Farbfamilie), 1 = neutral/unbekannt, 0 = clash
function colorCompatibilityScore(a: string, b: string): number {
  if (isNeutralColor(a) || isNeutralColor(b)) return 2
  const famA = getColorFamily(a)
  const famB = getColorFamily(b)
  if (!famA || !famB) return 1
  if (famA === famB) return 2
  if (COLOR_CLASHES[famA]?.includes(famB) || COLOR_CLASHES[famB]?.includes(famA)) return 0
  return 1
}

// Waehlt aus dem Pool das am wenigsten genutzte Item, bevorzugt aber Farben die zu den
// bereits gewaehlten Teilen passen. Faellt zurueck auf normale pickLeastUsed-Logik wenn
// keine Referenzfarben vorhanden sind.
function pickColorAware(pool: any[], usage: Record<string, UsageInfo>, excludeIds: Set<string>, referenceColors: string[]): any | null {
  const refs = referenceColors.filter(Boolean)
  if (refs.length === 0) return pickLeastUsed(pool, usage, excludeIds)

  const candidates = pool.filter((p: any) => !excludeIds.has(uniqueId(p)))
  const finalPool = candidates.length > 0 ? candidates : pool
  if (finalPool.length === 0) return null

  let best: any = null
  let bestScore = -1
  let bestInfo: UsageInfo = { count: Infinity, lastUsed: Infinity }
  for (const item of finalPool) {
    const score = Math.min(...refs.map(rc => colorCompatibilityScore(item.color, rc)))
    const info = getUsageInfo(usage, uniqueId(item))
    const better = score > bestScore || (score === bestScore && (info.count < bestInfo.count || (info.count === bestInfo.count && info.lastUsed < bestInfo.lastUsed)))
    if (better) {
      best = item
      bestScore = score
      bestInfo = info
    }
  }
  return best
}

// Einheitliche Temperatur-Stufen fuer die ganze Outfit-Logik (Tops-Layering, Unterteile, Roecke/Kleider-Laenge)
function getWeatherTier(tempValue: number): 'freezing' | 'cool' | 'mild' | 'warm' {
  if (tempValue < 12) return 'freezing'
  if (tempValue < 18) return 'cool'
  if (tempValue < 24) return 'mild'
  return 'warm'
}

// Erkennt warme Oberteile (Pulli, Hoodie etc.) auch bei Altbestand ohne layer_type,
// indem zusaetzlich der Name geprueft wird.
function isLayerTop(t: any): boolean {
  if (t.layer_type === 'layer') return true
  if (t.layer_type === 'base') return false
  const n = normalize(t.name ?? '')
  return ['sweatshirt', 'sweater', 'hoodie', 'pullover', 'pulli', 'cardigan', 'strick', 'knit', 'longsleeve', 'fleece', 'zip'].some(k => n.includes(k))
}

// Eindeutig leichtes Teil, das als Unterschicht unter einem Pulli Sinn ergibt.
// Whitelist statt Blacklist: unbekannte Teile (Altbestand ohne layer_type, Name nicht
// erkennbar) werden NICHT als Unterschicht verwendet -- verhindert Pulli-unter-Pulli.
function isDefinitelyBaseTop(t: any): boolean {
  if (isLayerTop(t)) return false
  if (t.layer_type === 'base') return true
  const n = normalize(t.name ?? '')
  return ['t-shirt', 'tshirt', 't shirt', 'shirt', 'top', 'tank', 'hemd', 'bluse', 'blouse', 'polo'].some(k => n.includes(k))
}

// Bevorzugt bei Roecken/Kleidern (die eine "length" haben) je nach Temperatur eine passende Laenge.
// Items ohne "length" (z.B. Hosen) bleiben immer im Pool -- die Funktion filtert nur die Rock/Kleid-Optionen.
function filterByLengthPreference(pool: any[], tempValue: number, useWeather: boolean): any[] {
  if (!useWeather) return pool

  const withoutLength = pool.filter((p: any) => !p.length)
  const withLength = pool.filter((p: any) => p.length)
  if (withLength.length === 0) return pool

  const tier = getWeatherTier(tempValue)
  let preferred: string[]
  if (tier === 'freezing') {
    preferred = ['lang']
  } else if (tier === 'cool') {
    preferred = ['lang', 'midi']
  } else if (tier === 'mild') {
    preferred = ['midi', 'kurz', 'lang']
  } else {
    preferred = ['kurz', 'midi']
  }

  const matching = withLength.filter((p: any) => preferred.includes(p.length))
  return [...withoutLength, ...(matching.length > 0 ? matching : withLength)]
}

// Filtert den "Unterteil"-Pool (Hosen, kurze Hosen, Roecke) nach Wetter:
// Kurze Hosen werden bei Kaelte aussortiert (nur falls Alternativen vorhanden sind),
// danach greift zusaetzlich die Laenge-Praeferenz fuer Roecke.
function filterBottomsByWeather(pool: any[], tempValue: number, useWeather: boolean): any[] {
  if (!useWeather) return pool
  const tier = getWeatherTier(tempValue)

  if (tier === 'freezing' || tier === 'cool') {
    // Bei Kaelte: kurze Hosen raus UND Roecke, die nicht sicher warm genug sind.
    // Ein Rock mit UNBEKANNTER Laenge zaehlt als riskant und fliegt ebenfalls raus.
    const warmEnough = pool.filter((p: any) => {
      if (p.category === 'kurze_hosen') return false
      if (p.category === 'roecke') {
        if (tier === 'freezing') return p.length === 'lang'
        return p.length === 'lang' || p.length === 'midi'
      }
      return true // Hosen sind immer ok
    })
    if (warmEnough.length > 0) return warmEnough
    // Notfall: nichts Warmes im Schrank -> wenigstens kurze Hosen vermeiden
    const withoutShorts = pool.filter((p: any) => p.category !== 'kurze_hosen')
    return withoutShorts.length > 0 ? withoutShorts : pool
  }

  return filterByLengthPreference(pool, tempValue, useWeather)
}
export async function POST(request: NextRequest) {
  try {
    // --- AUTH CHECK ---
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    // --- ENDE AUTH CHECK ---

    const { items, occasion, weather, blockedNames, usageCounts, recentCombos, activeCategories, weatherAware } = await request.json()
    const recentComboSet = new Set(Array.isArray(recentCombos) ? recentCombos : [])
    const wantsJacket = Array.isArray(activeCategories) ? activeCategories.includes('jacken') : true
    const useWeather = weatherAware !== false
    const locale = request.headers.get('x-locale') || 'de'
    const isEnglish = locale === 'en'
    const usage: Record<string, UsageInfo> = usageCounts && typeof usageCounts === 'object' ? usageCounts : {}
    console.log('=== USAGE DEBUG ===')
    console.log('Received usage object:', JSON.stringify(usage))
    const blocked = new Set((Array.isArray(blockedNames) ? blockedNames : []).map(normalize))

const grouped = groupByCategory(items)
    const tops = grouped['tops'] ?? []
    const hosen = grouped['hosen'] ?? []
    const kurzeHosen = grouped['kurze_hosen'] ?? []
    const roecke = grouped['roecke'] ?? []
    const kleider = grouped['kleider'] ?? []
    // Hosen, kurze Hosen und Roecke sind alle gleichwertige "Unterteil"-Optionen
    const bottoms = [...hosen, ...kurzeHosen, ...roecke]
    const schuhe = grouped['schuhe'] ?? []
    const jacken = grouped['jacken'] ?? []
    console.log('All schuhe with usage:', schuhe.map((s: any) => uniqueId(s) + ' -> ' + JSON.stringify(getUsageInfo(usage, uniqueId(s)))))
    console.log('All hosen with usage:', hosen.map((h: any) => uniqueId(h) + ' -> ' + JSON.stringify(getUsageInfo(usage, uniqueId(h)))))

  const tempMatch = String(weather).match(/(-?\d+)/)
    const tempValue = tempMatch ? parseInt(tempMatch[1]) : 18

    const outfitCount = 1
    const vibes = ['']
    const outfits: { items: string[]; reasoning: string; vibe: string }[] = []

    const sessionUsedTops = new Set<string>(blocked)
    const sessionUsedHosen = new Set<string>(blocked)
    const sessionUsedSchuhe = new Set<string>(blocked)
    const generatedComboKeys: string[] = []

    for (let i = 0; i < outfitCount; i++) {
      let pickedTop: any = null
      let pickedBaseTop: any = null

const weatherTier = getWeatherTier(tempValue)
      const preferLayerTop = useWeather && (weatherTier === 'freezing' || weatherTier === 'cool')
      const jacketWillBeAdded = jacken.length > 0 && wantsJacket && useWeather && (weatherTier === 'freezing' || weatherTier === 'cool')

if (preferLayerTop) {
        const layerPieces = tops.filter((t: any) => isLayerTop(t))
        const basePieces = tops.filter((t: any) => isDefinitelyBaseTop(t))

        if (layerPieces.length > 0) {
          // Bei Kaelte kommt das warme Teil (Pulli/Hoodie) IMMER als Haupttop -- kein Zufall.
          pickedTop = pickLeastUsed(layerPieces, usage, sessionUsedTops)
          if (pickedTop) sessionUsedTops.add(uniqueId(pickedTop))
          // Base-Layer (T-Shirt) drunter: bei Frost ohne Jacke immer, sonst je nach Chance
          const baseChance = weatherTier === 'freezing' ? (jacketWillBeAdded ? 0.8 : 1.0) : 0.5
          if (basePieces.length > 0 && Math.random() < baseChance) {
            pickedBaseTop = pickLeastUsed(basePieces, usage, sessionUsedTops)
          }
        } else {
          // Kein einziger Pulli im Schrank -> Notfall: normales Top (Jacke muss die Waerme uebernehmen)
          pickedTop = pickLeastUsed(tops, usage, sessionUsedTops)
        }
} else if (useWeather && weatherTier === 'warm') {
        // Bei Hitze: NUR eindeutig leichte Tops erlauben. Unbekannte Tops (kein layer_type,
        // Name nicht erkennbar) werden sicherheitshalber ausgeschlossen.
        const definitelyLight = tops.filter((t: any) => isDefinitelyBaseTop(t))
        pickedTop = pickLeastUsed(definitelyLight.length > 0 ? definitelyLight : tops, usage, sessionUsedTops)
      } else if (useWeather && weatherTier === 'mild') {
        // Bei mildem Wetter: leichte Tops stark bevorzugen, Pulli nur mit 20% Chance
        const lightTops = tops.filter((t: any) => !isLayerTop(t))
        const heavyTops = tops.filter((t: any) => isLayerTop(t))
        if (lightTops.length > 0 && (heavyTops.length === 0 || Math.random() > 0.2)) {
          pickedTop = pickLeastUsed(lightTops, usage, sessionUsedTops)
        } else {
          pickedTop = pickLeastUsed(tops, usage, sessionUsedTops)
        }
      } else {
        pickedTop = pickLeastUsed(tops, usage, sessionUsedTops)
      }
// Bei vorhandenen Kleidern manchmal ein Kleid statt Top+Unterteil waehlen. Chance haengt
      // vom Wetter ab -- bei Kaelte deutlich seltener, da ein Kleid allein meist nicht warm genug ist.
   let dressChance = 0.35
      if (useWeather) {
        if (weatherTier === 'freezing') {
          // Ohne Jacke traegt bei Frost niemand nur ein Kleid -> gar nicht erst versuchen
          dressChance = jacketWillBeAdded ? 0.08 : 0
        } else if (weatherTier === 'cool') {
          dressChance = jacketWillBeAdded ? 0.20 : 0.10
        }
      }
 const useDress = kleider.length > 0 && Math.random() < dressChance
      let pickedDress: any = null
      if (useDress) {
        let dressPool = filterByLengthPreference(kleider, tempValue, useWeather)
        if (useWeather && (weatherTier === 'freezing' || weatherTier === 'cool')) {
          // Bei Kaelte nur Kleider mit sicher warmer Laenge -- unbekannte Laenge zaehlt als riskant.
          // Ist keins da, gibt es schlicht kein Kleid (Top+Hose uebernehmen).
          dressPool = dressPool.filter((d: any) =>
            weatherTier === 'freezing' ? d.length === 'lang' : (d.length === 'lang' || d.length === 'midi')
          )
        }
        pickedDress = dressPool.length > 0 ? pickLeastUsed(dressPool, usage, sessionUsedTops) : null
        if (pickedDress) { pickedTop = null; pickedBaseTop = null }
      }

      // Referenzfarbe fuer die restlichen Teile: Top+Base-Layer, oder Kleid falls gewaehlt
      const topColors = [pickedTop?.color, pickedBaseTop?.color, pickedDress?.color].filter(Boolean) as string[]

      const bottomsPool = filterBottomsByWeather(bottoms, tempValue, useWeather)
      const pickedHose = pickedDress ? null : pickColorAware(bottomsPool, usage, sessionUsedHosen, topColors)
      console.log('PICKED hose:', pickedHose ? uniqueId(pickedHose) : 'none')
const schuhReferenceColors = [...topColors, pickedHose?.color].filter(Boolean) as string[]
      const pickedSchuh = pickColorAware(schuhe, usage, sessionUsedSchuhe, schuhReferenceColors)
      console.log('PICKED schuh:', pickedSchuh ? uniqueId(pickedSchuh) : 'none')

      const jackeReferenceColors = [...topColors, pickedHose?.color].filter(Boolean) as string[]
      let pickedJacke: any = null
      if (jacken.length > 0 && wantsJacket) {
        if (useWeather) {
          if (weatherTier === 'warm') {
            pickedJacke = null
          } else if (weatherTier === 'mild') {
            pickedJacke = Math.random() > 0.7 ? pickColorAware(jacken, usage, new Set(), jackeReferenceColors) : null
          } else {
            // freezing oder cool: immer Jacke
            pickedJacke = pickColorAware(jacken, usage, new Set(), jackeReferenceColors)
          }
        } else {
          pickedJacke = pickColorAware(jacken, usage, new Set(), jackeReferenceColors)
        }
      }

if (pickedTop) sessionUsedTops.add(uniqueId(pickedTop))
      if (pickedBaseTop) sessionUsedTops.add(uniqueId(pickedBaseTop))
      if (pickedDress) sessionUsedTops.add(uniqueId(pickedDress))
      if (pickedHose) sessionUsedHosen.add(uniqueId(pickedHose))
      if (pickedSchuh) sessionUsedSchuhe.add(uniqueId(pickedSchuh))

      let chosenItems = [pickedDress, pickedTop, pickedBaseTop, pickedHose, pickedSchuh, pickedJacke].filter(Boolean)
      let comboKey = chosenItems.map((it: any) => uniqueId(it)).sort().join('+')

if (recentComboSet.has(comboKey) && !pickedDress) {
        // Denselben Wetterfilter wie bei der Erstauswahl anwenden, damit z.B. bei Hitze
        // kein Sweatshirt/Hoodie durch die Hintertuer reinrutscht.
   let altTopPool = tops.filter((t: any) => uniqueId(t) !== uniqueId(pickedTop))
if (useWeather && weatherTier === 'warm') {
          const lightAlt = altTopPool.filter((t: any) => isDefinitelyBaseTop(t))
          if (lightAlt.length > 0) altTopPool = lightAlt
        } else if (useWeather && weatherTier === 'mild') {
          const lightAlt = altTopPool.filter((t: any) => !isLayerTop(t))
          if (lightAlt.length > 0 && Math.random() > 0.2) altTopPool = lightAlt
        } else if (useWeather && (weatherTier === 'freezing' || weatherTier === 'cool')) {
          const warmAlt = altTopPool.filter((t: any) => isLayerTop(t))
          if (warmAlt.length > 0) altTopPool = warmAlt
        }
        const altTop = pickLeastUsed(altTopPool, usage, sessionUsedTops)
        if (altTop) {
          pickedTop = altTop
          sessionUsedTops.add(uniqueId(pickedTop))
          chosenItems = [pickedTop, pickedBaseTop, pickedHose, pickedSchuh, pickedJacke].filter(Boolean)
          comboKey = chosenItems.map((it: any) => uniqueId(it)).sort().join('+')
        }
      }
const chosenNames = chosenItems.map((item: any) => item.name ?? item.category)
      const chosenDescriptions = chosenItems.map((item: any) => {
        const hasLength = (item.category === 'roecke' || item.category === 'kleider') && item.length
        const lengthInfo = hasLength ? ', ' + (isEnglish ? item.length + ' length' : item.length + ' Länge') : ''
        return (item.name ?? item.category) + ' (' + item.color + (item.brand ? ', ' + item.brand : '') + lengthInfo + ')'
      }).join(', ')

      const hasSkirtOrDress = chosenItems.some((item: any) => item.category === 'roecke' || item.category === 'kleider')

      let prompt = ''
      if (isEnglish) {
        prompt = 'You are a fashion stylist. The user will wear exactly these items for "' + occasion + '": ' + chosenDescriptions + '. Weather: ' + weather + '. '
        prompt += 'Write a short, natural one-sentence reasoning (max 25 words) why this combination works together (colors, style, weather), naturally mentioning the temperature.'
        if (hasSkirtOrDress) {
          prompt += ' If a skirt or dress length is mentioned, factor it into the reasoning (e.g. a short length with cold weather, or a long length being elegant for the occasion).'
        }
        prompt += ' Respond ONLY with JSON: {"reasoning": "your text here"}'
      } else {
        prompt = 'Du bist ein Fashion-Stylist. Der Nutzer traegt genau diese Teile fuer "' + occasion + '": ' + chosenDescriptions + '. Wetter: ' + weather + '. '
        prompt += 'Schreib eine kurze, natuerliche ein-Satz-Begruendung (max 25 Woerter) warum diese Kombination zusammenpasst (Farben, Stil, Wetter), erwaehne dabei natuerlich die Temperatur.'
        if (hasSkirtOrDress) {
          prompt += ' Falls eine Rock- oder Kleid-Laenge angegeben ist, beziehe sie in die Begruendung mit ein (z.B. eine kurze Laenge bei kaltem Wetter oder eine lange Laenge als elegant fuer den Anlass).'
        }
        prompt += ' Antworte NUR mit JSON: {"reasoning": "dein Text hier"}'
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