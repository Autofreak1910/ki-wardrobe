import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MAX_SAVED_SELFIES = 3

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (!user || userError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('saved_selfies')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, selfies: data ?? [] })
}

// Prueft EINMALIG beim Speichern, ob die Person auf dem Foto eine lange Hose
// traegt oder nicht. Das Ergebnis wird zusammen mit dem Selfie gespeichert,
// damit spaetere Avatar-Generierungen sofort wissen, ob dieses Foto fuer
// Roecke/kurze Hosen geeignet ist -- ohne bei jeder Generierung erneut zu
// pruefen (schneller, weniger API-Calls).
async function classifyLegType(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Are the person\'s legs covered by long pants/trousers reaching below the knee? Reply with ONLY one word: "long_pants" or "short_or_bare".' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        }],
      }),
    })
    const data = await res.json()
    const verdict = data.choices?.[0]?.message?.content?.toLowerCase().trim() ?? ''
    if (verdict.includes('long_pants')) return 'long_pants'
    if (verdict.includes('short_or_bare')) return 'short_or_bare'
    return null
  } catch (err) {
    console.error('Leg type classification failed:', err)
    return null
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (!user || userError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { image } = await req.json()
    if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    // Wieviele hat der User schon -- bei Erreichen des Limits das aelteste loeschen,
    // damit maximal MAX_SAVED_SELFIES gleichzeitig gespeichert sind.
    const { data: existing } = await supabase
      .from('saved_selfies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (existing && existing.length >= MAX_SAVED_SELFIES) {
      const oldest = existing[0]
      await supabase.from('saved_selfies').delete().eq('id', oldest.id)
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const fileName = `saved-selfies/${user.id}/${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)

    // Einmalige Klassifizierung -- laeuft parallel zum Rest, kostet kaum Zeit
    const legType = await classifyLegType(publicUrl)

    const { data: inserted, error: insertError } = await supabase
      .from('saved_selfies')
      .insert({ user_id: user.id, image_url: publicUrl, leg_type: legType })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ success: true, selfie: inserted })
  } catch (err: any) {
    console.error('Save selfie error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (!user || userError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'No id provided' }, { status: 400 })

    const { error } = await supabase.from('saved_selfies').delete().eq('id', id).eq('user_id', user.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Delete selfie error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}