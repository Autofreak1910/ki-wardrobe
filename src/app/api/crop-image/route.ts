import { NextResponse } from 'next/server'
import sharp from 'sharp'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('Crop request body:', JSON.stringify(body))

    const imageUrl = body.imageUrl
    const x = Number(body.x)
    const y = Number(body.y)
    const w = Number(body.width)
    const h = Number(body.height)

    console.log('Parsed values:', { x, y, w, h })

    if (!imageUrl || isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) {
      return NextResponse.json({ error: `Invalid params: x=${x} y=${y} w=${w} h=${h}` }, { status: 400 })
    }

    const res = await fetch(imageUrl)
    const buffer = Buffer.from(await res.arrayBuffer())
    const meta = await sharp(buffer).metadata()
    const imgW = meta.width!
    const imgH = meta.height!

    console.log('Image size:', imgW, 'x', imgH)

    const pad = 0.15
    const cropX = Math.max(0, Math.round((x / 100) * imgW - (w / 100) * imgW * pad))
    const cropY = Math.max(0, Math.round((y / 100) * imgH - (h / 100) * imgH * pad))
    const cropW = Math.min(imgW - cropX, Math.round((w / 100) * imgW * (1 + pad * 2)))
    const cropH = Math.min(imgH - cropY, Math.round((h / 100) * imgH * (1 + pad * 2)))

    console.log('Crop rect:', { cropX, cropY, cropW, cropH })

    if (cropW <= 0 || cropH <= 0) {
      return NextResponse.json({ error: `Invalid crop dimensions: ${cropW}x${cropH}` }, { status: 400 })
    }

    const cropped = await sharp(buffer)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .jpeg({ quality: 92 })
      .toBuffer()

    return new Response(cropped, {
      headers: { 'Content-Type': 'image/jpeg' }
    })
  } catch (err: any) {
    console.error('Crop error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}