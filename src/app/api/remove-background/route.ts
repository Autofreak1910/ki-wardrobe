export const maxDuration = 60

import Replicate from 'replicate'
import { NextResponse } from 'next/server'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return NextResponse.json({ error: 'No image' }, { status: 400 })

const output: any = await replicate.run(
  "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
  { input: { image: imageUrl } }
)

let resultUrl: string
if (typeof output === 'string') {
  resultUrl = output
} else if (Array.isArray(output)) {
  resultUrl = typeof output[0] === 'string' ? output[0] : output[0].url().toString()
} else if (output && typeof output.url === 'function') {
  resultUrl = output.url().toString()
} else {
  throw new Error('Unexpected output format from replicate')
}

return NextResponse.json({ success: true, imageUrl: resultUrl })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}