'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useBGMStore } from '@/store/bgmStore'

interface MedievalHeroProps {
  onEnter: () => void
}

// 중세 도서관 / 고서 / 마도서 테마 이미지
const BOOK_IMAGES = [
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=600&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=70",
]

const FADE_IN = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 80, damping: 20 },
  },
}

const ROTATE_OFFSETS = [-2.5, 1.8, -1.2, 2.5, -3, 1.5, -2, 2]

const CHARS = ['✦', '✧', '⋆', '·', '✺']

interface Particle {
  id: number
  x: number
  y: number
  char: string
  size: number
  dx: number
  dy: number
  duration: number
}

export default function MedievalHero({ onEnter }: MedievalHeroProps) {
  const duplicated = [...BOOK_IMAGES, ...BOOK_IMAGES]
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { muted } = useBGMStore()

  const [particles, setParticles] = useState<Particle[]>([])
  const lastTimeRef = useRef(0)
  const counterRef = useRef(0)

  const handleMouseMove = (e: React.MouseEvent) => {
    const now = Date.now()
    if (now - lastTimeRef.current < 40) return
    lastTimeRef.current = now

    const rect = e.currentTarget.getBoundingClientRect()
    const particle: Particle = {
      id: counterRef.current++,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      char: CHARS[Math.floor(Math.random() * CHARS.length)],
      size: 8 + Math.random() * 6,
      dx: (Math.random() - 0.5) * 30,
      dy: 20 + Math.random() * 25,
      duration: 0.7 + Math.random() * 0.5,
    }
    setParticles(prev => [...prev.slice(-30), particle])
  }

  useEffect(() => {
    const audio = new Audio('/bgm/mainpagebgm-hero.mp3')
    audio.loop = true
    audio.volume = 0
    audioRef.current = audio

    const startFadeIn = () => {
      let vol = 0
      fadeTimerRef.current = setInterval(() => {
        vol = Math.min(vol + 0.01, 0.35)
        audio.volume = vol
        if (vol >= 0.35) {
          clearInterval(fadeTimerRef.current!)
          fadeTimerRef.current = null
        }
      }, 60)
    }

    audio.play().then(startFadeIn).catch(() => {
      // 자동재생 차단 → 첫 인터랙션 시 재생
      const onInteraction = () => {
        audio.play().then(startFadeIn).catch(() => {})
        document.removeEventListener('click', onInteraction)
        document.removeEventListener('keydown', onInteraction)
        document.removeEventListener('touchstart', onInteraction)
      }
      document.addEventListener('click', onInteraction)
      document.addEventListener('keydown', onInteraction)
      document.addEventListener('touchstart', onInteraction)
    })

    return () => {
      if (fadeTimerRef.current) clearInterval(fadeTimerRef.current)
      let v = audio.volume
      const fadeOut = setInterval(() => {
        v = Math.max(v - 0.03, 0)
        audio.volume = v
        if (v <= 0) {
          clearInterval(fadeOut)
          audio.pause()
          audio.src = ''
        }
      }, 40)
    }
  }, [])

  // 스토어 muted 상태를 오디오에 동기화
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted
  }, [muted])

  return (
    <motion.section
      key="hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.4 } }}
      transition={{ duration: 0.6 }}
      className="relative w-full min-h-screen overflow-hidden bg-[#1a1412] flex flex-col items-center justify-center text-center px-4 font-serif"
      onMouseMove={handleMouseMove}
    >
      {/* 별가루 파티클 */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.span
            key={p.id}
            initial={{ opacity: 0.9, x: p.x, y: p.y, scale: 1 }}
            animate={{ opacity: 0, x: p.x + p.dx, y: p.y + p.dy, scale: 0.3 }}
            exit={{}}
            transition={{ duration: p.duration, ease: 'easeOut' }}
            onAnimationComplete={() =>
              setParticles(prev => prev.filter(pp => pp.id !== p.id))
            }
            className="absolute pointer-events-none select-none text-[#d4b483] z-30"
            style={{ fontSize: p.size, left: 0, top: 0, translateX: '-50%', translateY: '-50%' }}
          >
            {p.char}
          </motion.span>
        ))}
      </AnimatePresence>

      {/* 캔들라이트 방사형 광원 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_38%,_rgba(180,118,36,0.18),_transparent)] pointer-events-none" />
      {/* 양피지 질감 */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-wall.png')" }}
      />
      {/* 상단 가장자리 어두운 비네트 */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0e0a08] to-transparent pointer-events-none" />

      {/* 상단 장식 룬 */}
      <div className="absolute top-7 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-45">
        <div className="w-28 h-px bg-[#d4b483]" />
        <span className="text-[#d4b483] text-sm tracking-[0.5em]">✦</span>
        <div className="w-28 h-px bg-[#d4b483]" />
      </div>

      {/* ── 메인 텍스트 영역 ── */}
      <div className="z-10 flex flex-col items-center max-w-2xl pb-44">

        {/* 태그라인 뱃지 */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d4b483]/40 bg-[#3e2723]/70 px-5 py-2 text-xs tracking-[0.22em] text-[#d4b483] backdrop-blur-sm uppercase"
        >
          <span className="opacity-60">✦</span>
          별빛 도서관 · 이야기 제작소
          <span className="opacity-60">✦</span>
        </motion.div>

        {/* 메인 타이틀 (단어별 stagger) */}
        <motion.h1
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="text-5xl md:text-7xl font-bold text-[#f4e4bc] leading-[1.15] tracking-tight"
        >
          {['나만의', '이야기를', '펼쳐라'].map((word, i) => (
            <motion.span
              key={i}
              variants={FADE_IN}
              className="inline-block mr-3 last:mr-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* 황금 구분선 */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.38, duration: 0.6, ease: 'easeOut' }}
          className="mt-6 flex items-center gap-3"
        >
          <div className="w-20 h-px bg-[#d4b483]/55" />
          <span className="text-[#d4b483]/65 text-sm">⟡</span>
          <div className="w-20 h-px bg-[#d4b483]/55" />
        </motion.div>

        {/* 설명 */}
        <motion.p
          initial="hidden"
          animate="show"
          variants={FADE_IN}
          transition={{ delay: 0.45 }}
          className="mt-5 text-base md:text-lg leading-loose text-[#a1887f] max-w-sm"
        >
          음유시인과 함께 당신만의 이야기를 엮어보세요.
          <br />
          <span className="text-[#d4b483]/85">장르, 시대, 분위기</span>를 속삭이면
          <br />
          당신의 이야기가 스스로 살아납니다.
        </motion.p>

        {/* CTA 버튼 */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN}
          transition={{ delay: 0.6 }}
          className="mt-10"
        >
          <motion.button
            onClick={onEnter}
            whileHover={{
              scale: 1.04,
              boxShadow: '0 0 30px rgba(212,180,131,0.22)',
            }}
            whileTap={{ scale: 0.97 }}
            className="px-10 py-4 bg-[#8d6e63] hover:bg-[#795548] border border-[#5d4037] text-[#f4e4bc] text-lg font-bold tracking-[0.18em] shadow-[0_4px_22px_rgba(0,0,0,0.65)] transition-colors rounded-sm"
          >
            나의 책장을 열다
          </motion.button>
        </motion.div>
      </div>

      {/* ── 하단 이미지 마키 ── */}
      <div
        className="absolute bottom-0 left-0 w-full h-[40%] pointer-events-none overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 28%, black 78%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 28%, black 78%, transparent 100%)',
        }}
      >
        <motion.div
          className="flex gap-4 h-full items-end pb-2"
          style={{ width: 'max-content' }}
          animate={{ x: ['0%', '-50%'] }}
          transition={{ ease: 'linear', duration: 38, repeat: Infinity }}
        >
          {duplicated.map((src, i) => (
            <div
              key={i}
              className="relative h-44 md:h-56 aspect-[3/4] flex-shrink-0"
              style={{ transform: `rotate(${ROTATE_OFFSETS[i % ROTATE_OFFSETS.length]}deg)` }}
            >
              <img
                src={src}
                alt={`고서 ${i + 1}`}
                className="w-full h-full object-cover rounded-xl border border-[#5d4037]/50 shadow-[0_8px_24px_rgba(0,0,0,0.75)]"
                style={{ filter: 'sepia(0.5) brightness(0.65)' }}
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* 하단 약관 링크 + 라틴어 장식 */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10">
        <div className="flex items-center gap-3 opacity-20">
          <div className="w-14 h-px bg-[#d4b483]" />
          <span className="text-[#d4b483] text-[10px] tracking-[0.35em] uppercase">Liber Stellarum</span>
          <div className="w-14 h-px bg-[#d4b483]" />
        </div>
        <div className="flex items-center gap-3 opacity-35">
          <Link href="/terms" className="text-[#d4b483] text-[10px] tracking-widest hover:opacity-70 transition-opacity">이용약관</Link>
          <span className="text-[#d4b483]/40 text-[10px]">·</span>
          <Link href="/privacy" className="text-[#d4b483] text-[10px] tracking-widest hover:opacity-70 transition-opacity">개인정보처리방침</Link>
        </div>
      </div>
    </motion.section>
  )
}
