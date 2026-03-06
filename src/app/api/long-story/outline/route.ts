// src/app/api/long-story/outline/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import type { Chapter } from '@/store/storyStore'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

export async function POST(req: NextRequest) {
  const { atmosphere, wound, direction, tension, resonance } = await req.json()

  if (!atmosphere) {
    return NextResponse.json({ error: '이야기 설정이 부족합니다. 음유시인과 대화를 먼저 완료해주세요.' }, { status: 400 })
  }

  const prompt = `당신은 한국의 장편소설 작가입니다. 아래 조건에 맞는 장편소설의 챕터 아웃라인을 생성해주세요.

조건:
- 분위기/세계: ${atmosphere}
- 이야기의 핵심 상처: ${wound || '없음 또는 자유롭게 설정'}
- 이야기가 향하는 방향: ${direction || '특별한 목표 없이 흘러가는 이야기'}
- 이야기를 관통하는 긴장: ${tension || '없거나 매우 미약함'}
- 독자에게 남길 울림: ${resonance || '자유롭게 설정'}

소설 제목과 5개 챕터의 아웃라인을 JSON 객체로만 출력하세요. 다른 텍스트는 포함하지 마세요.

출력 형식:
{
  "title": "소설 제목",
  "outline": [
    {"id": 1, "title": "챕터 제목", "summary": "100자 내외의 줄거리 요약"},
    ...
  ]
}

각 챕터는 이야기의 상처(${wound || '없음'})와 방향(${direction || '일상의 흐름'}) 사이의 흐름을 중심으로 구성하고, 긴장(${tension || '없음'})이 자연스럽게 깊어져야 합니다. 분위기는 ${atmosphere}, 울림은 ${resonance || '독자의 감성에 맡김'}를 유지하세요.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    })
    const raw = response.text ?? ''
    const parsed = JSON.parse(raw)
    const chapters: Chapter[] = parsed.outline.map((c: Omit<Chapter, 'status'>) => ({
      ...c,
      status: 'pending' as const,
    }))
    return NextResponse.json({ outline: chapters, title: parsed.title ?? '' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '아웃라인 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
