import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let timezone = 'UTC'
    try {
      const body = await req.json()
      if (body?.timezone) timezone = body.timezone
    } catch {}

    function localDateStr(date: Date): string {
      return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
    }

    const today = localDateStr(new Date())
    const { data: prof } = await supabase
      .from('profiles')
    .select('current_streak, last_outfit_date, premium_until, is_premium, bonus_outfits_this_week, bonus_tryons_this_week, streak_cycle, streak_reward_claimed_7_cycle, streak_reward_claimed_14_cycle, streak_reward_claimed_30_cycle, streak_reward_claimed_45_cycle, streak_reward_claimed_60_cycle, streak_reward_claimed_100_cycle')
      .eq('id', user.id)
      .single()

    if (!prof) return NextResponse.json({ streak: 0 })

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = localDateStr(yesterday)

    const newStreak = prof.last_outfit_date === yesterdayStr
      ? (prof.current_streak ?? 0) + 1
      : prof.last_outfit_date === today
        ? (prof.current_streak ?? 1)
        : 1

    const updates: any = { current_streak: newStreak, last_outfit_date: today }

    let streakReward = null
    const isPremiumActive = prof.is_premium && prof.premium_until && new Date(prof.premium_until) > new Date()
    const cycle = prof.streak_cycle ?? 0

const milestones = [
      { at: 100, claimedCycleKey: 'streak_reward_claimed_100_cycle' as const, proOutfits: 5, proTryons: 3, freeDays: 7 },
      { at: 60,  claimedCycleKey: 'streak_reward_claimed_60_cycle'  as const, proOutfits: 4, proTryons: 2, freeDays: 5 },
      { at: 45,  claimedCycleKey: 'streak_reward_claimed_45_cycle'  as const, proOutfits: 3, proTryons: 2, freeDays: 4 },
      { at: 30,  claimedCycleKey: 'streak_reward_claimed_30_cycle'  as const, proOutfits: 3, proTryons: 1, freeDays: 3 },
      { at: 14,  claimedCycleKey: 'streak_reward_claimed_14_cycle'  as const, proOutfits: 2, proTryons: 1, freeDays: 2 },
      { at: 7,   claimedCycleKey: 'streak_reward_claimed_7_cycle'   as const, proOutfits: 1, proTryons: 0, freeDays: 1 },
    ]

    for (const m of milestones) {
      const alreadyClaimedThisCycle = (prof[m.claimedCycleKey] ?? -1) === cycle
      if (newStreak >= m.at && !alreadyClaimedThisCycle) {
        updates[m.claimedCycleKey] = cycle

        if (isPremiumActive) {
          updates.bonus_outfits_this_week = (prof.bonus_outfits_this_week ?? 0) + m.proOutfits
          if (m.proTryons > 0) updates.bonus_tryons_this_week = (prof.bonus_tryons_this_week ?? 0) + m.proTryons
          streakReward = { milestone: m.at, type: 'boost', outfits: m.proOutfits, tryons: m.proTryons }
        } else {
          const premiumUntil = prof.premium_until ? new Date(prof.premium_until) : new Date()
          if (premiumUntil < new Date()) premiumUntil.setTime(Date.now())
          premiumUntil.setDate(premiumUntil.getDate() + m.freeDays)
          updates.premium_until = premiumUntil.toISOString()
          streakReward = { milestone: m.at, type: 'days', days: m.freeDays }
        }
        break
      }
    }

    await supabase.from('profiles').update(updates).eq('id', user.id)

    return NextResponse.json({ success: true, streak: newStreak, streakReward })
  } catch (err: any) {
    console.error('update-streak error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}