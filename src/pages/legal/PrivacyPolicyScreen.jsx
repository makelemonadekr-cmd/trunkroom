import {
  COMPANY_NAME, COMPANY_CEO, BUSINESS_NUMBER,
  SUPPORT_EMAIL, CUSTOMER_SERVICE_PHONE,
  openMailTo, openTel,
} from "../../constants/appConfig";

// ─── Shared typography helpers ────────────────────────────────────────────────
const FONT = "'Spoqa Han Sans Neo', sans-serif";

function H2({ children }) {
  return (
    <h2
      className="text-[14px] font-bold mt-6 mb-2"
      style={{ color: "#1a1a1a", fontFamily: FONT }}
    >
      {children}
    </h2>
  );
}

function P({ children }) {
  return (
    <p
      className="text-[12px] leading-relaxed mb-2"
      style={{ color: "#444", fontFamily: FONT }}
    >
      {children}
    </p>
  );
}

function Li({ children }) {
  return (
    <li
      className="text-[12px] leading-relaxed mb-1 pl-2"
      style={{ color: "#444", fontFamily: FONT, listStyleType: "disc", listStylePosition: "inside" }}
    >
      {children}
    </li>
  );
}

function MailLink({ email, subject = "", label }) {
  return (
    <button
      onClick={() => openMailTo(email, subject)}
      className="underline"
      style={{ color: "#1a1a1a", fontFamily: FONT, fontSize: "inherit" }}
    >
      {label ?? email}
    </button>
  );
}

