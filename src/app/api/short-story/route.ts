// src/app/api/short-story/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { genre, era, mood, keywords } = await req.json()

  if (!genre || !era || !mood || !keywords) {
    return NextResponse.json({ error: '장르, 시대, 분위기, 키워드를 모두 입력해주세요.' }, { status: 400 })
  }

  // TODO: AI 모델 연동 후 실제 스토리 생성 로직으로 교체
  const mockStory = `[${era}] ${genre} 분위기의 이야기\n\n분위기: ${mood}\n핵심 단서: ${keywords}\n\n깊은 밤, 초승달이 떠오르자 음유시인의 류트 연주가 시작되었다...`

  return NextResponse.json({ story: mockStory })
}
