export const maxDuration = 60

import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const baseUrl = new URL(req.url).origin
  const res = await fetch(`${baseUrl}/api/send-daily-push`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  })
  const data = await res.json()
  return NextResponse.json(data)
}