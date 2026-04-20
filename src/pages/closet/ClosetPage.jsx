import { useState } from "react";

const YELLOW = "#F5C200";

// ─── Sample outfit photos ─────────────────────────────────────────────────────
const OUTFIT_PHOTOS = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=75&fit=crop",
    count: 1,
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&q=75&fit=crop",
    count: 1,
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&q=75&fit=crop",
    count: 2,
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=75&fit=crop",
    count: 1,
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=75&fit=crop",
    count: 3,
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=75&fit=crop",
    count: 2,
  },
];

// ─── Clothing category SVG icons ─────────────────────────────────────────────

function OuterIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      {/* body */}
      <path d="M13 36V16L9 10H7L4 16V28L8 30V36H36V30L40 28V16L37 10H35L31 16V36" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      {/* left lapel yellow */}
      <path d="M13 10L22 17L22 19L13 10Z" fill={YELLOW} />
      {/* right lapel yellow */}
      <path d="M31 10L22 17L22 19L31 10Z" fill={YELLOW} />
      {/* center seam */}
      <path d="M22 19V36" stroke="#1a1a1a" strokeWidth="1.2" strokeDasharray="2 2" />
      {/* collar outline */}
      <path d="M13 10L22 17L31 10" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function DressIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      {/* skirt */}
      <path d="M15 20L8 38H36L29 20H15Z" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      {/* bodice */}
      <path d="M17 20V14H27V20" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      {/* left strap yellow */}
      <path d="M17 14C17 14 15 9 18 7" stroke={YELLOW} strokeWidth="2" strokeLinecap="round" />
      {/* right strap yellow */}
      <path d="M27 14C27 14 29 9 26 7" stroke={YELLOW} strokeWidth="2" strokeLinecap="round" />
      {/* waistline accent */}
      <path d="M15 20H29" stroke="#1a1a1a" strokeWidth="1.2" />
    </svg>
  );
}

function SuitIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      {/* body */}
      <path d="M12 36V16L9 10H8L5 16V28H12" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <path d="M32 36V16L35 10H36L39 16V28H32" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      <path d="M12 10H32V36H12Z" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      {/* left lapel yellow */}
      <path d="M12 10L22 16L22 18L12 10Z" fill={YELLOW} />
      {/* right lapel yellow */}
      <path d="M32 10L22 16L22 18L32 10Z" fill={YELLOW} />
      {/* collar */}
      <path d="M12 10L22 16L32 10" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" />
      {/* tie yellow */}
      <path d="M20 18L22 36L24 18L22 16Z" fill={YELLOW} stroke={YELLOW} strokeWidth="0.5" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ClosetHeader() {
  return (
    <div
      className="flex items-center justify-between px-5 bg-white shrink-0"
      style={{ height: 50, borderBottom: "1px solid #F0F0F0" }}
    >
      <div style={{ width: 34 }} />
      <h1
        className="text-[17px] font-bold"
        style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.02em" }}
      >
        옷장
      </h1>
      <button className="w-[34px] h-[34px] flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="3" stroke="#1a1a1a" strokeWidth="1.5" />
          <path
            d="M11 2V4M11 18V20M2 11H4M18 11H20M4.22 4.22L5.64 5.64M16.36 16.36L17.78 17.78M4.22 17.78L5.64 16.36M16.36 5.64L17.78 4.22"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

function ProfileSection() {
  return (
    <div className="px-5 py-4 bg-white" style={{ borderBottom: "1px solid #F0F0F0" }}>
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 56, height: 56, backgroundColor: "#EBEBEB" }}
        >
          <img
            src="/officiallogo.png"
            alt="avatar"
            style={{ width: 32, height: 32, objectFit: "contain", opacity: 0.55 }}
          />
        </div>

        {/* Name & email */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[16px] font-bold truncate"
            style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.02em" }}
          >
            트렁크룸
          </p>
          <p
            className="text-[12px] mt-0.5 truncate"
            style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            trunkroom@io
          </p>
        </div>

        {/* 내 사이즈 button */}
        <button
          className="flex items-center gap-1 px-3 py-1.5 rounded-sm shrink-0"
          style={{ backgroundColor: "#F5F5F5", border: "1px solid #E8E8E8" }}
        >
          <span
            className="text-[12px] font-medium"
            style={{ color: "#333", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            내 사이즈
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5L7.5 6L4 9.5" stroke="#888" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function FollowerStats() {
  return (
    <div
      className="flex items-stretch bg-white"
      style={{ borderBottom: "1px solid #F0F0F0" }}
    >
      <div className="flex-1 flex flex-col items-center py-3">
        <p
          className="text-[11px]"
          style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          팔로워
        </p>
        <p
          className="text-[18px] font-bold mt-0.5"
          style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.02em" }}
        >
          2,125
        </p>
      </div>
      <div style={{ width: 1, backgroundColor: "#EEEEEE", marginTop: 10, marginBottom: 10 }} />
      <div className="flex-1 flex flex-col items-center py-3">
        <p
          className="text-[11px]"
          style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          팔로잉
        </p>
        <p
          className="text-[18px] font-bold mt-0.5"
          style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.02em" }}
        >
          835
        </p>
      </div>
    </div>
  );
}

function SubStats() {
  const items = [
    { label: "옷장의류", value: "182" },
    { label: "공개의류", value: "105" },
    { label: "후기",     value: "34"  },
    { label: "쿠폰",     value: "280" },
  ];
  return (
    <div
      className="flex items-stretch bg-white"
      style={{ borderBottom: "1px solid #F0F0F0" }}
    >
      {items.map((item, i) => (
        <div key={item.label} className="flex-1 flex flex-col items-center py-2.5 relative">
          {i > 0 && (
            <div
              className="absolute left-0 top-2 bottom-2"
              style={{ width: 1, backgroundColor: "#EEEEEE" }}
            />
          )}
          <p
            className="text-[10px]"
            style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            {item.label}
          </p>
          <p
            className="text-[15px] font-bold mt-0.5"
            style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.02em" }}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function SubTabs({ active, onChange }) {
  const tabs = [
    { id: "clothing", label: "내의류" },
    { id: "codebook", label: "코디북" },
    { id: "history",  label: "거래내역" },
  ];
  return (
    <div
      className="flex bg-white"
      style={{ borderBottom: "1px solid #F0F0F0" }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-1 flex flex-col items-center pt-3 pb-0"
          >
            <span
              className="text-[13px] pb-2.5"
              style={{
                color: isActive ? "#1a1a1a" : "#AAAAAA",
                fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                fontWeight: isActive ? 700 : 400,
              }}
            >
              {tab.label}
            </span>
            <div
              style={{
                height: 2,
                width: "100%",
                backgroundColor: isActive ? "#1a1a1a" : "transparent",
                borderRadius: 1,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

function CategoryRow({ active, onChange }) {
  const cats = [
    { id: "outer", label: "OUTER", Icon: OuterIcon },
    { id: "dress", label: "DRESS", Icon: DressIcon },
    { id: "suit",  label: "SUIT",  Icon: SuitIcon  },
  ];
  return (
    <div
      className="flex items-center justify-around bg-white py-4"
      style={{ borderBottom: "1px solid #F4F4F4" }}
    >
      {cats.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className="flex items-center justify-center rounded-xl"
              style={{
                width: 60,
                height: 60,
                backgroundColor: isActive ? "#FFFBEB" : "#F7F7F7",
                border: isActive ? `1.5px solid ${YELLOW}` : "1.5px solid transparent",
              }}
            >
              <Icon />
            </div>
            <span
              className="text-[10px] font-bold tracking-wider"
              style={{
                color: isActive ? "#1a1a1a" : "#888",
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.08em",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PhotoGrid() {
  const [liked, setLiked] = useState({});

  const toggle = (id) => setLiked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="bg-white px-3 pt-3 pb-4">
      <div className="grid grid-cols-2 gap-2">
        {OUTFIT_PHOTOS.map((photo) => (
          <div key={photo.id} className="relative rounded-sm overflow-hidden bg-[#F5F5F5]">
            <img
              src={photo.image}
              alt=""
              style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
            />
            {/* Like + count badge */}
            <div className="absolute top-2 right-2 flex flex-col items-center gap-0.5">
              <button
                onClick={() => toggle(photo.id)}
                className="w-7 h-7 flex items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.82)" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 12L1.5 6.5C1 6 1 5.5 1 4.8C1 3.2 2.5 2 4.2 2C5.1 2 5.9 2.5 6.5 3.1L7 3.7L7.5 3.1C8.1 2.5 8.9 2 9.8 2C11.5 2 13 3.2 13 4.8C13 5.5 12.9 6 12.5 6.5L7 12Z"
                    fill={liked[photo.id] ? "#E84040" : "none"}
                    stroke={liked[photo.id] ? "#E84040" : "#888"}
                    strokeWidth="1.2"
                  />
                </svg>
              </button>
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 16, height: 16, backgroundColor: "rgba(0,0,0,0.55)" }}
              >
                <span className="text-[9px] font-bold text-white">{photo.count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ClosetPage() {
  const [activeSubTab,   setActiveSubTab]   = useState("codebook");
  const [activeCategory, setActiveCategory] = useState("outer");

  return (
    <div className="flex flex-col h-full bg-white">
      <ClosetHeader />

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <ProfileSection />
        <FollowerStats />
        <SubStats />
        <SubTabs active={activeSubTab} onChange={setActiveSubTab} />
        <CategoryRow active={activeCategory} onChange={setActiveCategory} />
        <PhotoGrid />
      </div>

      {/* Sticky CTA above bottom nav */}
      <div
        className="px-4 py-3 bg-white shrink-0"
        style={{ borderTop: "1px solid #F0F0F0" }}
      >
        <button
          className="w-full flex items-center justify-center rounded-sm"
          style={{
            backgroundColor: "#313439",
            height: 48,
            fontFamily: "'Spoqa Han Sans Neo', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.01em",
          }}
        >
          코디 만들기
        </button>
      </div>
    </div>
  );
}
