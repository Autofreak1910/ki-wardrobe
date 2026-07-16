export const maxDuration = 60

import Replicate from 'replicate'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'



const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
 const { data: { user }, error: userError } = await supabase.auth.getUser()
if (!user || userError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const { personImage, garmentImage, garmentDescription, category } = await req.json()
console.log('garmentImage type:', typeof garmentImage, 'value:', garmentImage)

    // Check limits
    const { data: profile } = await supabase.from('profiles').select('is_premium, avatar_tries_left').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    if (!profile.is_premium) {
      if ((profile.avatar_tries_left ?? 0) <= 0) {
        return NextResponse.json({ error: 'limit_reached' }, { status: 403 })
      }
    } else {
      const today = new Date().toISOString().split('T')[0]
      const { count } = await supabase.from('avatar_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today + 'T00:00:00') as any
   if ((count ?? 0) >= 2) {
        return NextResponse.json({ error: 'daily_limit' }, { status: 403 })
      }
    }

  // Upload selfie to Supabase Storage
   const base64Data = personImage.replace(/^data:image\/\w+;base64,/, '')
const buffer = Buffer.from(base64Data, 'base64')
    const fileName = `avatars/${user.id}/${Date.now()}.jpg`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })
    
    if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)

    // Selfie-Qualität prüfen bevor teure Generierung läuft
    try {
      const checkRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 15,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Is this a clear, well-lit full-body photo of one person, standing straight, facing forward, with a plain uncluttered background, suitable for virtual clothing try-on? Reply with ONLY one word: "good" or "bad".' },
              { type: 'image_url', image_url: { url: publicUrl } },
            ],
          }],
        }),
      })
      const checkData = await checkRes.json()
      const verdict = checkData.choices?.[0]?.message?.content?.toLowerCase().trim() ?? 'good'
      if (verdict.includes('bad')) {
        return NextResponse.json({
          error: 'bad_selfie',
          message: 'Dein Foto eignet sich nicht gut für Try-On. Bitte nutze ein Ganzkörperfoto mit klarer Pose, gutem Licht und einfachem Hintergrund.',
        }, { status: 400 })
      }
    } catch (checkErr) {
      console.error('Selfie quality check failed:', checkErr)
      // Bei Fehler im Check einfach weitermachen, nicht blockieren
    }

    const categoryMap: Record<string, string> = { tops: 'upper_body', hosen: 'lower_body', jacken: 'upper_body', acc: 'upper_body' }
    const garmentCategory = categoryMap[category] ?? 'upper_body'

    // Run Replicate
    const output = await replicate.run(
      'cuuupid/idm-vton:906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f',
      {
        input: {
          human_img: publicUrl,
          garm_img: garmentImage,
          garment_des: garmentDescription || 'clothing item',
          category: garmentCategory,
        is_checked: true,
          is_checked_crop: false,
          denoise_steps: 30,
        }
      }
    )

    const imageUrl = Array.isArray(output) ? output[0] : output
    // Download und in Supabase speichern
const imgResponse = await fetch(imageUrl as string)
const imgBuffer = await imgResponse.arrayBuffer()
const resultFileName = `results/${user.id}/${Date.now()}.jpg`
await supabase.storage.from('avatars').upload(resultFileName, Buffer.from(imgBuffer), { contentType: 'image/jpeg', upsert: true })
const { data: { publicUrl: savedUrl } } = supabase.storage.from('avatars').getPublicUrl(resultFileName)

 // Save result
    const { error: insertError } = await supabase.from('avatar_results').insert({
      user_id: user.id,
      image_url: savedUrl,
    })
    console.log('avatar_results insert error:', insertError)

    // Decrement free tries
    if (!profile.is_premium) {
      await supabase.from('profiles').update({
        avatar_tries_left: (profile.avatar_tries_left ?? 0) - 1
      }).eq('id', user.id)
    }

  return NextResponse.json({ success: true, imageUrl: savedUrl })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}