export const maxDuration = 60

import Replicate from 'replicate'
import { NextResponse } from 'next/server'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return NextResponse.json({ error: 'No image' }, { status: 400 })

const output = await replicate.run(
  "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf",
  { input: { image: imageUrl } }
)
    const resultUrl = Array.isArray(output) ? output[0] : output

    return NextResponse.json({ success: true, imageUrl: resultUrl })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}