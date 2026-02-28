// src/app/terms/page.tsx
'use client'

import { useRouter } from 'next/navigation'

const SECTIONS = [
  {
    title: '제1조 (목적)',
    content: `본 약관은 별빛 도서관(My Little Book, 이하 "서비스")이 제공하는 AI 기반 소설 생성 서비스의 이용 조건 및 절차, 이용자와 서비스 제공자의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.`,
  },
  {
    title: '제2조 (정의)',
    content: `① "서비스"란 별빛 도서관이 운영하는 AI 소설 생성 플랫폼을 의미합니다.\n② "이용자"란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.\n③ "AI 생성 콘텐츠"란 이용자가 입력한 장르, 시대, 분위기, 키워드를 바탕으로 AI가 생성한 소설 텍스트를 말합니다.`,
  },
  {
    title: '제3조 (약관의 효력 및 변경)',
    content: `① 본 약관은 서비스 화면에 게시하거나 이용자에게 통지함으로써 효력이 발생합니다.\n② 서비스는 관련 법령에 위배되지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 사전 공지합니다.`,
  },
  {
    title: '제4조 (서비스 이용)',
    content: `① 서비스는 Google 계정을 통한 소셜 로그인 방식으로 회원가입이 이루어집니다.\n② 이용자는 서비스를 통해 단편 소설 및 장편 소설 아웃라인을 생성할 수 있습니다.\n③ 서비스는 이용자의 편의를 위해 생성된 소설을 저장하며, 이용자는 언제든지 삭제를 요청할 수 있습니다.`,
  },
  {
    title: '제5조 (AI 생성 콘텐츠 관련)',
    content: `① 본 서비스는 AI(인공지능) 기술을 활용하여 소설을 생성합니다. 이용자는 서비스 이용 전 해당 사실을 충분히 인지하여야 합니다.\n② AI가 생성한 콘텐츠는 이용자의 입력을 기반으로 하며, 그 내용의 정확성, 완전성을 보장하지 않습니다.\n③ AI 생성 콘텐츠에 대한 저작권은 현행 법령에 따르며, 상업적 이용 시 이용자 본인이 관련 법적 책임을 부담합니다.`,
  },
  {
    title: '제6조 (이용자의 의무)',
    content: `이용자는 다음 행위를 하여서는 안 됩니다.\n① 타인의 정보를 도용하는 행위\n② 서비스를 이용하여 타인의 명예를 훼손하거나 불법적인 콘텐츠를 생성하는 행위\n③ 서비스의 정상적인 운영을 방해하는 행위\n④ 기타 관련 법령에 위반되는 행위`,
  },
  {
    title: '제7조 (서비스 중단)',
    content: `서비스는 시스템 점검, 장애, 천재지변 등 불가피한 사유로 서비스를 일시 중단할 수 있으며, 이 경우 사전 또는 사후에 공지합니다.`,
  },
  {
    title: '제8조 (책임의 한계)',
    content: `① 서비스는 AI가 생성한 소설의 내용으로 인해 발생한 손해에 대해 책임을 지지 않습니다.\n② 서비스는 이용자 상호 간 또는 이용자와 제3자 간에 발생한 분쟁에 개입하지 않습니다.`,
  },
  {
    title: '제9조 (준거법 및 관할법원)',
    content: `본 약관은 대한민국 법률에 따라 해석되며, 서비스 이용으로 발생한 분쟁에 관한 소송은 관할 법원을 제1심 법원으로 합니다.`,
  },
]

export default function TermsPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#1a1412] py-16 px-4 font-serif">
      <div className="max-w-2xl mx-auto">

        {/* 뒤로가기 */}
        <button
          onClick={() => window.history.length > 1 ? router.back() : router.push('/')}
          className="mb-8 flex items-center gap-2 text-[#d4b483]/60 hover:text-[#d4b483] text-sm tracking-widest transition-colors"
        >
          ← 돌아가기
        </button>

        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-20 h-px bg-[#d4b483]/40" />
            <span className="text-[#d4b483]/60 text-xs tracking-[0.5em]">✦</span>
            <div className="w-20 h-px bg-[#d4b483]/40" />
          </div>
          <h1 className="text-3xl font-bold text-[#f4e4bc] tracking-widest mb-2">이용약관</h1>
          <p className="text-[#a1887f] text-sm tracking-wider">별빛 도서관 · My Little Book</p>
          <p className="mt-4 text-[#a1887f]/70 text-xs">시행일: 2025년 1월 1일</p>
        </div>

        {/* 약관 내용 */}
        <div className="space-y-8">
          {SECTIONS.map((section, i) => (
            <div key={i} className="border-b border-[#d4b483]/15 pb-8 last:border-0">
              <h2 className="text-[#d4b483] font-bold text-base tracking-wider mb-3">
                {section.title}
              </h2>
              <p className="text-[#a1887f] text-sm leading-loose whitespace-pre-line">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* 하단 장식 */}
        <div className="mt-16 flex items-center justify-center gap-4 opacity-30">
          <div className="w-14 h-px bg-[#d4b483]" />
          <span className="text-[#d4b483] text-[10px] tracking-[0.4em] uppercase">Liber Stellarum</span>
          <div className="w-14 h-px bg-[#d4b483]" />
        </div>

      </div>
    </main>
  )
}
