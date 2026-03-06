// src/app/api/cover/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { atmosphere, wound, resonance } = await req.json()

  if (!atmosphere) {
    return NextResponse.json({ error: '설정이 없습니다.' }, { status: 400 })
  }

  const prompt = [
    'literary novel cover illustration, painterly, cinematic, atmospheric, NO text NO words NO letters',
    `visual world: ${atmosphere}`,
    wound ? `emotional theme: ${wound}` : '',
    resonance ? `feeling: ${resonance}` : '',
    'oil painting style, dramatic lighting, symbolic scene, professional book cover art',
  ].filter(Boolean).join(', ')

  const res = await fetch('https://fal.run/fal-ai/flux/dev', {
    method: 'POST',
    headers: {
      Authorization: `Key ${process.env.FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: { width: 420, height: 630 },
      num_inference_steps: 28,
      num_images: 1,
      guidance_scale: 3.5,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[cover] fal.ai error:', err)
    return NextResponse.json({ error: '표지 생성 실패' }, { status: 500 })
  }

  const data = await res.json()
  const imageUrl = data.images?.[0]?.url
  if (!imageUrl) {
    return NextResponse.json({ error: '이미지 없음' }, { status: 500 })
  }

  return NextResponse.json({ imageUrl })
}
