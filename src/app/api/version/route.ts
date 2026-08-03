import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// VERCEL_GIT_COMMIT_SHA wird von Vercel automatisch bei jedem Deployment gesetzt.
// Lokal (kein Deployment) fällt es auf den Server-Start-Zeitpunkt zurück, das reicht
// für lokale Entwicklung völlig aus.
const BUILD_VERSION = process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now())

export async function GET() {
  return NextResponse.json({ version: BUILD_VERSION })
}