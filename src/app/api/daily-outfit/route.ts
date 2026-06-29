import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { data: dailyOutfit, error } = await supabase
    .from('daily_outfits')
    .select('*')
    .eq('user_id', session.user.id)
    .gte('created_at', startOfDay.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Daily outfit fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!dailyOutfit) {
    return NextResponse.json({ outfit: null })
  }

  const { data: items } = await supabase
    .from('clothing_items')
    .select('*')
    .in('id', dailyOutfit.item_ids ?? [])

  return NextResponse.json({
    outfit: {
      id: dailyOutfit.id,
      reasoning: dailyOutfit.reasoning,
      vibe: dailyOutfit.vibe,
      itemObjects: items ?? [],
    },
  })
}