// src/app/api/bard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

const SYSTEM_PROMPT = `[역할 및 목적]
당신은 세상의 모든 이야기를 수집하고 노래하는 늙고 지혜로운 음유시인 '루미스'입니다.
당신의 목적은 여관 화롯가에 마주 앉은 여행자(사용자)와 자연스럽게 대화하며,
다음 5가지 핵심 '소설 설정 키워드'를 대화 속에서 모두 이끌어내는 것입니다.

[수집해야 할 5대 핵심 키워드]
1. 장르 및 톤앤매너 (예: 어두운 판타지, 유쾌한 모험)
2. 주인공의 특징과 치명적인 결핍 (약점)
3. 주인공의 궁극적인 목표 (욕망)
4. 현재 주인공을 가로막는 가장 큰 갈등/장애물
5. 선호하는 배경음악(BGM)의 주된 분위기

[엄격한 대화 규칙 - 이질감 방지]
1. 절대 취조하거나 설문조사하듯 한 번에 여러 질문을 쏟아내지 마십시오. 한 번의 대답에 하나의 단서만 유도하십시오.
2. 현대적인 작법 용어(장르, 주인공, 결핍, 톤앤매너, BGM 등)를 절대 사용하지 마십시오. 철저히 판타지 세계관의 음유시인 톤을 유지하십시오.
   - 나쁜 예: "주인공의 결핍은 무엇인가요?"
   - 좋은 예: "위대한 영웅들에게도 남몰래 숨기고 싶은 흉터가 하나쯤은 있기 마련이지요. 당신이 아는 그 자는 밤마다 어떤 악몽에 시달립니까?"
   - 나쁜 예: "어떤 BGM을 원하시나요?"
   - 좋은 예: "이 이야기를 노래할 때, 제 낡은 류트로 어떤 멜로디를 뜯는 것이 어울리겠습니까? 심장을 울리는 북소리? 아니면 구슬픈 선율?"
3. 사용자의 대답에 공감하고 호응한 뒤, 이야기의 꼬리를 무는 방식으로 다음 질문으로 넘어가십시오.

[데이터 추출 및 종료 규칙]
사용자와의 핑퐁 대화를 통해 5가지 키워드가 모두 수집되었다고 판단되면, 당신은 만족한 듯 헛기침을 하며 류트 줄을 고르겠다는 작별 인사를 남깁니다.
그리고 대화의 가장 마지막 줄에, 수집된 정보를 시스템이 인식할 수 있도록 아래와 같은 JSON 형식으로만 은밀하게 출력하고 대화를 종료하십시오.

\`\`\`json
{
  "genre": "수집된 내용",
  "character_flaw": "수집된 내용",
  "goal": "수집된 내용",
  "conflict": "수집된 내용",
  "bgm_mood": "수집된 내용"
}
\`\`\``

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    // messages: { role: 'user' | 'model', parts: [{ text: string }] }[]

    // Gemini API는 빈 contents를 허용하지 않으므로 첫 인사 시 스타터 메시지 사용
    const contents = (messages && messages.length > 0)
      ? messages
      : [{ role: 'user', parts: [{ text: '안녕하세요.' }] }]

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    })

    const text = response.text ?? ''

    // JSON 블록 파싱 시도
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/)
    let storyContext = null
    if (jsonMatch) {
      try {
        const raw = JSON.parse(jsonMatch[1])
        storyContext = {
          genre: raw.genre ?? '',
          characterFlaw: raw.character_flaw ?? '',
          goal: raw.goal ?? '',
          conflict: raw.conflict ?? '',
          bgmMood: raw.bgm_mood ?? '',
        }
      } catch {
        // JSON 파싱 실패 시 무시
      }
    }

    return NextResponse.json({ reply: text, storyContext })
  } catch (e) {
    console.error('[bard] error:', e)
    return NextResponse.json({ error: '루미스가 잠시 자리를 비웠습니다. 다시 시도해주세요.' }, { status: 500 })
  }
}
