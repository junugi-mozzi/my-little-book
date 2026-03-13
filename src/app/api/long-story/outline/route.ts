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

  const prompt = `당신은 어떤 장르와 스타일도 자유롭게 구사할 수 있는 탁월한 장편소설 작가입니다.
순문학도, 장르 소설도, 웹소설도, 고전도 — 아래 분위기와 이야기 설정을 읽고 이 이야기에 가장 잘 어울리는 구조와 챕터 흐름을 스스로 판단해 구성해주세요.

[소설 설정]
- 분위기/세계: ${atmosphere}
- 이야기의 핵심 상처: ${wound || '작가의 창작에 맡김'}
- 이야기가 향하는 방향: ${direction || '특별한 목표 없이 흘러가는 이야기'}
- 이야기를 관통하는 긴장: ${tension || '없거나 매우 미약함'}
- 독자에게 남길 울림: ${resonance || '작가의 창작에 맡김'}

[구성 원칙]
- 각 챕터는 단순한 사건 요약이 아니라, 그 챕터에서 독자가 느낄 감정의 결과 핵심 장면을 담아야 합니다.
- 긴장은 챕터를 거듭할수록 자연스럽게 쌓이거나 혹은 잔잔히 흘러가게 구성하세요.
- 마지막 챕터는 울림(${resonance || '독자의 감성에 맡김'})이 남도록 열린 결말이어도 됩니다.

소설 제목과 5개 챕터의 아웃라인을 JSON 객체로만 출력하세요. 다른 텍스트는 포함하지 마세요.

출력 형식:
{
  "title": "소설 제목",
  "outline": [
    {"id": 1, "title": "챕터 제목", "summary": "100자 내외의 줄거리 요약"},
    ...
  ]
}`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    })
    const raw = response.text ?? ''
    const parsed = JSON.parse(raw)
    const chapters: Chapter[] = (parsed.outline ?? []).map((c: Record<string, unknown>, i: number) => ({
      id: typeof c.id === 'number' ? c.id : i + 1,
      title: typeof c.title === 'string' ? c.title : `챕터 ${i + 1}`,
      summary: typeof c.summary === 'string' ? c.summary : '',
      status: 'pending' as const,
    }))
    return NextResponse.json({ outline: chapters, title: parsed.title ?? '' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '아웃라인 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
