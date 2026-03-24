// src/app/api/long-story/characters/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

export async function POST(req: NextRequest) {
  const { atmosphere, wound, direction, tension, resonance, outline } = await req.json()

  if (!atmosphere || !outline) {
    return NextResponse.json({ error: '설정이 부족합니다.' }, { status: 400 })
  }

  const outlineText = (outline as { id: number; title: string; summary: string }[])
    .map(c => `제${c.id}장 「${c.title}」: ${c.summary}`)
    .join('\n')

  const prompt = `당신은 탁월한 소설 기획자입니다.
아래 소설 설정과 전체 챕터 구성을 읽고, 이 이야기에 등장할 주요 인물 3~5명을 설계해주세요.

[소설 설정]
- 분위기/세계: ${atmosphere}
- 이야기의 핵심 상처: ${wound || '없음'}
- 이야기가 향하는 방향: ${direction || '없음'}
- 이야기를 관통하는 긴장: ${tension || '없음'}
- 독자에게 남길 울림: ${resonance || '없음'}

[전체 챕터 구성]
${outlineText}

[설계 원칙]
- 이 이야기의 분위기와 서사에 자연스럽게 어울리는 인물을 설계하세요.
- 각 인물은 고유한 이름, 나이, 직업, 성격, 말투를 가져야 합니다.
- 인물 간 관계(주인공과의 관계 등)를 명확히 설정하세요.
- 인물의 핵심 상처나 동기가 이야기 전체 흐름과 연결되어야 합니다.

JSON 배열만 출력하세요. 다른 텍스트는 포함하지 마세요.

출력 형식:
[
  {
    "name": "인물 이름",
    "age": 나이(숫자),
    "occupation": "직업",
    "personality": "성격 묘사 (2~3문장)",
    "speech_style": "말투 묘사 (1~2문장)",
    "appearance": "외모 묘사 (1~2문장)",
    "core_wound": "이 인물의 핵심 상처 또는 동기",
    "relationships": [{"name": "다른 인물 이름", "relation": "관계 설명"}]
  }
]`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    })
    const raw = response.text ?? '[]'
    const characters = JSON.parse(raw)
    return NextResponse.json({ characters })
  } catch (e) {
    console.error('[characters]', e)
    return NextResponse.json({ error: '캐릭터 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
