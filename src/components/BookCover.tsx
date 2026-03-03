// src/components/BookCover.tsx

interface BookCoverProps {
  genre: string
  era: string
  mood: string
  size?: 'sm' | 'md' | 'lg'
}

interface ColorScheme {
  from: string
  to: string
  border: string
  accent: string
  text: string
  sub: string
}

const GENRE_MAP: { keywords: string[]; colors: ColorScheme }[] = [
  {
    keywords: ['판타지', 'fantasy', '마법', '마도'],
    colors: {
      from: '#2a1550', to: '#0e0720',
      border: '#7b5fbf', accent: '#a07de0',
      text: '#d9bfff', sub: '#9b7fd4',
    },
  },
  {
    keywords: ['로맨스', 'romance', '사랑', '연애'],
    colors: {
      from: '#4a1020', to: '#1e040c',
      border: '#bf5f7b', accent: '#e08099',
      text: '#ffc4d4', sub: '#c47088',
    },
  },
  {
    keywords: ['미스터리', 'mystery', '추리', '탐정'],
    colors: {
      from: '#0d2b2b', to: '#050f0f',
      border: '#3d9090', accent: '#5ab8b8',
      text: '#9ee8e8', sub: '#4a9999',
    },
  },
  {
    keywords: ['공포', 'horror', '스릴러', '괴담'],
    colors: {
      from: '#200808', to: '#0a0202',
      border: '#8b2020', accent: '#b83030',
      text: '#ffaaaa', sub: '#993030',
    },
  },
  {
    keywords: ['sf', 'sci-fi', '우주', '미래', '사이버'],
    colors: {
      from: '#0a1a33', to: '#030810',
      border: '#3060b0', accent: '#4d80d4',
      text: '#a0c0ff', sub: '#3d6699',
    },
  },
  {
    keywords: ['역사', '사극', '중세', '고대', '조선', '무협'],
    colors: {
      from: '#1f1200', to: '#0a0700',
      border: '#8d6e33', accent: '#b8902a',
      text: '#e0c070', sub: '#a07828',
    },
  },
]

function getColors(genre: string): ColorScheme {
  const g = genre.toLowerCase()
  for (const entry of GENRE_MAP) {
    if (entry.keywords.some(k => g.includes(k))) {
      return entry.colors
    }
  }
  return {
    from: '#2d1a08', to: '#100900',
    border: '#8d6e33', accent: '#b8923a',
    text: '#d4b483', sub: '#a07840',
  }
}

const SIZE_MAP = {
  sm: { width: 80, height: 120, titleSize: '7px', subSize: '5.5px', emblemSize: '9px' },
  md: { width: 140, height: 210, titleSize: '13px', subSize: '9px', emblemSize: '15px' },
  lg: { width: 180, height: 270, titleSize: '16px', subSize: '11px', emblemSize: '19px' },
}

export default function BookCover({ genre, era, mood, size = 'md' }: BookCoverProps) {
  const c = getColors(genre)
  const s = SIZE_MAP[size]

  return (
    <div
      style={{
        width: s.width,
        height: s.height,
        background: `linear-gradient(160deg, ${c.from}, ${c.to})`,
        border: `1.5px solid ${c.border}`,
        borderRadius: 4,
        boxShadow: `3px 4px 18px rgba(0,0,0,0.7), inset 0 0 20px rgba(0,0,0,0.4), -2px 0 0 ${c.border}44`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: size === 'sm' ? '8px 6px' : '16px 12px',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* 내부 광택 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 70% 50% at 30% 20%, ${c.accent}18, transparent)`,
        pointerEvents: 'none',
      }} />
      {/* 세로 줄무늬 (고서 질감) */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 3px, ${c.border}08 3px, ${c.border}08 4px)`,
        pointerEvents: 'none',
      }} />

      {/* 상단 장식 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%', opacity: 0.7 }}>
        <div style={{ flex: 1, height: 1, background: c.accent }} />
        <span style={{ color: c.accent, fontSize: s.emblemSize }}>✦</span>
        <div style={{ flex: 1, height: 1, background: c.accent }} />
      </div>

      {/* 중앙 텍스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: size === 'sm' ? 2 : 5, textAlign: 'center' }}>
        <span style={{ color: c.sub, fontSize: s.subSize, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {era}
        </span>
        <span style={{
          color: c.text, fontSize: s.titleSize, fontWeight: 'bold',
          letterSpacing: '0.05em', lineHeight: 1.3,
          textShadow: `0 0 10px ${c.accent}66`,
        }}>
          {genre}
        </span>
        <div style={{ width: '60%', height: 1, background: c.border, opacity: 0.5 }} />
        <span style={{ color: c.sub, fontSize: s.subSize, letterSpacing: '0.1em', fontStyle: 'italic' }}>
          {mood}
        </span>
      </div>

      {/* 엠블럼 */}
      <div style={{ display: 'flex', gap: size === 'sm' ? 3 : 6, opacity: 0.55 }}>
        <span style={{ color: c.accent, fontSize: s.emblemSize }}>✦</span>
        <span style={{ color: c.accent, fontSize: s.emblemSize }}>✧</span>
        <span style={{ color: c.accent, fontSize: s.emblemSize }}>✦</span>
      </div>

      {/* 하단 장식 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%', opacity: 0.7 }}>
        <div style={{ flex: 1, height: 1, background: c.accent }} />
        <span style={{ color: c.accent, fontSize: s.emblemSize }}>✦</span>
        <div style={{ flex: 1, height: 1, background: c.accent }} />
      </div>
    </div>
  )
}
