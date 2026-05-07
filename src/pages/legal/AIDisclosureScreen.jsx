import {
  COMPANY_NAME, SUPPORT_EMAIL, openMailTo,
} from "../../constants/appConfig";

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

function P({ children, style }) {
  return (
    <p
      className="text-[12px] leading-relaxed mb-2"
      style={{ color: "#444", fontFamily: FONT, ...style }}
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

export default function AIDisclosureScreen({ onBack }) {
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
          AI 이용 안내
        </h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-10" style={{ scrollbarWidth: "none" }}>
        <P>
          {COMPANY_NAME}는 트렁크룸 서비스에서 인공지능(AI) 기술을 사용하고 있습니다.
          이용자가 AI 기능을 안전하고 투명하게 이용할 수 있도록, 본 안내문을 통해
          AI의 활용 범위, 한계, 데이터 처리 방식을 명확히 고지합니다.
        </P>

        <H2>1. AI가 제공하는 기능</H2>
        <ul className="mb-3 ml-2">
          <Li>옷장에 등록된 의류 사진의 카테고리·색상·속성 자동 분석</Li>
          <Li>날씨, 일정, 보유 의류 기반의 코디 추천</Li>
          <Li>스타일 태그 추출 및 유사 스타일 검색</Li>
          <Li>이용자가 작성한 게시물의 부적절성 여부 1차 자동 검토</Li>
        </ul>

        <H2>2. 사용되는 AI 기술</H2>
        <P>
          본 서비스는 자체 학습 모델 및 외부 AI 사업자(OpenAI, Anthropic, Google 등)의
          API를 결합하여 사용합니다. 이용자가 입력한 데이터는 추천·분류 목적에 한해
          처리되며, 외부 AI 사업자에 모델 재학습용으로 제공되지 않습니다.
        </P>

        <H2>3. AI의 한계</H2>
        <ul className="mb-3 ml-2">
          <Li>AI 분석 결과는 항상 정확하지 않을 수 있습니다.</Li>
          <Li>추천 결과는 참고용이며, 최종 선택은 이용자가 합니다.</Li>
          <Li>AI는 인간을 대체하지 않으며, 의료·법률·금융 등 전문적 판단의 근거로 사용해서는 안 됩니다.</Li>
          <Li>이용자는 AI 결과에 이의가 있을 경우 직접 수정할 수 있습니다.</Li>
        </ul>

        <H2>4. 데이터 사용 범위</H2>
        <P>
          AI 기능을 위해 처리되는 데이터는 옷장 사진, 카테고리·색상 등 의류 메타데이터,
          이용자의 스타일 선호도에 한정됩니다. 이용자는 언제든지 자신의 데이터에 대해
          조회·수정·삭제를 요청할 수 있으며, 자세한 내용은 개인정보 처리방침을 참고하시기 바랍니다.
        </P>

        <H2>5. AI 결과에 대한 책임</H2>
        <P>
          AI 추천은 통계적 모델에 기반하므로 오류·편향이 포함될 수 있습니다. 회사는
          AI 결과의 정확성·완전성·특정 목적 적합성을 보장하지 않으며, AI 결과에 대한
          이용자의 의사결정에 따른 결과에 대해 책임을 지지 않습니다.
        </P>

        <H2>6. AI 기능 거부 및 옵트아웃</H2>
        <P>
          이용자는 일부 AI 기능(자동 분류, 코디 추천 등)을 설정에서 비활성화할 수 있습니다.
          AI 기능을 사용하지 않더라도 핵심 옷장 관리 기능은 정상적으로 이용 가능합니다.
        </P>

        <H2>7. 문의</H2>
        <P>
          AI 사용과 관련한 문의·이의 제기는{" "}
          <MailLink email={SUPPORT_EMAIL} subject="[AI 이용 안내] 문의" />
          으로 보내주시기 바랍니다.
        </P>

        {/* Effective date */}
        <div
          className="mt-8 pt-5 border-t"
          style={{ borderColor: "#F0F0F0" }}
        >
          <p className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            {COMPANY_NAME}
          </p>
          <p className="text-[11px] mt-1" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            시행일: 2026년 5월 7일
          </p>
        </div>
      </div>
    </div>
  );
}
