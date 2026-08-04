import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { rating, message } = await request.json()

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Invalid rating' }, { status: 400 })
    }

    const { error: dbError } = await supabase.from('feedback').insert({
      user_id: user.id,
      type: 'in_app_rating',
      rating,
      message: message?.trim() || '',
      email: user.email || null,
      wants_reply: false,
    })

    if (dbError) throw dbError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}