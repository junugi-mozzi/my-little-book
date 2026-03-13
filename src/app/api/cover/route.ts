// src/app/api/cover/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@supabase/supabase-js'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

    // Step 2: Gemini 2.0 Flash로 이미지 생성
    const imagePrompt = `professional literary novel book cover illustration, ${visualConcept}`
    console.log('[cover] image prompt length:', imagePrompt.length)

    const imageRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: imagePrompt,
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    })

    let imageBytes: string | undefined
    let mimeType = 'image/jpeg'
    const parts = imageRes.candidates?.[0]?.content?.parts ?? []
    for (const part of parts) {
      if (part.inlineData?.data) {
        imageBytes = part.inlineData.data
        mimeType = part.inlineData.mimeType ?? 'image/jpeg'
        break
      }
    }

    if (!imageBytes) {
      console.error('[cover] no image in response, parts:', JSON.stringify(parts).slice(0, 300))
      return NextResponse.json({ error: '이미지 없음' }, { status: 500 })
    }

    const ext = mimeType.includes('png') ? 'png' : 'jpg'

    // Step 3: Supabase Storage에 영구 저장
    try {
      const buffer = Buffer.from(imageBytes, 'base64')
      const fileName = `${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: false,
        })

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('covers').getPublicUrl(fileName)
        console.log('[cover] saved to supabase storage:', urlData.publicUrl)
        return NextResponse.json({ imageUrl: urlData.publicUrl })
      }
      console.error('[cover] supabase upload error:', uploadError)
    } catch (e) {
      console.error('[cover] supabase upload exception:', e)
    }

    // 업로드 실패 시 base64 data URL 폴백
    return NextResponse.json({ imageUrl: `data:${mimeType};base64,${imageBytes}` })
  } catch (e) {
    console.error('[cover] unhandled error:', e)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
