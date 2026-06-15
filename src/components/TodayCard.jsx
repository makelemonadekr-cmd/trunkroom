/**
 * TodayCard.jsx — 홈 "오늘" 데일리 카드
 *
 * 데일리 루프의 허브:
 *   오늘 날씨 한 줄 + "오늘 입은 옷 기록하기"(원탭 착용등록) + 이번 달 머니 요약
 */

import { formatKRW } from "../lib/payback.js";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function weatherAdvice(temp) {
  if (temp == null) return "";
  if (temp >= 28) return "더운 날, 가볍게";
  if (temp >= 23) return "포근해요";
  if (temp >= 17) return "딱 좋은 날씨";
  if (temp >= 10) return "선선해요, 한 겹 더";
  if (temp >= 5)  return "쌀쌀해요, 따뜻하게";
  return "추운 날, 단단히";
}

/**
 * @param {Object}   weather      — useWeather().weather { temp, condition, city, feelsLike }
 * @param {Object[]} todayItems   — 오늘 입은 옷(정규화된 closet item) 배열
 * @param {Object}   monthly      — getMonthlyStats 결과 { wearEvents, itemsWorn, extracted }
 * @param {number}   streak       — 연속 기록 일수
 * @param {Function} onOpenLog    — "기록하기" 탭
 * @param {Function} onItemTap    — 썸네일 탭
 */
export default function TodayCard({ weather, todayItems = [], monthly, streak = 0, onOpenLog, onItemTap }) {
  const now = new Date();
  const dateLabel = `${now.getMonth() + 1}월 ${now.getDate()}일 (${WEEKDAYS[now.getDay()]})`;
  const logged = todayItems.length > 0;
  const m = monthly ?? { wearEvents: 0, extracted: 0, itemsWorn: 0 };

  return (
    <div className="px-4 pt-1 pb-2">
      <div className="rounded-3xl bg-white overflow-hidden" style={{ border: "1.5px solid #F0F0F0", boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>

        {/* 상단: 날짜 + 날씨 + 스트릭 */}
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid #F6F6F6" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-[15px] font-extrabold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>오늘</span>
              <span className="text-[12px] font-medium truncate" style={{ color: "#999", fontFamily: FONT }}>{dateLabel}</span>
            </div>
            {streak > 0 && (
              <span className="text-[11px] font-bold shrink-0 px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFF3C4", color: "#B8860B", fontFamily: FONT }}>
                🔥 {streak}일 연속
              </span>
            )}
          </div>
          {weather && weather.temp != null && (
            <p className="text-[13px] mt-1.5" style={{ color: "#666", fontFamily: FONT }}>
              {weather.city ? `${weather.city} ` : ""}{weather.temp}° {weather.condition ?? ""}
              <span style={{ color: "#BBB" }}> · {weatherAdvice(weather.temp)}</span>
            </p>
          )}
        </div>

        {/* 착용 등록 */}
        <div className="px-5 py-4">
          {logged ? (
            <button onClick={onOpenLog} className="w-full flex items-center gap-3 active:opacity-70">
              <div className="flex -space-x-2 shrink-0">
                {todayItems.slice(0, 4).map((it) => {
                  const img = it.image ?? it.image_url;
                  return (
                    <div key={it.id} className="rounded-full overflow-hidden" style={{ width: 36, height: 36, border: "2px solid white", backgroundColor: "#F2F2F2" }}>
                      {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[15px]">👕</div>}
                    </div>
                  );
                })}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT }}>오늘 {todayItems.length}벌 입었어요 ✓</p>
                <p className="text-[11px]" style={{ color: "#AAA", fontFamily: FONT }}>탭해서 수정하기</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3.5L10.5 8L6 12.5" stroke="#CCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          ) : (
            <button
              onClick={onOpenLog}
              className="w-full rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              style={{ height: 52, backgroundColor: DARK, fontFamily: FONT }}
            >
              <span style={{ fontSize: 18 }}>👕</span>
              <span className="text-[15px] font-bold" style={{ color: YELLOW }}>오늘 입은 옷 기록하기</span>
            </button>
          )}
        </div>

        {/* 이번 달 머니 요약 */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: "#FCFAF2", borderTop: "1px solid #F6F0DC" }}>
          <span className="text-[12px] font-bold" style={{ color: "#8A7A45", fontFamily: FONT }}>
            이번 달 {m.wearEvents}번 입음
          </span>
          <span className="text-[12.5px] font-extrabold" style={{ color: "#C99700", fontFamily: FONT }}>
            {m.extracted > 0 ? `옷장에서 ${formatKRW(m.extracted)} 뽑음 💸` : "기록을 시작해봐요"}
          </span>
        </div>
      </div>
    </div>
  );
}
