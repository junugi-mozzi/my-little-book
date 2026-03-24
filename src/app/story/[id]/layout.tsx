// src/app/story/[id]/layout.tsx
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Params {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params

  const { data } = await supabase
    .from('library')
    .select('title, type, content, outline, cover_url, genre')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (!data) {
    return {
      title: '루미스의 이야기',
      description: '루미스가 엮은 이야기를 읽어보세요.',
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const pageUrl = `${siteUrl}/story/${id}`
  const title = data.title ?? '루미스가 엮은 이야기'

  type OutlineChapter = { summary?: string }
  const outline = data.outline as OutlineChapter[] | null
  const description =
    data.type === 'short'
      ? ((data.content as string | null) ?? '').slice(0, 120) + '...'
      : (outline?.[0]?.summary ?? `${data.genre} 배경의 장편 이야기`)

  const images = data.cover_url ? [{ url: data.cover_url as string }] : []

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      images,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map(i => i.url),
    },
  }
}

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
