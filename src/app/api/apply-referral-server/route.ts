import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId, referralCode } = await request.json()
    if (!userId || !referralCode) return NextResponse.json({ success: false })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase.rpc('apply_referral', {
      p_new_user_id: userId,
      p_referral_code: referralCode,
    })

    console.log('Server referral result:', data, error)
    return NextResponse.json({ success: data?.success ?? false, error: error?.message })
  } catch (err) {
    console.error('Server referral error:', err)
    return NextResponse.json({ success: false, error: String(err) })
  }
}