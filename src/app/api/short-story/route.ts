// src/app/api/short-story/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { genre, characterFlaw, goal, conflict, bgmMood } = await req.json()

  if (!genre || !characterFlaw || !goal || !conflict || !bgmMood) {
    return NextResponse.json({ error: '이야기 설정이 부족합니다. 음유시인과 대화를 먼저 완료해주세요.' }, { status: 400 })
  }

  const prompt = `당신은 한국의 정통 순문학 단편소설 작가입니다.
아래 조건을 바탕으로 완성도 높은 단편소설을 창작해주세요.

[창작 조건]
- 장르/톤앤매너: ${genre}
- 주인공의 결핍과 흉터: ${characterFlaw}
- 주인공의 궁극적 목표와 열망: ${goal}
- 핵심 갈등과 장애물: ${conflict}
- 전체 분위기/음악적 톤: ${bgmMood}

[인물 설계]
- 주인공에게 이름과 구체적인 과거(상처, 결핍, 갈망)를 부여하세요. 위에 제시된 결핍과 목표를 충실히 반영하세요
- 주인공의 내면 세계(목소리, 습관, 말투)가 행동과 대화를 통해 자연스럽게 드러나야 합니다
- 주인공의 감정 상태가 발단 → 절정 → 결말로 변화하는 호(arc)를 명확히 그려야 합니다
- 주인공 외 조연 인물 1~2명을 배치해 주인공의 내면을 반사시키세요

[서사 구조]
- 발단: 일상적이고 구체적인 장면에서 시작해 긴장감을 서서히 고조시키세요
- 전개: 갈등과 사건을 통해 주인공의 내면을 충분히 드러내세요. 대화와 행동을 풍부하게 활용하세요
- 위기: 주인공이 내면의 균열을 직면하는 장면을 집중적으로 묘사하세요
- 절정: 주인공이 중요한 선택의 기로에 놓이는 순간을 극적으로 써주세요
- 결말: 명확한 해소 없이, 독자가 오래 생각하게 만드는 열린 결말로 마무리하세요

[문체 지침]
- 분량: 10,000자 내외로 충분히 길게 작성하세요. 절대 짧게 끊지 마세요
- 각 장면을 충분히 묘사하고, 대화와 내면 독백을 균형 있게 배치하세요
- 감각 묘사(청각, 후각, 촉각, 시각)를 곳곳에 배치해 장면을 생생하게 만드세요
- 분위기(${bgmMood})에 맞는 리듬감과 문체를 유지하세요
- 핵심 갈등 소재를 은유 또는 상징으로 발전시켜 주제와 연결하세요
- 마지막 문장은 첫 장면과 호응하거나, 독자에게 잔상을 남기는 이미지로 끝내세요

소설 본문만 출력하세요. 제목, 설명, 부연 일체 금지.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 10000 },
      },
    })
    const story = response.text
    return NextResponse.json({ story })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '소설 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
