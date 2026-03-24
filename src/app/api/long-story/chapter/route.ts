// src/app/api/long-story/chapter/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { atmosphere, wound, direction, tension, resonance,
          chapterId, chapterTitle, chapterSummary, allChapters, characters } = await req.json()

  if (!atmosphere || !chapterId || !chapterTitle || !chapterSummary) {
    return NextResponse.json({ error: '챕터 정보가 부족합니다.' }, { status: 400 })
  }

  const chapters = allChapters as { id: number; title: string; summary: string; content?: string | null }[]

  const writtenChapters = chapters.filter(c => c.content && c.id !== chapterId)
  const pendingChapters = chapters.filter(c => !c.content && c.id !== chapterId)

  const isFirstChapter = writtenChapters.length === 0

  const writtenContext = writtenChapters.length > 0
    ? `[이미 집필된 챕터 — 인물·세계관·문체를 그대로 이어받으세요]\n` +
      writtenChapters.map(c => `제${c.id}장 「${c.title}」\n${c.content}`).join('\n\n---\n\n')
    : ''

  const pendingContext = pendingChapters.length > 0
    ? `[앞으로 쓸 챕터 요약]\n` +
      pendingChapters.map(c => `제${c.id}장 「${c.title}」: ${c.summary}`).join('\n')
    : ''

  type CharacterProfile = { name: string; age: number; occupation: string; personality: string; speech_style: string; core_wound: string; relationships: { name: string; relation: string }[] }
  const characterProfiles = characters as CharacterProfile[] | null

  const characterSheetSection = characterProfiles && characterProfiles.length > 0
    ? `[주요 등장인물 — 반드시 이 설정을 따르세요]\n` +
      characterProfiles.map(c =>
        `• ${c.name} (${c.age}세, ${c.occupation})\n  성격: ${c.personality}\n  말투: ${c.speech_style}\n  핵심 상처: ${c.core_wound}` +
        (c.relationships?.length ? `\n  관계: ${c.relationships.map(r => `${r.name}(${r.relation})`).join(', ')}` : '')
      ).join('\n\n')
    : ''

  const characterSection = characterProfiles && characterProfiles.length > 0
    ? (isFirstChapter
        ? `[인물 지침]\n- 위 캐릭터 시트의 인물들을 소개하며 이야기를 시작하세요.\n- 인물의 성격과 감정은 대사와 행동으로 드러내세요. 직접 설명하지 말고 보여주세요.\n- 인물들 사이의 관계와 거리감이 대화 속에 자연스럽게 배어 나와야 합니다.`
        : `[인물 및 세계관 유지]\n- 집필 전, 이전 챕터들에 등장한 인물 이름·주요 장소·핵심 사건을 먼저 파악한 후 집필하세요.\n- 캐릭터 시트의 인물 설정(이름, 나이, 직업, 말투, 성격)을 반드시 유지하세요.\n- 기존 세계관, 지명, 설정 용어를 그대로 사용하세요.\n- 새로운 조연이나 단역은 이야기 흐름상 자연스럽게 추가 가능합니다.\n- 이전 챕터 마지막 장면에서 자연스럽게 이어지도록 첫 문장을 시작하세요.`)
    : (isFirstChapter
        ? `[인물 설계]\n- 등장인물에게 구체적인 이름, 나이, 직업, 말투를 부여하세요.\n- 인물의 성격과 감정은 대사와 행동으로 드러내세요. 직접 설명하지 말고 보여주세요.\n- 인물들 사이의 관계와 거리감이 대화 속에 자연스럽게 배어 나와야 합니다.`
        : `[인물 및 세계관 유지]\n- 집필 전, 이전 챕터들에 등장한 인물 이름·주요 장소·핵심 사건을 먼저 파악한 후 집필하세요.\n- 이전 챕터에 등장한 주요 인물의 이름, 나이, 직업, 말투, 성격을 그대로 유지하세요.\n- 기존 세계관, 지명, 설정 용어를 그대로 사용하세요.\n- 새로운 조연이나 단역은 이야기 흐름상 자연스럽게 추가 가능합니다.\n- 이전 챕터 마지막 장면에서 자연스럽게 이어지도록 첫 문장을 시작하세요.`)

  const prompt = `당신은 어떤 장르와 스타일도 자유롭게 구사할 수 있는 탁월한 장편소설 작가입니다.
아래 소설 설정과 챕터 정보를 읽고 이 이야기에 가장 잘 어울리는 문체와 리듬으로 제${chapterId}장을 집필해주세요.

[소설 설정]
- 분위기/세계: ${atmosphere}
- 이야기의 핵심 상처: ${wound || '작가의 창작에 맡김'}
- 이야기가 향하는 방향: ${direction || '특별한 목표 없이 흘러가는 이야기'}
- 이야기를 관통하는 긴장: ${tension || '없거나 매우 미약함'}
- 독자에게 남길 울림: ${resonance || '작가의 창작에 맡김'}

${characterSheetSection}

${writtenContext}

${pendingContext}

[현재 집필할 챕터]
제${chapterId}장 「${chapterTitle}」
줄거리: ${chapterSummary}

${characterSection}

[장면과 대화]
- 실제 대화 장면이 전체 분량의 30~40%를 차지해야 합니다.
- 대화는 감정을 직접 설명하지 않으면서도 독자가 그 감정을 느끼게 만들어야 합니다.
- 대화와 대화 사이의 침묵, 행동, 시선, 표정 묘사를 반드시 배치하세요.

[집필 지침]
- 분량: 8,000자 내외로 충분히 길게 작성하세요. 절대 짧게 끊지 마세요.
- 앞 챕터의 흐름을 이어받고 다음 챕터로 자연스럽게 연결하세요.
- 서사(사건 나열)보다 장면(scene)에 집중하세요. 한 장면을 충분히 오래, 느리게 묘사하세요.
- 감각 묘사(냄새, 소리, 촉감, 온도)를 곳곳에 배치하세요.
- 인물의 내면 독백과 대화를 번갈아 배치해 리듬을 만드세요.
- 챕터 마지막은 다음 챕터로 향하는 여운 또는 복선을 남기는 장면으로 끝내세요.

챕터 본문만 출력하세요. 챕터 제목, 번호, 설명 일체 금지.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: isFirstChapter ? 4000 : 8000 },
      },
    })
    return NextResponse.json({ content: response.text })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '챕터 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
