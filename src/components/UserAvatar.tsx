// src/components/UserAvatar.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useBGMStore } from '@/store/bgmStore'

export default function UserAvatar() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const { muted, toggleMuted } = useBGMStore()

  // 터치 디바이스 감지
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!hovered) return
    const close = () => setHovered(false)
    document.addEventListener('click', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('touchstart', close)
    }
  }, [hovered])

  if (loading) return null

  return (
    <div
      className="fixed top-5 right-6 z-[39]"
      onMouseEnter={isTouch ? undefined : () => setHovered(true)}
      onMouseLeave={isTouch ? undefined : () => setHovered(false)}
    >
      {user ? (
        <>
          {/* 프로필 아바타 */}
          <div
            onClick={(e) => { e.stopPropagation(); setHovered(prev => !prev) }}
            className="w-9 h-9 rounded-full border-2 border-[#d4b483]/60 overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.6)] cursor-pointer transition-all duration-200 hover:border-[#d4b483] hover:shadow-[0_0_16px_rgba(212,180,131,0.4)]"
          >
            {user.user_metadata?.avatar_url ? (
              <Image
                src={user.user_metadata.avatar_url}
                alt="프로필"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#8d6e63] flex items-center justify-center text-[#f4e4bc] text-sm font-bold font-serif">
                {user.email?.[0].toUpperCase() ?? '?'}
              </div>
            )}
          </div>

          {/* 호버 드롭다운 */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-11 right-0 min-w-[180px] bg-[#2a1f1a]/95 backdrop-blur-sm border border-[#d4b483]/30 rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.75)] overflow-hidden font-serif"
              >
                {/* 이메일 정보 */}
                <div className="px-4 py-3 border-b border-[#d4b483]/20 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full border border-[#d4b483]/40 overflow-hidden shrink-0">
                    {user.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt="프로필"
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#8d6e63] flex items-center justify-center text-[#f4e4bc] text-[10px] font-bold">
                        {user.email?.[0].toUpperCase() ?? '?'}
                      </div>
                    )}
                  </div>
                  <p className="text-[#d4b483] text-xs tracking-wide truncate">{user.email}</p>
                </div>

                {/* 내 서재 */}
                <button
                  onClick={() => { setHovered(false); router.push('/library') }}
                  className="w-full px-4 py-3 text-left text-xs text-[#d4b483]/80 hover:text-[#f4e4bc] hover:bg-[#3e2723]/60 tracking-widest transition-colors border-b border-[#d4b483]/15"
                >
                  📖 나의 서재
                </button>

                {/* BGM 음소거 */}
                <button
                  onClick={toggleMuted}
                  className="w-full px-4 py-3 text-left text-xs text-[#d4b483]/80 hover:text-[#f4e4bc] hover:bg-[#3e2723]/60 tracking-widest transition-colors border-b border-[#d4b483]/15 flex items-center gap-2"
                >
                  {muted ? '🔇 BGM 끄기' : '🔊 BGM 켜기'}
                </button>

                {/* 로그아웃 */}
                <button
                  onClick={signOut}
                  className="w-full px-4 py-3 text-left text-xs text-[#a1887f] hover:text-[#f4e4bc] hover:bg-[#3e2723]/60 tracking-widest transition-colors"
                >
                  로그아웃
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <motion.button
          onClick={() => router.push('/auth')}
          whileHover={{ scale: 1.04, boxShadow: '0 0 16px rgba(212,180,131,0.15)' }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4b483]/40 bg-[#3e2723]/70 text-[#d4b483] hover:bg-[#3e2723] text-xs tracking-widest backdrop-blur-sm transition-colors font-serif"
        >
          로그인
        </motion.button>
      )}
    </div>
  )
}
