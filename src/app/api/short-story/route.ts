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

  const prompt = `당신은 어떤 장르와 스타일도 자유롭게 구사할 수 있는 탁월한 단편소설 작가입니다.
순문학도, 장르 소설도, 웹소설도, 고전도 — 아래 분위기와 이야기 설정을 읽고 이 이야기에 가장 잘 어울리는 문체와 스타일을 스스로 판단해 창작해주세요.
'정통'이나 '문학적'일 필요는 없습니다. 재미있고, 감정이 살아있고, 읽고 나서 무언가가 남는 이야기가 좋은 이야기입니다.

출력 형식을 반드시 지켜주세요:
- 첫 번째 줄: [TITLE]소설 제목[/TITLE]
- 그 다음 빈 줄 하나
- 그 다음부터 소설 본문 시작

예시:
[TITLE]바람이 기억하는 이름[/TITLE]

소설 본문...

[창작 조건]
- 분위기/세계: ${atmosphere}
- 이야기의 핵심 상처: ${wound || '작가의 창작에 맡김'}
- 이야기가 향하는 방향: ${direction || '특별한 목표 없이 흘러가는 이야기'}
- 이야기를 관통하는 긴장: ${tension || '없거나 매우 미약함'}
- 독자에게 남길 울림: ${resonance || '작가의 창작에 맡김'}

[인물 설계]
- 등장인물에게 구체적인 이름, 나이, 직업, 말투를 부여하세요.
- 인물의 성격과 감정은 대사와 행동으로 드러내세요. 직접 설명하지 말고 보여주세요.
- 인물들 사이의 관계와 거리감이 대화 속에 자연스럽게 배어 나와야 합니다.

[장면과 대화]
- 이야기에는 반드시 2인 이상의 인물이 등장하며, 실제 대화 장면이 전체 분량의 30~40%를 차지해야 합니다.
- 대화는 감정을 직접 설명하지 않으면서도 독자가 그 감정을 느끼게 만들어야 합니다.
- 대화와 대화 사이의 침묵, 행동, 시선, 표정 묘사를 반드시 배치하세요.
- 대사 한 줄이 끝난 뒤 — 인물이 어디를 보는지, 무엇을 만지는지, 어떤 소리가 들리는지 — 그 여백이 이야기를 살립니다.

[문체와 리듬]
- 분량: 10,000자 내외로 충분히 길게 작성하세요.
- 첫 단락은 반드시 공간과 감각 묘사로 시작하세요. 독자가 그 장소의 공기를 먼저 느끼게 한 뒤 인물을 등장시키세요.
- 서사(사건 나열)보다 장면(scene)에 집중하세요. 한 장면을 충분히 오래, 느리게 묘사하세요.
- 감각 묘사(냄새, 소리, 촉감, 온도)를 곳곳에 배치하세요.
- 인물의 내면 독백과 대화를 번갈아 배치해 리듬을 만드세요.
- 마지막 문장은 첫 장면과 호응하거나, 독자 가슴에 잔상을 남기는 이미지나 대사로 끝내세요.
- 결말은 명확히 해소되지 않아도 됩니다. 독자가 책을 덮은 뒤에도 계속 생각하게 만드세요.

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
