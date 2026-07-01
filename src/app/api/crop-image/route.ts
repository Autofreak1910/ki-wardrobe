import { NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(req: Request) {
  try {
    const { imageUrl, x, y, width, height } = await req.json()

    const res = await fetch(imageUrl)
    const buffer = Buffer.from(await res.arrayBuffer())
    const meta = await sharp(buffer).metadata()
    const imgW = meta.width!
    const imgH = meta.height!

    const pad = 0.15
    const cropX = Math.max(0, Math.round((x / 100) * imgW - (width / 100) * imgW * pad))
    const cropY = Math.max(0, Math.round((y / 100) * imgH - (height / 100) * imgH * pad))
    const cropW = Math.min(imgW - cropX, Math.round((width / 100) * imgW * (1 + pad * 2)))
    const cropH = Math.min(imgH - cropY, Math.round((height / 100) * imgH * (1 + pad * 2)))

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