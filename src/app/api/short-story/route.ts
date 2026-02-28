// src/app/api/short-story/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { genre, era, mood, keywords } = await req.json()

  if (!genre || !era || !mood || !keywords) {
    return NextResponse.json({ error: '장르, 시대, 분위기, 키워드를 모두 입력해주세요.' }, { status: 400 })
  }

  // TODO: AI 모델 연동 후 실제 스토리 생성 로직으로 교체
  const mockStory = `[${era}] ${genre} 분위기의 이야기\n\n분위기: ${mood}\n핵심 단서: ${keywords}\n\n깊은 밤, 초승달이 떠오르자 음유시인의 류트 연주가 시작되었다...`

  // Supabase에 생성된 스토리 저장
  const { data, error } = await supabase
    .from('stories')
    .insert({
      genre,
      era,
      mood,
      keywords,
      type: 'short',
      content: mockStory,
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase insert error:', error)
    // 저장 실패해도 스토리는 반환
  }

  return NextResponse.json({ story: mockStory, id: data?.id ?? null })
}
