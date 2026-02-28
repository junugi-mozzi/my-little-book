// src/app/story/page.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useStoryStore } from '@/store/storyStore'
import GridLoader from '../../GridLoader'
import { useIsClient } from '@/hooks/useIsClient'

const HERO_IMAGE_FILENAME = '마리북-음유시인bard-hero.png.png';

export default function StoryPage() {
  const router = useRouter()
  const isClient = useIsClient()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [isFlipped, setIsFlipped] = useState(false) // 3D 책장 넘기기 트리거
  const [extraKeywords, setExtraKeywords] = useState<string[]>([])
  const [extraInput, setExtraInput] = useState('')

  const { genre, era, mood, keywords, setGenre, setEra, setMood, setKeywords } = useStoryStore()

  const bardScrollRef = useRef<HTMLDivElement>(null)
  const userScrollRef = useRef<HTMLDivElement>(null)

  const questions = [
    "별빛 도서관에 온 것을 환영해. 난 이 고서에 흩어진 별을 모으는 음유시인. 첫 번째로, 어떤 장르의 이야기를 엮어볼까?",
    "흥미로운 선택이네! 그 이야기가 펼쳐질 시대적 배경은 언제쯤일까?",
    "그 시대에 흐르는 공기는 어떤 느낌이지? 몽환적인가, 아니면 어둡고 긴박한가?",
    "마지막으로, 이 이야기에 꼭 새겨넣고 싶은 단서(키워드)들을 속삭여줘."
  ]

  const [messages, setMessages] = useState<{role: 'bard' | 'user', text: string}[]>([
    { role: 'bard', text: questions[0] }
  ])

  // 스크롤 자동 하단 이동
  useEffect(() => {
    bardScrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    userScrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 4단계 도달 시 책장 넘기기 트리거
  useEffect(() => {
    if (step >= 4) {
      setTimeout(() => setIsFlipped(true), 1500)
    }
  }, [step])

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || step >= 4) return

    const currentInput = input;
    setInput('')

    // 사용자 대답 저장
    setMessages(prev => [...prev, { role: 'user', text: currentInput }])

    if (step === 0) setGenre(currentInput)
    if (step === 1) setEra(currentInput)
    if (step === 2) setMood(currentInput)
    if (step === 3) setKeywords(currentInput)

    const nextStep = step + 1;
    setStep(nextStep);

    // 음유시인 대답 지연 출력
    setTimeout(() => {
      if (nextStep < 4) {
        setMessages(prev => [...prev, { role: 'bard', text: questions[nextStep] }])
      } else {
        setMessages(prev => [...prev, { role: 'bard', text: "모든 조각이 모였어... 이제 다음 장막을 열어보자꾸나." }])
      }
    }, 600)
  }

  const handleAddKeyword = () => {
    const trimmed = extraInput.trim()
    if (!trimmed) return
    setExtraKeywords(prev => [...prev, trimmed])
    setExtraInput('')
  }

  const handleRemoveKeyword = (index: number) => {
    setExtraKeywords(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreateStory = (storyType: 'short' | 'long') => {
    if (extraKeywords.length > 0) {
      const merged = [keywords, ...extraKeywords].filter(Boolean).join(', ')
      setKeywords(merged)
    }
    setLoading(true)
    router.push(storyType === 'short' ? '/short-story' : '/long-story')
  }

  if (!isClient || loading) {
    return (
      <main className="min-h-screen bg-[#1a1412] flex flex-col items-center justify-center p-4">
        <GridLoader color="#d4b483" />
        <p className="mt-8 text-lg text-[#d4b483] font-serif tracking-widest animate-pulse">양피지에 별빛을 새기는 중...</p>
      </main>
    )
  }

  const bardMessages = messages.filter(m => m.role === 'bard')
  const userMessages = messages.filter(m => m.role === 'user')

  return (
    <main className="min-h-screen bg-[#1a1412] flex items-center justify-center p-4 md:p-10 overflow-hidden font-serif relative">
      {/* 어두운 배경 조명 효과 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(60,40,20,0.4),_transparent_80%)] pointer-events-none" />

      {/* 3D 책 컨테이너 */}
      <div
        className="relative w-full max-w-6xl aspect-[4/3] md:aspect-[2/1] perspective-[2500px]"
        style={{ perspective: '2500px' }}
      >
        {/* 책의 뒷배경 가죽 커버 */}
        <div className="absolute inset-[-10px] bg-[#3e2723] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-[#261714]" />

        {/* 책 내부 페이지 래퍼 */}
        <div className="relative w-full h-full flex rounded-lg overflow-visible shadow-inner">

          {/* ==================== 왼쪽 페이지 (정적/음유시인) ==================== */}
          <div className="relative w-1/2 h-full bg-[#f4e4bc] border-r border-[#d4b483] shadow-[inset_-20px_0_30px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden">
            {/* 종이 질감 오버레이 */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')] opacity-20 pointer-events-none" />

            {/* 상단: 캐릭터 영역 */}
            <div className="p-8 pb-4 flex flex-col items-center justify-center shrink-0 border-b border-[#d4b483]/50">
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-[#8d6e63] shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
                <div className="absolute bottom-4 left-4 w-20 h-20 bg-yellow-400/30 blur-[20px] z-0 rounded-full" />
                <Image src={`/${HERO_IMAGE_FILENAME}`} alt="음유시인" fill className="object-cover relative z-10" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[#5d4037] tracking-wider">음유시인</h2>
            </div>

            {/* 하단: 음유시인 대화 로그 */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 hide-scrollbar">
              {bardMessages.map((msg, idx) => (
                <motion.div
                  key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="text-lg leading-relaxed text-[#3e2723]"
                >
                  <p className="first-letter:text-3xl first-letter:font-bold first-letter:text-[#8d6e63] drop-shadow-sm">
                    "{msg.text}"
                  </p>
                </motion.div>
              ))}
              <div ref={bardScrollRef} className="h-4" />
            </div>
          </div>

          {/* ==================== 드러난 오른쪽 페이지 (책장 넘어간 뒤의 화면) ==================== */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[#f4e4bc] shadow-[inset_20px_0_30px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center p-12 z-0">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')] opacity-20 pointer-events-none" />
             <h3 className="text-3xl font-bold text-[#5d4037] mb-10 text-center">이제, 조각을 엮을 시간입니다</h3>

             <div className="w-full space-y-6">
                <button
                  onClick={() => handleCreateStory('short')}
                  className="w-full py-5 bg-[#8d6e63] hover:bg-[#795548] text-[#f4e4bc] text-xl rounded shadow-lg transition-all border border-[#5d4037] flex justify-center items-center gap-3"
                >
                  📖 단편 소설 짓기
                </button>
                <button
                  onClick={() => handleCreateStory('long')}
                  className="w-full py-5 bg-[#d4b483] hover:bg-[#c6a165] text-[#3e2723] text-xl font-bold rounded shadow-lg transition-all border border-[#8d6e63] flex justify-center items-center gap-3"
                >
                  ✨ 장편 소설로 엮기
                </button>
             </div>
          </div>

          {/* ==================== 넘기는 오른쪽 페이지 (동적/사용자) ==================== */}
          <motion.div
            className="absolute top-0 right-0 w-1/2 h-full origin-left z-10"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: isFlipped ? -180 : 0 }}
            transition={{ duration: 1.5, ease: [0.645, 0.045, 0.355, 1.000] }}
          >
            {/* ---- 1. 페이지 앞면 (사용자 입력창) ---- */}
            <div
              className="absolute inset-0 bg-[#f4e4bc] shadow-[inset_20px_0_30px_rgba(0,0,0,0.15)] flex flex-col"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')] opacity-20 pointer-events-none" />

              <div className="p-8 border-b border-[#d4b483]/50 text-right">
                <h2 className="text-2xl font-bold text-[#5d4037] tracking-wider">나의 이야기</h2>
              </div>

              {/* 사용자 대화 로그 */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 hide-scrollbar">
                {userMessages.map((msg, idx) => (
                  <motion.div
                    key={idx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    className="text-right"
                  >
                    <p className="inline-block text-lg leading-relaxed text-[#3e2723] border-b border-[#a1887f] pb-1">
                      {msg.text}
                    </p>
                  </motion.div>
                ))}
                <div ref={userScrollRef} className="h-4" />
              </div>

              {/* 잉크 펜 스타일 입력창 */}
              <div className="p-8 bg-[#e8dcc4] border-t border-[#d4b483] shrink-0">
                <form onSubmit={handleSendMessage} className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={step >= 4}
                    placeholder="잉크를 찍어 답변을 적어주세요..."
                    className="w-full bg-transparent border-b-2 border-[#8d6e63] px-4 py-3 text-xl text-[#3e2723] focus:outline-none focus:border-[#5d4037] transition-colors placeholder-[#a1887f] disabled:opacity-50"
                  />
                  {step < 4 && (
                    <button type="submit" className="absolute right-0 bottom-3 text-[#5d4037] hover:text-[#3e2723] font-bold px-4">
                      기록하기
                    </button>
                  )}
                </form>
              </div>
            </div>

            {/* ---- 2. 페이지 뒷면 (넘어간 후 왼쪽 페이지 덮음) ---- */}
            <div
              className="absolute inset-0 bg-[#f4e4bc] shadow-[inset_-20px_0_30px_rgba(0,0,0,0.15)] flex flex-col items-center p-10 overflow-y-auto hide-scrollbar"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')] opacity-20 pointer-events-none" />

              <h2 className="text-2xl font-bold text-[#5d4037] mb-6 border-b-2 border-[#8d6e63] pb-3 w-full max-w-sm text-center shrink-0">수집된 기록</h2>

              <ul className="space-y-4 text-lg text-[#3e2723] w-full max-w-sm shrink-0">
                <li className="flex justify-between border-b border-[#d4b483] pb-2">
                  <span className="font-bold">장르</span> <span>{genre}</span>
                </li>
                <li className="flex justify-between border-b border-[#d4b483] pb-2">
                  <span className="font-bold">시대</span> <span>{era}</span>
                </li>
                <li className="flex justify-between border-b border-[#d4b483] pb-2">
                  <span className="font-bold">분위기</span> <span>{mood}</span>
                </li>
                <li className="flex justify-between border-b border-[#d4b483] pb-2">
                  <span className="font-bold">핵심 단서</span>
                  <span className="text-right max-w-[60%] truncate">{keywords}</span>
                </li>
              </ul>

              {/* ── 추가 단서 입력 ── */}
              <div className="mt-6 w-full max-w-sm shrink-0">
                <p className="text-xs font-bold text-[#8d6e63] tracking-[0.2em] uppercase mb-3">추가 단서</p>

                {/* 태그 목록 */}
                <AnimatePresence>
                  {extraKeywords.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-wrap gap-2 mb-4"
                    >
                      {extraKeywords.map((kw, i) => (
                        <motion.span
                          key={kw + i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#e8dcc4] border border-[#d4b483] rounded text-sm text-[#3e2723]"
                        >
                          {kw}
                          <button
                            onClick={() => handleRemoveKeyword(i)}
                            className="ml-1 text-[#8d6e63] hover:text-[#5d4037] leading-none transition-colors"
                          >
                            ×
                          </button>
                        </motion.span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 입력창 + 버튼 */}
                <div className="flex items-center gap-2 border-b-2 border-[#8d6e63] pb-1">
                  <input
                    type="text"
                    value={extraInput}
                    onChange={(e) => setExtraInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword() } }}
                    placeholder="단서를 추가하세요..."
                    className="flex-1 bg-transparent py-2 px-1 text-sm text-[#3e2723] focus:outline-none placeholder-[#a1887f]"
                  />
                  <motion.button
                    onClick={handleAddKeyword}
                    disabled={!extraInput.trim()}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-7 h-7 rounded-full bg-[#8d6e63] hover:bg-[#795548] disabled:opacity-35 disabled:cursor-not-allowed text-[#f4e4bc] text-lg font-bold flex items-center justify-center transition-colors shrink-0"
                  >
                    +
                  </motion.button>
                </div>
              </div>
            </div>

          </motion.div>

        </div>
      </div>

      {/* 스크롤바 숨김용 CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  )
}
