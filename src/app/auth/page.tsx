// src/app/auth/page.tsx
'use client'

import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const PARTICLES = [
  { w: 1.5, h: 2.1, top: '15%', left: '23%', duration: 3.2, delay: 0.5 },
  { w: 2.3, h: 1.8, top: '67%', left: '81%', duration: 2.8, delay: 1.2 },
  { w: 1.2, h: 1.4, top: '42%', left: '9%',  duration: 3.5, delay: 0.0 },
  { w: 2.7, h: 1.1, top: '88%', left: '55%', duration: 2.5, delay: 2.1 },
  { w: 1.8, h: 2.9, top: '5%',  left: '70%', duration: 4.0, delay: 0.8 },
  { w: 2.0, h: 1.6, top: '31%', left: '47%', duration: 3.1, delay: 1.7 },
  { w: 1.3, h: 2.4, top: '74%', left: '16%', duration: 2.9, delay: 0.3 },
  { w: 2.5, h: 1.9, top: '53%', left: '93%', duration: 3.7, delay: 2.5 },
  { w: 1.7, h: 1.3, top: '19%', left: '62%', duration: 2.6, delay: 1.0 },
  { w: 2.2, h: 2.6, top: '96%', left: '38%', duration: 3.4, delay: 0.6 },
  { w: 1.4, h: 2.0, top: '60%', left: '74%', duration: 4.2, delay: 1.9 },
  { w: 2.8, h: 1.5, top: '8%',  left: '31%', duration: 3.0, delay: 2.8 },
  { w: 1.1, h: 2.7, top: '47%', left: '58%', duration: 2.7, delay: 0.2 },
  { w: 2.4, h: 1.2, top: '83%', left: '5%',  duration: 3.6, delay: 1.4 },
  { w: 1.9, h: 2.3, top: '25%', left: '88%', duration: 3.3, delay: 0.9 },
  { w: 2.1, h: 1.7, top: '70%', left: '42%', duration: 2.4, delay: 2.3 },
  { w: 1.6, h: 2.8, top: '38%', left: '19%', duration: 3.8, delay: 1.6 },
  { w: 2.9, h: 1.4, top: '12%', left: '77%', duration: 3.9, delay: 0.4 },
]

export default function AuthPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.push('/')
  }, [user, loading, router])

  return (
    <main className="min-h-screen bg-[#1a1412] flex items-center justify-center p-4 font-serif relative overflow-hidden">

      {/* 배경 조명 효과 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(60,40,20,0.6),_transparent_70%)] pointer-events-none" />

      {/* 별빛 파티클 */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-[#d4b483]"
          style={{ width: p.w, height: p.h, top: p.top, left: p.left }}
          animate={{ opacity: [0.1, 0.8, 0.1] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
        />
      ))}

      {/* 양피지 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative w-full max-w-sm"
      >
        {/* 가죽 커버 그림자 */}
        <div className="absolute inset-[-8px] bg-[#3e2723] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)]" />

        {/* 양피지 본체 */}
        <div className="relative bg-[#f4e4bc] rounded-xl overflow-hidden shadow-inner">

          {/* 종이 질감 */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')] opacity-25 pointer-events-none" />

          {/* 상단 장식선 */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8d6e63] to-transparent opacity-60" />

          <div className="relative z-10 px-10 py-12 flex flex-col items-center gap-8">

            {/* 문장(紋章) 아이콘 영역 */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full border-2 border-[#8d6e63] bg-[#e8dcc4] shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center">
                <span className="text-3xl select-none">📖</span>
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-[#3e2723] tracking-widest">별빛 도서관</h1>
                <p className="mt-1 text-sm text-[#8d6e63] tracking-wider">My Little Book</p>
              </div>
            </div>

            {/* 구분선 */}
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-[#d4b483]" />
              <span className="text-[#a1887f] text-xs tracking-widest">✦ 입장 ✦</span>
              <div className="flex-1 h-px bg-[#d4b483]" />
            </div>

            {/* 안내 문구 */}
            <p className="text-center text-[#5d4037] text-sm leading-relaxed">
              이야기를 엮으려면<br />
              <span className="font-semibold">음유시인의 서명</span>이 필요하다네.
            </p>

            {/* Google 로그인 버튼 */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}
              whileTap={{ scale: 0.98 }}
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#3e2723] hover:bg-[#4e342e] border border-[#5d4037] rounded-lg text-[#f4e4bc] font-semibold tracking-wide transition-colors shadow-md"
            >
              {/* Google G 로고 */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6545455,4.90909091 15.1636364,5.47272727 16.3563636,6.40000000 L19.2727273,3.48363636 C17.3454545,1.73636364 14.8272727,0.636363636 12,0.636363636 C7.27272727,0.636363636 3.25454545,3.43636364 1.27272727,7.46363636 L5.26620003,9.76452941 Z"/>
                <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,16.5049343 C3.19279051,20.5703132 7.26500293,23.3636364 12,23.3636364 C14.713665,23.3636364 17.2081453,22.4108182 19.1116244,20.7948545 L16.0407269,18.0125889 Z"/>
                <path fill="#4A90D9" d="M19.1116244,20.7948545 C21.0870905,19.2228909 22.4181678,16.8654879 22.4181678,13.9090909 C22.4181678,13.3 22.3254545,12.7181818 22.1672727,12.1818182 L12,12.1818182 L12,16.0454545 L17.7818182,16.0454545 C17.5236364,17.2727273 16.8072727,18.2727273 16.0407269,18.0125889 L19.1116244,20.7948545 Z"/>
                <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182857 5.03443647,10.4668316 5.26620003,9.76452941 L1.23746264,7.52307087 C0.444749359,9.14122657 0,10.9705179 0,12 C0,13.0367505 0.444189201,14.8595829 1.23746264,16.5049343 L5.27698177,14.2678769 Z"/>
              </svg>
              Google로 입장하기
            </motion.button>

            {/* 하단 장식 문구 */}
            <p className="text-[#a1887f] text-xs tracking-wider text-center">
              — 별빛이 그대의 이야기를 기다린다 —
            </p>

          </div>

          {/* 하단 장식선 */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8d6e63] to-transparent opacity-60" />
        </div>
      </motion.div>

    </main>
  )
}
