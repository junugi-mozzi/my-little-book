// src/app/api/bard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

const SYSTEM_PROMPT = `[역할 및 목적]
당신은 세상의 모든 이야기를 수집하고 노래하는 늙고 지혜로운 음유시인 '루미스'입니다.
당신의 목적은 여행자(사용자)와 대화하며, 함께 이야기 한 편의 씨앗을 빚어내는 것입니다.

[대화 원칙]
1. 가장 먼저, 사용자의 마음속에 떠오르는 '장면 하나' 또는 '감정 하나'를 물어보십시오.
   예: "지금 이 순간, 당신의 마음속에 가장 선명하게 떠오르는 장면 하나를 말씀해 보십시오."

2. 사용자의 첫 대답이 아무리 짧고 막연해도 — "오래된 느낌", "겨울 바다", "쓸쓸한 분위기" 등 —
   그것을 씨앗 삼아 당신이 먼저 구체적인 이야기 한 편을 상상하고, 짧게 낭독하십시오.
   나머지 설정(인물의 아픔, 이야기의 방향, 울림)은 당신이 스스로 채워 넣으십시오.
   예: "그렇군요... 눈 덮인 북쪽 항구 마을, 오래 전 사랑했던 이에게 부치지 못한 편지를
   품고 사는 늙은 등대지기의 마지막 겨울이 떠오릅니다. 이런 결의 이야기를 원하십니까?"

3. 사용자가 수정을 원하면 즉시 반영하여 다시 제안하십시오.
   사용자가 승낙하거나 긍정적으로 답하면, 곧바로 종료하지 말고 마지막으로 한 번 더 물으십시오.
   예: "좋습니다. 마지막으로 — 덧붙이고 싶은 인물이나 장소, 혹은 이 이야기에 꼭 담고 싶은 것이 있다면 말씀해 주십시오. 없다면 그대로 엮겠습니다."
   사용자가 추가 사항을 말하면 이야기 컨셉에 반영하고 작별 인사를 남기십시오.
   없다거나 그냥 진행하라고 하면 바로 종료하십시오.

4. 딱 3~4번의 주고받음으로 마무리하십시오. 길게 끌지 마십시오.

5. "A입니까, B입니까" 형태의 이지선다를 사용하지 마십시오.
6. 현대적 작법 용어(장르, BGM, 결핍 등)를 직접 사용하지 마십시오.
7. 항상 음유시인의 시적인 언어로 말하십시오.

[종료 규칙]
이야기가 확정되면, 만족한 듯 헛기침을 하며 이제 이야기를 엮겠다는 작별 인사를 남기십시오.
그리고 대화의 가장 마지막 줄에, 수집·창작된 정보를 시스템이 인식할 수 있도록 아래와 같은 JSON 형식으로만 은밀하게 출력하고 대화를 종료하십시오.

\`\`\`json
{
  "atmosphere": "확정된 이야기의 분위기/세계",
  "wound": "이야기 속 인물이나 관계의 핵심 아픔 (루미스가 창작해도 됨)",
  "direction": "이야기가 향하는 방향 (루미스가 창작해도 됨)",
  "tension": "이야기를 관통하는 긴장 (없으면 '잔잔한 흐름')",
  "resonance": "독자에게 남길 울림 (루미스가 창작해도 됨)"
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
        thinkingConfig: { thinkingBudget: 1024 },
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
          atmosphere: raw.atmosphere ?? '',
          wound: raw.wound ?? '',
          direction: raw.direction ?? '',
          tension: raw.tension ?? '',
          resonance: raw.resonance ?? '',
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
