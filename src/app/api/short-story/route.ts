// src/app/api/short-story/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { atmosphere, wound, direction, tension, resonance } = await req.json()

  if (!atmosphere) {
    return NextResponse.json({ error: '이야기 설정이 부족합니다. 음유시인과 대화를 먼저 완료해주세요.' }, { status: 400 })
  }

  const prompt = `당신은 한국의 정통 순문학 단편소설 작가입니다.
아래 조건을 바탕으로 완성도 높은 단편소설을 창작해주세요.

출력 형식을 반드시 지켜주세요:
- 첫 번째 줄: [TITLE]소설 제목[/TITLE]
- 그 다음 빈 줄 하나
- 그 다음부터 소설 본문 시작

예시:
[TITLE]바람이 기억하는 이름[/TITLE]

소설 본문...

[창작 조건]
- 분위기/세계: ${atmosphere}
- 이야기의 핵심 상처: ${wound || '없음 또는 루미스의 창작에 맡김'}
- 이야기가 향하는 방향: ${direction || '특별한 목표 없이 흘러가는 이야기'}
- 이야기를 관통하는 긴장: ${tension || '없거나 매우 미약함'}
- 독자에게 남길 울림: ${resonance || '루미스의 창작에 맡김'}

[인물 설계]
- 이야기에 등장하는 인물(들)에게 구체적인 이름과 배경을 부여하세요. 위의 조건을 충실히 반영하세요.
- 인물의 내면 세계(목소리, 습관, 말투)가 행동과 대화를 통해 자연스럽게 드러나야 합니다.
- 인물이 여럿이거나 명확하지 않아도 좋습니다. 분위기와 감정의 흐름이 중심입니다.
- 조연 인물이나 풍경, 오브제가 이야기의 분위기를 반사하게 활용하세요.

[서사 구조]
- 발단: 반드시 세계와 공간의 분위기부터 감각적으로 묘사하며 시작하세요. 독자가 이야기의 시간과 장소 속으로 서서히 걸어 들어오게 한 뒤에 인물을 등장시키세요. 사건이나 대화로 곧장 시작하지 마세요. 첫 단락은 반드시 배경 묘사입니다.
- 전개: 이야기의 흐름과 감정을 통해 세계를 충분히 드러내세요. 대화와 행동을 풍부하게 활용하세요.
- 위기: 이야기의 핵심 상처나 긴장이 수면 위로 떠오르는 장면을 집중적으로 묘사하세요.
- 절정: 이야기의 방향이 하나의 순간으로 수렴하는 장면을 극적으로 써주세요.
- 결말: 명확한 해소 없이, 독자가 오래 생각하게 만드는 열린 결말로 마무리하세요.

[문체 지침]
- 분량: 10,000자 내외로 충분히 길게 작성하세요. 절대 짧게 끊지 마세요.
- 각 장면을 충분히 묘사하고, 대화와 내면 독백을 균형 있게 배치하세요.
- 감각 묘사(청각, 후각, 촉각, 시각)를 곳곳에 배치해 장면을 생생하게 만드세요.
- 분위기(${atmosphere})에 맞는 리듬감과 문체를 유지하세요.
- 이야기의 핵심 상처나 긴장을 은유 또는 상징으로 발전시켜 주제와 연결하세요.
- 마지막 문장은 첫 장면과 호응하거나, 독자에게 잔상을 남기는 이미지로 끝내세요.

소설 본문만 출력하세요. 제목, 설명, 부연 일체 금지.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 5000 },
      },
    })
    const raw = response.text ?? ''
    const titleMatch = raw.match(/\[TITLE\](.*?)\[\/TITLE\]/)
    const title = titleMatch ? titleMatch[1].trim() : ''
    const story = raw.replace(/\[TITLE\].*?\[\/TITLE\]\n?\n?/, '').trimStart()
    return NextResponse.json({ story, title })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '소설 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
