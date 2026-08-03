export const maxDuration = 60

import Replicate from 'replicate'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

function getMonthStartUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
}

function getWeekStartUTC(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const diffToMonday = (day === 0 ? -6 : 1) - day
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday, 0, 0, 0, 0))
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!user || userError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { personImage, garmentImage, garmentDescription, category } = await req.json()
    console.log('garmentImage type:', typeof garmentImage, 'value:', garmentImage)

    // Check limits -- ueber die RPC, damit ein abgelaufenes Premium korrekt als abgelaufen erkannt wird,
    // genau wie ueberall sonst in der App (Dresser, Profil, Avatar-Frontend).
    const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: stillPremium } = await supabase.rpc('check_and_expire_premium', { p_user_id: user.id })
    const isPremium = stillPremium ?? false

    if (!isPremium) {
      // Free: 2 Avatare pro Kalendermonat
      const monthStart = getMonthStartUTC()
      const { count } = await supabase.from('avatar_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString()) as any
      if ((count ?? 0) >= 2) {
        return NextResponse.json({ error: 'monthly_limit' }, { status: 403 })
      }
    } else {
      // Pro: 6 Avatare pro Woche (Reset Montag 00:00 UTC)
      const weekStart = getWeekStartUTC()
      const { count } = await supabase.from('avatar_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', weekStart.toISOString()) as any
      if ((count ?? 0) >= 6) {
        return NextResponse.json({ error: 'weekly_limit' }, { status: 403 })
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

    const { data: { publicUrl: originalPublicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)

    // Hintergrund vom Selfie entfernen für bessere Try-On-Qualität
    let publicUrl = originalPublicUrl
    try {
      const bgRes = await fetch(new URL('/api/remove-background', req.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: originalPublicUrl }),
      })
      const bgData = await bgRes.json()
      if (bgData.success && bgData.imageUrl) {
        publicUrl = bgData.imageUrl
      }
    } catch (bgErr) {
      console.error('Background removal on selfie failed, using original:', bgErr)
    }

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
              { type: 'text', text: 'Is a person clearly visible in this photo, showing at least their upper body, without being extremely blurry or dark? Only say "bad" if the photo is unusable (no person visible, extremely dark, or heavily obstructed). Reply with ONLY one word: "good" or "bad".' },
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

const categoryMap: Record<string, string> = {
      tops: 'upper_body',
      jacken: 'upper_body',
      acc: 'upper_body',
      hosen: 'lower_body',
      kurze_hosen: 'lower_body',
      roecke: 'lower_body',
      kleider: 'dresses',
    }
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

    // Save result -- created_at wird jetzt explizit gesetzt, damit sich der Zaehler
    // niemals auf einen (evtl. fehlenden) DB-Standardwert verlassen muss.
    const { error: insertError } = await supabase.from('avatar_results').insert({
      user_id: user.id,
      image_url: savedUrl,
      created_at: new Date().toISOString(),
    })
    if (insertError) {
      console.error('avatar_results insert FAILED:', JSON.stringify(insertError))
    } else {
      console.log('avatar_results insert OK')
    }

    return NextResponse.json({
      success: true,
      imageUrl: savedUrl,
      // Nur zur Fehlersuche -- zeigt direkt in der Netzwerk-Antwort, falls das Speichern
      // des Ergebnisses (fuer die Try-On-Zaehlung) im Hintergrund fehlschlaegt.
      _debugSaveError: insertError ? insertError.message ?? String(insertError) : null,
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}