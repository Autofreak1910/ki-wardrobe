import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = new Date().toISOString().split('T')[0]
    const { data: prof } = await supabase
      .from('profiles')
      .select('current_streak, last_outfit_date, streak_reward_claimed_7, streak_reward_claimed_14, streak_reward_claimed_30, premium_until')
      .eq('id', user.id)
      .single()

    if (!prof) return NextResponse.json({ streak: 0 })

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const newStreak = prof.last_outfit_date === yesterdayStr
      ? (prof.current_streak ?? 0) + 1
      : prof.last_outfit_date === today
        ? (prof.current_streak ?? 1)
        : 1

    const updates: any = { current_streak: newStreak, last_outfit_date: today }

    let streakReward = null
    const premiumUntil = prof.premium_until ? new Date(prof.premium_until) : new Date()
    if (premiumUntil < new Date()) premiumUntil.setTime(Date.now())

    if (newStreak >= 30 && !prof.streak_reward_claimed_30) {
      premiumUntil.setDate(premiumUntil.getDate() + 3)
      updates.streak_reward_claimed_30 = true
      updates.premium_until = premiumUntil.toISOString()
      streakReward = { days: 3, milestone: 30 }
    } else if (newStreak >= 14 && !prof.streak_reward_claimed_14) {
      premiumUntil.setDate(premiumUntil.getDate() + 2)
      updates.streak_reward_claimed_14 = true
      updates.premium_until = premiumUntil.toISOString()
      streakReward = { days: 2, milestone: 14 }
    } else if (newStreak >= 7 && !prof.streak_reward_claimed_7) {
      premiumUntil.setDate(premiumUntil.getDate() + 1)
      updates.streak_reward_claimed_7 = true
      updates.premium_until = premiumUntil.toISOString()
      streakReward = { days: 1, milestone: 7 }
    }

    await supabase.from('profiles').update(updates).eq('id', user.id)

    return NextResponse.json({ success: true, streak: newStreak, streakReward })
  } catch (err: any) {
    console.error('update-streak error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}