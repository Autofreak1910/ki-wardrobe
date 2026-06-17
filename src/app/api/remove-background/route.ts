export const maxDuration = 60

import Replicate from 'replicate'
import { NextResponse } from 'next/server'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return NextResponse.json({ error: 'No image' }, { status: 400 })

 const output = await replicate.run(
  "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aa1a999f0eb22f02e4c95fd3c98e7e3",
  { input: { image: imageUrl } }
)
    const resultUrl = Array.isArray(output) ? output[0] : output

    return NextResponse.json({ success: true, imageUrl: resultUrl })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}