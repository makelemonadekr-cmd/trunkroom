import {
  COMPANY_NAME, COMPANY_CEO, BUSINESS_NUMBER,
  SUPPORT_EMAIL, openMailTo,
} from "../../constants/appConfig";

const FONT = "'Spoqa Han Sans Neo', sans-serif";

function H2({ children }) {
  return (
    <h2 className="text-[14px] font-bold mt-6 mb-2" style={{ color: "#1a1a1a", fontFamily: FONT }}>
      {children}
    </h2>
  );
}

function P({ children }) {
  return (
    <p className="text-[12px] leading-relaxed mb-2" style={{ color: "#444", fontFamily: FONT }}>
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

export default function TermsOfServiceScreen({ onBack }) {
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
          이용약관
        </h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-10" style={{ scrollbarWidth: "none" }}>
        <P>
          이 약관은 {COMPANY_NAME}(이하 "회사")가 제공하는 트렁크룸 서비스(이하 "서비스")의
          이용 조건 및 절차, 회사와 이용자 간의 권리·의무를 규정합니다.
        </P>

        <H2>제1조 (목적)</H2>
        <P>
          이 약관은 회사가 운영하는 트렁크룸 모바일 애플리케이션 및 관련 서비스의
          이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
        </P>

        <H2>제2조 (정의)</H2>
        <ul className="mb-3 ml-2">
          <Li>"서비스"란 트렁크룸 모바일 앱 및 관련 서비스 일체를 말합니다.</Li>
          <Li>"이용자"란 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</Li>
          <Li>"회원"이란 서비스에 가입하여 서비스를 이용하는 자를 말합니다.</Li>
          <Li>"콘텐츠"란 이용자가 서비스에 등록한 의류 정보, 사진, 스타일 게시물 등 일체를 말합니다.</Li>
        </ul>

        <H2>제3조 (약관의 효력 및 변경)</H2>
        <ul className="mb-3 ml-2">
          <Li>이 약관은 서비스 화면에 게시하거나 앱 내 공지함으로써 효력이 발생합니다.</Li>
          <Li>회사는 합리적인 사유가 있는 경우 관련 법령에 위배되지 않는 범위에서 약관을 변경할 수 있으며, 변경된 약관은 적용일 7일 전에 공지합니다.</Li>
          <Li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</Li>
        </ul>

        <H2>제4조 (서비스의 제공 및 변경)</H2>
        <P>① 회사는 다음과 같은 서비스를 제공합니다.</P>
        <ul className="mb-3 ml-2">
          <Li>옷장 등록 및 관리 서비스</Li>
          <Li>AI 기반 스타일 추천 서비스</Li>
          <Li>스타일 커뮤니티 및 스타일북 서비스</Li>
          <Li>의류 판매 중개 서비스</Li>
        </ul>
        <P>
          ② 회사는 서비스 내용을 변경할 수 있으며, 이 경우 변경 내용 및 적용 일자를
          사전에 공지합니다.
        </P>

        <H2>제5조 (회원의 의무)</H2>
        <P>① 이용자는 다음 각 호의 행위를 하여서는 안 됩니다.</P>
        <ul className="mb-3 ml-2">
          <Li>타인의 정보 도용 또는 허위 정보 등록</Li>
          <Li>회사의 저작권, 제3자의 지식재산권 침해 행위</Li>
          <Li>서비스를 이용한 법령·약관·공서양속에 반하는 행위</Li>
          <Li>타인을 기망·오인시키는 행위</Li>
          <Li>서비스 운영을 방해하는 행위</Li>
        </ul>
        <P>② 이용자는 최신의 정확한 개인정보를 유지할 책임이 있습니다.</P>

        <H2>제6조 (회사의 의무)</H2>
        <ul className="mb-3 ml-2">
          <Li>관련 법령과 이 약관에 따라 지속적이고 안정적인 서비스를 제공하기 위해 최선을 다합니다.</Li>
          <Li>이용자의 개인정보를 안전하게 처리하기 위한 보안 시스템을 구축·운영합니다.</Li>
          <Li>이용자로부터 정당한 의견이나 불만이 제기되면 신속하게 처리합니다.</Li>
        </ul>

        <H2>제7조 (계정 및 이용 제한)</H2>
        <P>① 회사는 이용자가 다음에 해당하는 경우 서비스 이용을 제한할 수 있습니다.</P>
        <ul className="mb-3 ml-2">
          <Li>타인 정보 도용 또는 허위 정보 등록</Li>
          <Li>서비스 운영을 방해하는 행위</Li>
          <Li>불법·유해 콘텐츠 등록</Li>
        </ul>
        <P>
          ② 서비스 이용 제한에 이의가 있는 경우{" "}
          <MailLink email={SUPPORT_EMAIL} subject="[이의신청] 서비스 이용 제한" />
          으로 문의하시기 바랍니다.
        </P>

        <H2>제8조 (게시물 및 콘텐츠)</H2>
        <ul className="mb-3 ml-2">
          <Li>이용자가 게시한 콘텐츠의 저작권은 이용자에게 있습니다.</Li>
          <Li>이용자는 회사에 대해 서비스 운영·홍보 목적으로 콘텐츠를 사용할 수 있는 비독점적·무상의 사용권을 부여합니다.</Li>
          <Li>타인의 권리를 침해하는 콘텐츠는 즉시 삭제될 수 있습니다.</Li>
        </ul>

        <H2>제9조 (면책)</H2>
        <ul className="mb-3 ml-2">
          <Li>회사는 천재지변, 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</Li>
          <Li>회사는 이용자 귀책 사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</Li>
          <Li>회사는 이용자 간 또는 이용자와 제3자 간에 발생한 분쟁에 대해 개입할 의무가 없으며 이로 인한 손해를 배상할 책임이 없습니다.</Li>
        </ul>

        <H2>제10조 (지식재산권)</H2>
        <P>
          서비스에 게시된 회사의 저작물에 대한 저작권 및 지식재산권은 회사에 귀속됩니다.
          이용자는 회사의 사전 승낙 없이 이를 복제·송신·출판·배포·방송 등의 방법으로
          영리 목적에 이용하거나 제3자에게 이용하게 할 수 없습니다.
        </P>

        <H2>제11조 (서비스 중단)</H2>
        <P>
          회사는 설비 점검·수리, 불가항력적 사유 등으로 서비스를 일시 중단할 수 있으며,
          가능한 경우 사전에 공지합니다.
        </P>

        <H2>제12조 (분쟁 해결 및 준거법)</H2>
        <ul className="mb-3 ml-2">
          <Li>이 약관의 해석 및 분쟁에 대해서는 대한민국 법령을 적용합니다.</Li>
          <Li>서비스 이용 관련 분쟁은 1차적으로 상호 협의를 통해 해결하며, 해결되지 않을 경우 회사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.</Li>
        </ul>

        {/* Effective date footer */}
        <div className="mt-8 pt-5 border-t" style={{ borderColor: "#F0F0F0" }}>
          <p className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            {COMPANY_NAME} · 사업자등록번호 {BUSINESS_NUMBER}
          </p>
          <p className="text-[11px] mt-1" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            시행일: 2024년 1월 1일
          </p>
        </div>
      </div>
    </div>
  );
}
