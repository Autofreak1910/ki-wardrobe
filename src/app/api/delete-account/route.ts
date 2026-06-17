import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!user || userError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = user.id

    // Service Role Client für Admin-Löschung (umgeht RLS)
    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

  // Storage-Dateien löschen (clothing + avatars Buckets)
    for (const bucket of ['clothing', 'avatars']) {
      try {
        const { data: files } = await adminClient.storage.from(bucket).list(userId)
        if (files && files.length > 0) {
          const paths = files.map(f => `${userId}/${f.name}`)
          await adminClient.storage.from(bucket).remove(paths)
        }
      } catch (storageErr) {
        console.error(`Storage cleanup failed for bucket ${bucket}:`, storageErr)
      }
    }

    // Alle zugehörigen Daten löschen (Reihenfolge wegen Foreign Keys beachten)
    await adminClient.from('push_subscriptions').delete().eq('user_id', userId)
    await adminClient.from('outfit_generations').delete().eq('user_id', userId)
    await adminClient.from('daily_outfits').delete().eq('user_id', userId)
    await adminClient.from('outfits').delete().eq('user_id', userId)
    await adminClient.from('clothing_items').delete().eq('user_id', userId)
    await adminClient.from('profiles').delete().eq('id', userId)

    // Zuletzt den Auth-User selbst löschen
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Delete account error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}