export const maxDuration = 30

import { fal } from '@fal-ai/client'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

fal.config({ credentials: process.env.FAL_KEY })

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!user || userError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const requestId = searchParams.get('requestId')
    const model = searchParams.get('model')
    if (!requestId || !model) {
      return NextResponse.json({ error: 'Missing requestId or model' }, { status: 400 })
    }

    const status = await fal.queue.status(model, { requestId, logs: false })

    if (status.status === 'IN_QUEUE' || status.status === 'IN_PROGRESS') {
      return NextResponse.json({ pending: true, status: status.status })
    }

    if (status.status !== 'COMPLETED') {
      console.error('fal job did not complete:', JSON.stringify(status))
      return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
    }

    // Fertig -- Ergebnis abholen
    const result = await fal.queue.result(model, { requestId })
    const data = result.data as any
    const imageUrl = model.includes('leffa') ? data?.image?.url : data?.images?.[0]?.url

    if (!imageUrl) {
      console.error('No image in fal result:', JSON.stringify(data))
      return NextResponse.json({ error: 'No image returned' }, { status: 500 })
    }

    // Download und in Supabase speichern
    const imgResponse = await fetch(imageUrl as string)
    const imgBuffer = await imgResponse.arrayBuffer()
    const resultFileName = `results/${user.id}/${Date.now()}.jpg`
    await supabase.storage.from('avatars').upload(resultFileName, Buffer.from(imgBuffer), { contentType: 'image/jpeg', upsert: true })
    const { data: { publicUrl: savedUrl } } = supabase.storage.from('avatars').getPublicUrl(resultFileName)

    const { error: insertError } = await supabase.from('avatar_results').insert({
      user_id: user.id,
      image_url: savedUrl,
      created_at: new Date().toISOString(),
    })
    if (insertError) {
      console.error('avatar_results insert FAILED:', JSON.stringify(insertError))
    }

    return NextResponse.json({
      success: true,
      imageUrl: savedUrl,
      _debugSaveError: insertError ? insertError.message ?? String(insertError) : null,
    })
  } catch (err: any) {
    console.error('Status check error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}