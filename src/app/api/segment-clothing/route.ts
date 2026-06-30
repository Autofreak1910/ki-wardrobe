export const maxDuration = 60

import Replicate from 'replicate'
import { NextResponse } from 'next/server'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function POST(req: Request) {
  try {
    const { imageUrl, pointX, pointY } = await req.json()
    if (!imageUrl) return NextResponse.json({ error: 'No image' }, { status: 400 })

    const output: any = await replicate.run(
      "meta/sam-2:fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83",
      {
        input: {
          image: imageUrl,
          point_coords: `[[${pointX},${pointY}]]`,
          point_labels: "[1]",
        }
      }
    )

let maskUrl: string
    if (output && output.combined_mask && typeof output.combined_mask.url === 'function') {
      maskUrl = output.combined_mask.url().toString()
    } else if (output && typeof output.combined_mask === 'string') {
      maskUrl = output.combined_mask
    } else if (typeof output === 'string') {
      maskUrl = output
    } else if (Array.isArray(output)) {
      maskUrl = typeof output[0] === 'string' ? output[0] : output[0].url().toString()
    } else if (output && typeof output.url === 'function') {
      maskUrl = output.url().toString()
    } else {
      console.error('Unexpected SAM output keys:', Object.keys(output ?? {}))
      throw new Error('Unexpected output format from SAM')
    }

    return NextResponse.json({ success: true, maskUrl })
  } catch (err: any) {
    console.error('Segment error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}