function TelLink({ phone, label }) {
  return (
    <button
      onClick={() => openTel(phone)}
      className="underline"
      style={{ color: "#1a1a1a", fontFamily: FONT, fontSize: "inherit" }}
    >
      {label ?? phone}
    </button>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PrivacyPolicyScreen({ onBack }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 pt-3 pb-3 border-b"
        style={{ borderColor: "#F0F0F0" }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center rounded-full"
          style={{ width: 36, height: 36, backgroundColor: "#F5F5F5" }}
          aria-label="뒤로"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#222" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1
          className="text-[17px] font-bold"
          style={{ color: "#1a1a1a", fontFamily: FONT, letterSpacing: "-0.02em" }}
        >
          개인정보 처리방침
        </h1>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto px-5 pb-10"
        style={{ scrollbarWidth: "none" }}
      >
        <P>
          {COMPANY_NAME}(이하 "회사")는 트렁크룸 서비스(이하 "서비스") 운영과 관련하여
          「개인정보 보호법」 등 관련 법령에 따라 이용자의 개인정보를 보호하고 원활하게
          처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.
        </P>

        <H2>제1조 수집하는 개인정보 항목</H2>
        <P>회사는 서비스 이용 과정에서 아래와 같은 개인정보를 수집할 수 있습니다.</P>
        <P className="font-medium" style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12 }}>
          ① 필수 수집 항목
        </P>
        <ul className="mb-3 ml-2">
          <Li>이메일 주소, 비밀번호 (암호화 저장)</Li>
          <Li>서비스 이용 기록, 접속 로그, 기기 정보 (OS 버전, 기기 모델명)</Li>
        </ul>
        <P style={{ fontWeight: 600 }}>② 선택 수집 항목</P>
        <ul className="mb-3 ml-2">
          <Li>프로필 이미지, 닉네임</Li>
          <Li>의류 사진 및 등록 정보 (카테고리, 색상, 사이즈, 가격 등)</Li>
          <Li>스타일 선호도 및 코디 취향 정보</Li>
        </ul>
        <P style={{ fontWeight: 600 }}>③ 서비스 이용 중 자동 수집 항목</P>
        <ul className="mb-3 ml-2">
          <Li>IP 주소, 쿠키, 방문 일시, 서비스 이용 기록</Li>
        </ul>

        <H2>제2조 개인정보 수집 및 이용 목적</H2>
        <ul className="mb-3 ml-2">
          <Li>서비스 제공: 회원 가입·관리, 옷장 등록·관리, 코디 추천</Li>
          <Li>고객 지원: 문의 응답, 불만 처리, 공지사항 전달</Li>
          <Li>서비스 개선: 이용 통계 분석, 신규 기능 개발, AI 추천 정확도 향상</Li>
          <Li>보안·인증: 부정 이용 방지, 계정 보안 강화</Li>
        </ul>

        <H2>제3조 보유 및 이용 기간</H2>
        <P>
          이용자의 개인정보는 수집·이용 목적이 달성된 후 지체 없이 파기합니다.
          단, 관계 법령에 따라 아래 기간 동안 보존합니다.
        </P>
        <ul className="mb-3 ml-2">
          <Li>전자상거래법에 따른 거래 기록: 5년</Li>
          <Li>소비자 불만 또는 분쟁 처리 기록: 3년</Li>
          <Li>로그인 기록: 3개월</Li>
        </ul>

        <H2>제4조 개인정보의 제3자 제공</H2>
        <P>
          회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
          다만 이용자가 사전에 동의한 경우 또는 법령에 따라 수사기관의 요구가 있는 경우는 예외입니다.
        </P>

        <H2>제5조 처리 위탁</H2>
        <P>
          회사는 서비스 향상을 위해 개인정보 처리업무의 일부를 아래와 같이 위탁하며,
          관계 법령에 따른 계약을 통해 안전하게 관리합니다.
        </P>
        <ul className="mb-3 ml-2">
          <Li>클라우드 인프라 서비스: Amazon Web Services (AWS)</Li>
          <Li>앱 분석 및 통계: 법령 범위 내 처리</Li>
        </ul>

        <H2>제6조 이용자의 권리</H2>
        <P>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</P>
        <ul className="mb-3 ml-2">
          <Li>개인정보 조회·수정 요청</Li>
          <Li>개인정보 처리 정지 요청</Li>
          <Li>개인정보 삭제(탈퇴) 요청</Li>
          <Li>개인정보 이동권 요청</Li>
        </ul>
        <P>
          권리 행사는 서비스 내 설정 화면 또는{" "}
          <MailLink email={SUPPORT_EMAIL} subject="[개인정보] 권리 행사 요청" />
          을 통해 요청하실 수 있으며, 회사는 10일 이내에 처리하겠습니다.
        </P>

        <H2>제7조 안전성 확보 조치</H2>
        <ul className="mb-3 ml-2">
          <Li>개인정보 암호화 (비밀번호 등 민감정보는 암호화 저장)</Li>
          <Li>접근 통제 시스템 운영 및 불법적 접근 차단</Li>
          <Li>개인정보 취급자 최소화 및 교육 실시</Li>
        </ul>

        <H2>제8조 쿠키 및 로그 데이터</H2>
        <P>
          회사는 개인화된 서비스 제공을 위해 쿠키(cookie)를 사용합니다.
          쿠키는 서버가 이용자의 브라우저에 전달하는 소규모 텍스트 파일로,
          이용자는 브라우저 설정을 통해 수신 여부를 결정할 수 있습니다.
          단, 쿠키 거부 시 일부 서비스 이용이 제한될 수 있습니다.
        </P>

        <H2>제9조 개인정보 보호 책임자 및 문의처</H2>
        <P>개인정보 보호 책임자</P>
        <ul className="mb-3 ml-2">
          <Li>성명: {COMPANY_CEO} (대표이사)</Li>
          <Li>
            이메일:{" "}
            <MailLink email={SUPPORT_EMAIL} subject="[개인정보 문의]" />
          </Li>
          <Li>
            전화:{" "}
            <TelLink phone={CUSTOMER_SERVICE_PHONE} />
          </Li>
        </ul>
        <P>
          개인정보 침해 신고는 개인정보 침해신고센터 (☎ 118),
          대검찰청 사이버수사과 (☎ 02-3480-3573),
          경찰청 사이버안전국 (☎ 182)에 문의하실 수 있습니다.
        </P>

        {/* Effective date */}
        <div
          className="mt-8 pt-5 border-t"
          style={{ borderColor: "#F0F0F0" }}
        >
          <p
            className="text-[11px]"
            style={{ color: "#AAAAAA", fontFamily: FONT }}
          >
            {COMPANY_NAME} · 사업자등록번호 {BUSINESS_NUMBER}
          </p>
          <p
            className="text-[11px] mt-1"
            style={{ color: "#AAAAAA", fontFamily: FONT }}
          >
            시행일: 2024년 1월 1일
          </p>
        </div>
      </div>
    </div>
  );
}
