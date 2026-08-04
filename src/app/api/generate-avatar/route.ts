export const maxDuration = 60

import { fal } from '@fal-ai/client'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

fal.config({ credentials: process.env.FAL_KEY })

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

    // Check limits -- ueber die RPC, damit ein abgelaufenes Premium korrekt als abgelaufen erkannt wird.
    const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data: stillPremium } = await supabase.rpc('check_and_expire_premium', { p_user_id: user.id })
    const isPremium = stillPremium ?? false

    if (!isPremium) {
      const monthStart = getMonthStartUTC()
      const { count } = await supabase.from('avatar_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString()) as any
      if ((count ?? 0) >= 2) {
        return NextResponse.json({ error: 'monthly_limit' }, { status: 403 })
      }
    } else {
      const weekStart = getWeekStartUTC()
      const { count } = await supabase.from('avatar_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', weekStart.toISOString()) as any
      if ((count ?? 0) >= 6) {
        return NextResponse.json({ error: 'weekly_limit' }, { status: 403 })
      }
    }

    // personImage kann entweder ein neu hochgeladenes Base64-Bild sein
    // ODER bereits eine fertige URL (gespeichertes Selfie aus der Galerie).
    let originalPublicUrl: string

    if (personImage.startsWith('http')) {
      originalPublicUrl = personImage
    } else {
      const base64Data = personImage.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const fileName = `avatars/${user.id}/${Date.now()}.jpg`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })

      if (uploadError) throw uploadError

      const result = supabase.storage.from('avatars').getPublicUrl(fileName)
      originalPublicUrl = result.data.publicUrl
    }
    console.log('originalPublicUrl (selfie):', originalPublicUrl)

    async function waitForImageReady(url: string, maxAttempts = 4): Promise<void> {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const check = await fetch(url, { cache: 'no-store' })
          const contentType = check.headers.get('content-type') || ''
          if (check.ok && contentType.startsWith('image/')) return
        } catch {}
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt))
        }
      }
    }
    await waitForImageReady(originalPublicUrl)

    // Hintergrund vom Selfie entfernen für bessere Try-On-Qualität
    let publicUrl = originalPublicUrl
    try {
      const bgRes = await fetch(new URL('/api/remove-background', req.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: req.headers.get('cookie') || '',
        },
        body: JSON.stringify({ imageUrl: originalPublicUrl }),
      })
      const bgData = await bgRes.json()
      if (bgData.success && bgData.imageUrl) {
        publicUrl = bgData.imageUrl
      }
    } catch (bgErr) {
      console.error('Background removal on selfie failed, using original:', bgErr)
    }
    console.log('Final publicUrl sent to try-on as model_image:', publicUrl)

    // Selfie-Qualität prüfen bevor teure Generierung läuft
    try {
      const isShortLowerBody = category === 'roecke' || category === 'kurze_hosen' || category === 'kleider'

      const questionText = isShortLowerBody
        ? 'Look at this photo. Answer TWO things separated by a comma: (1) Is a person clearly visible, showing at least their upper body, without being extremely blurry or dark? Reply "good" or "bad". (2) Are the person\'s legs covered by long pants/trousers reaching below the knee? Reply "long_pants" or "short_or_bare". Format your entire reply as exactly: "<good|bad>,<long_pants|short_or_bare>"'
        : 'Is a person clearly visible in this photo, showing at least their upper body, without being extremely blurry or dark? Only say "bad" if the photo is unusable (no person visible, extremely dark, or heavily obstructed). Reply with ONLY one word: "good" or "bad".'

      const checkRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 20,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: questionText },
              { type: 'image_url', image_url: { url: publicUrl } },
            ],
          }],
        }),
      })
      const checkData = await checkRes.json()
      const rawVerdict = checkData.choices?.[0]?.message?.content?.toLowerCase().trim() ?? 'good'

      const qualityPart = rawVerdict.split(',')[0]?.trim() ?? 'good'
      if (qualityPart.includes('bad')) {
        return NextResponse.json({
          error: 'bad_selfie',
          message: 'Dein Foto eignet sich nicht gut für Try-On. Bitte nutze ein Ganzkörperfoto mit klarer Pose, gutem Licht und einfachem Hintergrund.',
        }, { status: 400 })
      }

      // Sicherheitsnetz fuer NEU hochgeladene (noch nicht klassifizierte)
      // Selfies -- bereits gespeicherte Selfies wurden schon beim Speichern
      // klassifiziert (saved_selfies.leg_type) und das Frontend warnt dort
      // schon vorher, ohne diesen Call ueberhaupt zu brauchen.
      if (isShortLowerBody && rawVerdict.includes('long_pants')) {
        return NextResponse.json({
          error: 'long_pants_conflict',
          message: 'Für Röcke und kurze Hosen brauchst du ein Foto, auf dem deine Beine nicht von einer langen Hose bedeckt sind.',
        }, { status: 400 })
      }
    } catch (checkErr) {
      console.error('Selfie quality check failed:', checkErr)
    }

    // Ein Rock ist im Prinzip wie eine kurze Hose -- sitzt an der Huefte,
    // geht bis zum Oberschenkel. Explizite Kategorie 'bottoms' (statt 'auto',
    // das faelschlich lange Jeans erzeugt hat, oder Leffa 'dresses', das
    // faelschlich ein langes Kleid mit Aermeln erzeugt hat) ist die simple,
    // korrekte Angabe fuer Hosen, kurze Hosen UND Roecke gleichermassen.
    const fashnCategoryMap: Record<string, string> = {
      tops: 'tops',
      jacken: 'tops',
      hosen: 'bottoms',
      kurze_hosen: 'bottoms',
      roecke: 'bottoms',
      kleider: 'one-pieces',
    }
    const fashnCategory = fashnCategoryMap[category] ?? 'auto'

    const modelEndpoint = 'fal-ai/fashn/tryon/v1.6'
    const input = {
      model_image: publicUrl,
      garment_image: garmentImage,
      category: fashnCategory,
      mode: 'quality',
    }

    // WICHTIG: Nicht mehr blockierend auf das Ergebnis warten (fal.subscribe),
    // das hat bei laengeren Generierungen zu Vercel-Timeouts gefuehrt, selbst
    // wenn die KI kurz vor dem Fertigwerden war. Stattdessen: Job einreihen
    // und SOFORT die request_id zurueckgeben. Das Frontend fragt danach in
    // kurzen Abstaenden bei /api/generate-avatar/status nach, ob es fertig ist.
    const { request_id } = await fal.queue.submit(modelEndpoint, { input })

    return NextResponse.json({
      pending: true,
      requestId: request_id,
      model: modelEndpoint,
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}