// src/app/api/long-story/chapter/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { atmosphere, wound, direction, tension, resonance,
          chapterId, chapterTitle, chapterSummary, allChapters } = await req.json()

  if (!atmosphere || !chapterId || !chapterTitle || !chapterSummary) {
    return NextResponse.json({ error: '챕터 정보가 부족합니다.' }, { status: 400 })
  }

  const chapterContext = (allChapters as { id: number; title: string; summary: string }[])
    .map(c => `제${c.id}장 「${c.title}」: ${c.summary}`)
    .join('\n')

  const prompt = `당신은 한국의 장편소설 작가입니다.
아래 소설의 제${chapterId}장을 집필해주세요.

[소설 설정]
- 분위기/세계: ${atmosphere}
- 이야기의 핵심 상처: ${wound || '없음 또는 자유롭게'}
- 이야기가 향하는 방향: ${direction || '특별한 목표 없이 흘러가는 이야기'}
- 이야기를 관통하는 긴장: ${tension || '없거나 매우 미약함'}
- 독자에게 남길 울림: ${resonance || '자유롭게'}

[전체 챕터 구성]
${chapterContext}

[현재 집필할 챕터]
제${chapterId}장 「${chapterTitle}」
줄거리: ${chapterSummary}

[집필 지침]
- 분량: 8,000자 내외로 충분히 길게 작성하세요. 절대 짧게 끊지 마세요.
- 앞 챕터의 흐름을 이어받고 다음 챕터로 자연스럽게 연결하세요.
- 인물의 내면 독백, 대화, 감각 묘사(청각·후각·촉각·시각)를 풍부하게 배치하세요.
- 분위기(${atmosphere})에 맞는 리듬감과 문체를 유지하세요.
- 챕터 마지막은 다음 챕터로 향하는 여운 또는 복선을 남기는 장면으로 끝내세요.

챕터 본문만 출력하세요. 챕터 제목, 번호, 설명 일체 금지.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
      },
    })
    return NextResponse.json({ content: response.text })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '챕터 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
