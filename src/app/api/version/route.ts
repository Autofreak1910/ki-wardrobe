import { NextResponse } from 'next/server'
import { CURRENT_VERSION, getLatestChangelogEntry } from '@/lib/app-version'

export const dynamic = 'force-dynamic'

export async function GET() {
  const entry = getLatestChangelogEntry()
  return NextResponse.json({
    version: CURRENT_VERSION,
    date: entry.date,
    notesDe: entry.notesDe,
    notesEn: entry.notesEn,
  })
}