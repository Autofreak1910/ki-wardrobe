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

    const { data: inserted, error: insertError } = await supabase
      .from('saved_selfies')
      .insert({ user_id: user.id, image_url: publicUrl })
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