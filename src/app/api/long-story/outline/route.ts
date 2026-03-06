// src/app/api/long-story/outline/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import type { Chapter } from '@/store/storyStore'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

export async function POST(req: NextRequest) {
  const { genre, characterFlaw, goal, conflict, bgmMood } = await req.json()

  if (!genre || !characterFlaw || !goal || !conflict || !bgmMood) {
    return NextResponse.json({ error: '이야기 설정이 부족합니다. 음유시인과 대화를 먼저 완료해주세요.' }, { status: 400 })
  }

  const prompt = `당신은 한국의 장편소설 작가입니다. 아래 조건에 맞는 장편소설의 챕터 아웃라인을 생성해주세요.

조건:
- 장르/톤앤매너: ${genre}
- 주인공의 결핍과 흉터: ${characterFlaw}
- 주인공의 궁극적 목표와 열망: ${goal}
- 핵심 갈등과 장애물: ${conflict}
- 전체 분위기/음악적 톤: ${bgmMood}

5개 챕터의 아웃라인을 JSON 배열로만 출력하세요. 다른 텍스트는 포함하지 마세요.

출력 형식:
[
  {"id": 1, "title": "챕터 제목", "summary": "100자 내외의 줄거리 요약"},
  ...
]

각 챕터는 주인공의 결핍(${characterFlaw})과 목표(${goal}) 사이의 긴장을 중심으로 구성하고, 핵심 갈등(${conflict})이 자연스럽게 고조되어야 합니다. 분위기는 ${bgmMood}를 유지하세요.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    })
    const raw = response.text ?? ''
    const chapters: Chapter[] = JSON.parse(raw).map((c: Omit<Chapter, 'status'>) => ({
      ...c,
      status: 'pending' as const,
    }))
    return NextResponse.json({ outline: chapters })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '아웃라인 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
