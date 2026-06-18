import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId, referralCode } = await request.json()
    if (!userId || !referralCode) {
      return NextResponse.json({ success: false, error: 'missing params' })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await supabase.rpc('apply_referral', {
      p_new_user_id: userId,
      p_referral_code: referralCode,
    })

    console.log('apply_referral result:', data, 'error:', error)
    return NextResponse.json({ success: data?.success ?? false, data, error: error?.message })
  } catch (err) {
    console.error('apply_referral_server error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}