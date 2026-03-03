// src/app/api/long-story/outline/route.ts
import { NextRequest, NextResponse } from 'next/server'
import type { Chapter } from '@/store/storyStore'

export async function POST(req: NextRequest) {
  const { genre, era, mood, keywords } = await req.json()

  if (!genre || !era || !mood || !keywords) {
    return NextResponse.json({ error: '장르, 시대, 분위기, 키워드를 모두 입력해주세요.' }, { status: 400 })
  }

  // TODO: AI 모델 연동 후 실제 아웃라인 생성 로직으로 교체
  const mockOutline: Chapter[] = [
    { id: 1, title: '별의 부름', summary: '주인공이 신비한 류트를 발견한다.', status: 'pending' },
    { id: 2, title: '달빛 아래의 여정', summary: '첫 번째 마을을 떠나 밤의 숲으로 향한다.', status: 'pending' },
    { id: 3, title: '잊혀진 선율', summary: '고대 음유시인의 악보를 손에 넣는다.', status: 'pending' },
  ]

  return NextResponse.json({ outline: mockOutline })
}
