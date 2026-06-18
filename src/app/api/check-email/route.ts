import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ exists: false })

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) throw error

    const exists = data.users.some(u => u.email?.toLowerCase() === email.toLowerCase())
    return NextResponse.json({ exists })
  } catch (error) {
    console.error('Check email error:', error)
    return NextResponse.json({ exists: false })
  }
}