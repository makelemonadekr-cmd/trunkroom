/**
 * RecommendStrip.jsx — 추천 상품 가로 스크롤 (돈 버는 채널)
 *
 * 노브라블럼(자사·마진 100%) 제품을 맥락 있는 자리에 노출.
 * "잠자는 옷 비운 자리, 이건 어때요" 같은 고전환 순간에 배치.
 */

import { NOBRABLEM_PRODUCTS } from "../constants/partnerProducts.js";
import { openExternalUrl } from "../constants/appConfig.js";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

function ProductCard({ p }) {
  const off = p.originalPrice && p.originalPrice > p.price
    ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  return (
    <button
      onClick={() => openExternalUrl(p.url)}
      className="shrink-0 rounded-2xl bg-white overflow-hidden text-left transition-transform active:scale-95"
      style={{ width: 132, border: "1.5px solid #F0F0F0" }}
    >
      <div className="w-full" style={{ height: 132, backgroundColor: "#FAFAFA" }}>
        <img src={p.image} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="px-2.5 pt-2 pb-2.5">
        <p className="text-[11.5px] font-bold leading-tight" style={{ color: DARK, fontFamily: FONT, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 30 }}>
          {p.name}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          {off > 0 && <span className="text-[11px] font-extrabold" style={{ color: "#E8502E", fontFamily: FONT }}>{off}%</span>}
          <span className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>{p.price.toLocaleString()}원</span>
        </div>
      </div>
    </button>
  );
}

/**
 * @param {string} title    섹션 제목
 * @param {string} subtitle 보조 문구
 * @param {Object[]} products 기본 노브라블럼
 */
export default function RecommendStrip({ title = "옷장 구원템", subtitle = "노브라블럼 추천", products = NOBRABLEM_PRODUCTS }) {
  if (!products?.length) return null;
  return (
    <div className="py-4">
      <div className="flex items-center justify-between px-4 mb-2.5">
        <div className="min-w-0">
          <p className="text-[14px] font-extrabold leading-tight" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>{title}</p>
          <p className="text-[11px] mt-0.5" style={{ color: "#AAA", fontFamily: FONT }}>{subtitle}</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "#FFF3C4", color: "#B8860B", fontFamily: FONT }}>
          노브라블럼
        </span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
        {products.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
