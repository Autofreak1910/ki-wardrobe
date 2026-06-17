import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!user || userError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { referralCode } = await req.json()
    if (!referralCode) return NextResponse.json({ error: 'No code provided' }, { status: 400 })

    const { data, error } = await supabase.rpc('apply_referral', {
      p_new_user_id: user.id,
      p_referral_code: referralCode,
    })

    if (error) throw error

    return NextResponse.json(data)
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}