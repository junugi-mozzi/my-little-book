// src/app/api/cover/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { atmosphere, wound, direction, tension, resonance, title } = await req.json()

    if (!atmosphere) {
      return NextResponse.json({ error: '설정이 없습니다.' }, { status: 400 })
    }

    // Step 1: Gemini로 소설 맞춤 시각 컨셉 생성
    const conceptPrompt = `You are a world-class literary novel cover illustrator.
Based on the novel information below, describe a unique and creative cover image concept in English.

Novel information:
- Atmosphere/World: ${atmosphere}
- Core wound of the story: ${wound || 'none'}
- Direction of the story: ${direction || 'none'}
- Tension in the story: ${tension || 'none'}
- Resonance for the reader: ${resonance || 'none'}
${title ? `- Title: ${title}` : ''}

Rules:
1. Describe a specific visual scene, composition, color palette, mood, and art style in 2-3 English sentences
2. Must include "no text, no letters, no title, no words"
3. Freely reference specific painters or styles (e.g. Andrew Wyeth, Edward Hopper, watercolor, ink wash, chiaroscuro, etc.)
4. Freely choose whether to center on a figure, landscape, or object
5. The unique sensibility of this novel must come through
6. Output only the image prompt text, no explanation`

    let visualConcept = ''
    try {
      const conceptRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: conceptPrompt,
      })
      const raw = conceptRes.text?.trim() ?? ''
      visualConcept = raw.slice(0, 600)
      console.log('[cover] visual concept:', visualConcept)
    } catch (e) {
      console.error('[cover] gemini concept error:', e)
    }

    // Gemini 실패 시 기존 방식으로 fallback
    if (!visualConcept) {
      visualConcept = [
        `visual world: ${atmosphere}`,
        wound ? `emotional theme: ${wound}` : '',
        resonance ? `feeling: ${resonance}` : '',
        'oil painting style, dramatic lighting, symbolic scene, no text, no letters, no title, no words',
      ].filter(Boolean).join(', ')
    }

    // Step 2: Replicate FLUX/dev로 이미지 생성
    const prompt = `professional literary novel book cover illustration, ${visualConcept}`
    console.log('[cover] replicate prompt length:', prompt.length)

    const res = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify({
        input: {
          prompt,
          width: 448,
          height: 640,
          num_inference_steps: 28,
          guidance: 3.5,
          num_outputs: 1,
          output_format: 'webp',
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[cover] replicate error status:', res.status, err)
      return NextResponse.json({ error: '표지 생성 실패' }, { status: 500 })
    }

    const data = await res.json()
    console.log('[cover] replicate status:', data.status)
    const imageUrl = data.output?.[0]
    if (!imageUrl) {
      console.error('[cover] no imageUrl in response:', JSON.stringify(data))
      return NextResponse.json({ error: '이미지 없음' }, { status: 500 })
    }

    return NextResponse.json({ imageUrl })
  } catch (e) {
    console.error('[cover] unhandled error:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
