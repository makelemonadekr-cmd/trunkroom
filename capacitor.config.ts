import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.makelemonade.trunkroom",
  appName: "트렁크룸",
  webDir: "dist",

  // 프로덕션: Netlify URL로 API 요청
  server: {
    // 실기기 테스트 시 로컬 개발 서버 쓰려면 아래 주석 해제
    // url: "http://192.168.x.x:5173",
    // cleartext: true,
  },

  ios: {
    // 상태바 겹침 방지
    contentInset: "automatic",
    // 스크롤 바운스 제거 (앱스러운 느낌)
    scrollEnabled: false,
  },
};

export default config;
