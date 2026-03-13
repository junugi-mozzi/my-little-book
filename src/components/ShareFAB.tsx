// src/components/ShareFAB.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Facebook, Share2, Check, Link } from 'lucide-react'

const XLogo = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.057 5.45-6.057Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const TelegramLogo = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
)

interface ShareFABProps {
  storyId: string
  title: string
  inline?: boolean
}

export default function ShareFAB({ storyId, title, inline }: ShareFABProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/story/${storyId}`
    : `/story/${storyId}`
  const text = `루미스가 엮은 이야기 「${title}」를 읽어보세요.`

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank'
    )
    setOpen(false)
  }

  const handleFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank'
    )
    setOpen(false)
  }

  const handleTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
      '_blank'
    )
    setOpen(false)
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setOpen(false)
    setTimeout(() => setCopied(false), 2500)
  }

  const buttons = [
    { icon: XLogo,        label: 'X (Twitter)', onClick: handleTwitter,  color: 'bg-[#3e2723] hover:bg-[#4e342e] border-[#8d6e63]/50' },
    { icon: Facebook,     label: 'Facebook',    onClick: handleFacebook, color: 'bg-[#3e2723] hover:bg-[#4e342e] border-[#8d6e63]/50' },
    { icon: TelegramLogo, label: 'Telegram',    onClick: handleTelegram, color: 'bg-[#3e2723] hover:bg-[#4e342e] border-[#8d6e63]/50' },
    { icon: Link,         label: '링크 복사',   onClick: handleCopyLink, color: 'bg-[#3e2723] hover:bg-[#4e342e] border-[#8d6e63]/50' },
  ]

  const handleMainClick = async () => {
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)
    if (isMobile && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl })
      } catch (_) {}
    } else {
      setOpen(prev => !prev)
    }
  }

  if (inline) {
    return (
      <div className="relative flex flex-row-reverse items-center gap-2">
        {/* 메인 버튼 */}
        <motion.button
          onClick={handleMainClick}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-8 h-8 rounded-full bg-[#8d6e63] hover:bg-[#795548] border border-[#5d4037] shadow-[0_2px_8px_rgba(0,0,0,0.5)] flex items-center justify-center transition-colors"
          title="공유하기"
        >
          {copied
            ? <Check size={14} className="text-[#f4e4bc]" />
            : <Share2 size={14} className="text-[#f4e4bc]" />
          }
        </motion.button>

        {/* 소셜 버튼들 (왼쪽으로 펼쳐짐) */}
        <AnimatePresence>
          {open && buttons.map(({ icon: Icon, label, onClick, color }, i) => (
            <motion.button
              key={label}
              initial={{ opacity: 0, x: 10, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1, transition: { delay: i * 0.06, type: 'spring', stiffness: 300, damping: 22 } }}
              exit={{ opacity: 0, x: 10, scale: 0.8, transition: { delay: 0, duration: 0.15 } }}
              onClick={onClick}
              className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-lg transition-colors ${color}`}
              title={label}
            >
              <Icon size={14} className="text-[#d4b483]" />
            </motion.button>
          ))}
        </AnimatePresence>

        {/* 복사 완료 토스트 */}
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.9 }}
              className="absolute top-10 right-0 whitespace-nowrap bg-[#2a1f1a] border border-[#d4b483]/30 text-[#d4b483] text-[10px] tracking-widest px-3 py-1.5 rounded shadow-lg"
            >
              📋 링크가 복사되었습니다
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="absolute bottom-14 right-3 z-30 flex flex-col items-center gap-2">

      {/* 복사 완료 토스트 */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            className="absolute bottom-16 right-0 whitespace-nowrap bg-[#2a1f1a] border border-[#d4b483]/30 text-[#d4b483] text-[10px] tracking-widest px-3 py-1.5 rounded shadow-lg"
          >
            📋 링크가 복사되었습니다
          </motion.div>
        )}
      </AnimatePresence>

      {/* 소셜 버튼들 */}
      <AnimatePresence>
        {open && buttons.map(({ icon: Icon, label, onClick, color }, i) => (
          <motion.button
            key={label}
            initial={{ opacity: 0, y: 12, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.8 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 22 }}
            onClick={onClick}
            className={`w-9 h-9 rounded-full border flex items-center justify-center shadow-lg transition-colors ${color}`}
            title={label}
          >
            <Icon size={15} className="text-[#d4b483]" />
          </motion.button>
        ))}
      </AnimatePresence>

      {/* 메인 FAB 버튼 */}
      <motion.button
        onClick={handleMainClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-10 h-10 rounded-full bg-[#8d6e63] hover:bg-[#795548] border border-[#5d4037] shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex items-center justify-center transition-colors"
        title="공유하기"
      >
        {copied
          ? <Check size={16} className="text-[#f4e4bc]" />
          : <Share2 size={16} className="text-[#f4e4bc]" />
        }
      </motion.button>

    </div>
  )
}
