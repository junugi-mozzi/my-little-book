// src/app/privacy/page.tsx
'use client'

import { useRouter } from 'next/navigation'

const SECTIONS = [
  {
    title: '제1조 (개인정보의 처리 목적)',
    content: `별빛 도서관(My Little Book)은 다음의 목적을 위하여 개인정보를 처리합니다.\n① 회원 식별 및 서비스 제공\n② AI 소설 생성 서비스 이용 이력 관리\n③ 서비스 관련 공지 및 안내`,
  },
  {
    title: '제2조 (수집하는 개인정보 항목)',
    content: `서비스는 Google 소셜 로그인을 통해 다음 정보를 수집합니다.\n\n[필수 항목]\n· 이메일 주소\n· Google 계정 고유 식별자(UID)\n· 프로필 이미지 URL (Google 제공)\n\n[서비스 이용 중 생성되는 정보]\n· 생성된 소설 내용 (장르, 시대, 분위기, 키워드, 본문)\n· 서비스 이용 일시`,
  },
  {
    title: '제3조 (개인정보의 처리 및 보유 기간)',
    content: `① 회원 탈퇴 시까지 개인정보를 보유 및 처리합니다.\n② 탈퇴 요청 시 해당 계정과 연관된 모든 데이터는 즉시 삭제됩니다.\n③ 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.`,
  },
  {
    title: '제4조 (개인정보의 제3자 제공)',
    content: `서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우는 예외로 합니다.\n① 이용자가 사전에 동의한 경우\n② 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우`,
  },
  {
    title: '제5조 (개인정보 처리 위탁)',
    content: `서비스는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁합니다.\n\n· 수탁업체: Supabase Inc.\n  - 위탁 업무: 사용자 인증 및 데이터 저장\n\n· 수탁업체: Google LLC\n  - 위탁 업무: 소셜 로그인 인증 처리\n\n· 수탁업체: Anthropic PBC (AI 연동 시)\n  - 위탁 업무: AI 소설 생성 처리 (입력 내용 전달)`,
  },
  {
    title: '제6조 (이용자의 권리)',
    content: `이용자는 언제든지 다음의 권리를 행사할 수 있습니다.\n① 개인정보 열람 요청\n② 개인정보 정정·삭제 요청\n③ 개인정보 처리 정지 요청\n④ 회원 탈퇴 및 데이터 삭제 요청\n\n위 요청은 서비스 내 계정 설정 또는 고객 지원을 통해 처리됩니다.`,
  },
  {
    title: '제7조 (쿠키 사용)',
    content: `서비스는 로그인 세션 유지를 위해 쿠키(Cookie)를 사용합니다. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 서비스 이용이 제한될 수 있습니다.`,
  },
  {
    title: '제8조 (개인정보 보호책임자)',
    content: `개인정보 처리에 관한 문의, 불만 처리, 피해 구제 등에 관한 사항은 아래로 연락 주시기 바랍니다.\n\n· 서비스명: 별빛 도서관 (My Little Book)\n· 문의: 서비스 내 고객센터`,
  },
  {
    title: '제9조 (개인정보처리방침 변경)',
    content: `개인정보처리방침이 변경되는 경우 변경 사항을 서비스 내 공지사항을 통해 사전에 공지합니다.`,
  },
]

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-[#f4e4bc] tracking-widest mb-2">개인정보처리방침</h1>
          <p className="text-[#a1887f] text-sm tracking-wider">별빛 도서관 · My Little Book</p>
          <p className="mt-4 text-[#a1887f]/70 text-xs">시행일: 2025년 1월 1일</p>
        </div>

        {/* 내용 */}
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
