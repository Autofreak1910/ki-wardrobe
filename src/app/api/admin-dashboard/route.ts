import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'kiwardrobebusiness@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_DASHBOARD_PASSWORD

export async function POST(request: NextRequest) {
  try {
    const { password, userEmail } = await request.json()

    if (userEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
    }
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'wrong_password' }, { status: 403 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)

    const [
      totalUsersRes,
      premiumUsersRes,
      payingUsersRes,
      newTodayRes,
      newWeekRes,
      outfitsTodayRes,
      outfitsWeekRes,
      avatarsTodayRes,
      totalItemsRes,
      recentUsersRes,
      outfitsAllTimeRes,
      avatarsAllTimeRes,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true).eq('premium_source', 'stripe'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday.toISOString()),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
      supabase.from('outfit_generations').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday.toISOString()),
      supabase.from('outfit_generations').select('id', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
      supabase.from('avatar_results').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday.toISOString()),
      supabase.from('clothing_items').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('username, created_at, is_premium, referred_by, premium_source').order('created_at', { ascending: false }).limit(8),
      supabase.from('outfit_generations').select('id', { count: 'exact', head: true }),
      supabase.from('avatar_results').select('id', { count: 'exact', head: true }),
    ])

    const totalUsers = totalUsersRes.count ?? 0
    const premiumUsers = premiumUsersRes.count ?? 0
    const payingUsers = payingUsersRes.count ?? 0
    const referralPremium = premiumUsers - payingUsers
    const mrr = payingUsers * 4.99

    const COST_PER_OUTFIT = 0.015
    const COST_PER_AVATAR = 0.08
    const outfitsToday = outfitsTodayRes.count ?? 0
    const avatarsToday = avatarsTodayRes.count ?? 0
    const aiCostToday = (outfitsToday * COST_PER_OUTFIT) + (avatarsToday * COST_PER_AVATAR)
    const outfitsAllTime = outfitsAllTimeRes.count ?? 0
    const avatarsAllTime = avatarsAllTimeRes.count ?? 0
    const aiCostAllTime = (outfitsAllTime * COST_PER_OUTFIT) + (avatarsAllTime * COST_PER_AVATAR)
    const costPerUser = totalUsers > 0 ? aiCostAllTime / totalUsers : 0

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        premiumUsers,
        freeUsers: totalUsers - premiumUsers,
        newToday: newTodayRes.count ?? 0,
        newWeek: newWeekRes.count ?? 0,
        outfitsToday,
        outfitsWeek: outfitsWeekRes.count ?? 0,
        avatarsToday,
        totalItems: totalItemsRes.count ?? 0,
        mrr: mrr.toFixed(2),
        payingUsers,
        referralPremium,
        aiCostToday: aiCostToday.toFixed(2),
        aiCostAllTime: aiCostAllTime.toFixed(2),
        costPerUser: costPerUser.toFixed(3),
        recentUsers: recentUsersRes.data ?? [],
      },
    })
  } catch (err) {
    console.error('Admin dashboard error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}