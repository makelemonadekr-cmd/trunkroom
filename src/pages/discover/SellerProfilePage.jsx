/**
 * SellerProfilePage.jsx
 *
 * Full-screen overlay showing a single seller's profile.
 * Handles its own item and outfit detail overlays internally
 * so it can be stacked cleanly above the discovery tab.
 *
 * Props:
 *   seller  : SELLER_PROFILES entry (from mockSellerData)
 *   onBack  : () => void
 */

import { useState } from "react";
import LazyImage         from "../../components/LazyImage";
import OutfitDetailScreen from "../../components/OutfitDetailScreen";
import ProductDetailPage  from "../product/ProductDetailPage";
import { isFollowing, toggleFollow } from "../../lib/followStore";
import { getSellerItems, getSellerOutfits, getSellerSaleItems, toProductShape } from "../../constants/mockSellerData";
import { unsplashUrl } from "../../lib/imageUtils";
import { isLiked, getLikeCount, toggleLike } from "../../lib/likesStore";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

// ─── Item card (2-col) ────────────────────────────────────────────────────────

function SellerItemCard({ item, onTap }) {
  const imgSrc = item.image?.includes("unsplash.com")
    ? unsplashUrl(item.image, 320)
    : item.image;

  return (
    <button
      className="w-full rounded-xl overflow-hidden active:opacity-80 text-left"
      style={{ border: "1px solid #F0F0F0", backgroundColor: "white" }}
      onClick={() => onTap?.(toProductShape(item))}
    >
      <div className="relative" style={{ aspectRatio: "3/4" }}>
        <LazyImage
          src={imgSrc}
          alt={item.displayName ?? item.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          responsive={item.image?.includes("unsplash.com")}
        />
        {item.isForSale && (
          <div
            className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: YELLOW }}
          >
            <span className="text-[8px] font-bold" style={{ color: DARK, fontFamily: FONT }}>판매중</span>
          </div>
        )}
      </div>
      <div className="px-2 pt-1.5 pb-2">
        <p className="text-[9px] uppercase tracking-wide truncate" style={{ color: "#AAAAAA", fontFamily: FONT }}>
          {item.brand}
        </p>
        <p className="text-[11px] font-medium mt-0.5 truncate" style={{ color: DARK, fontFamily: FONT }}>
          {item.displayName ?? item.name}
        </p>
        {item.isForSale && item.price > 0 && (
          <p className="text-[11px] font-bold mt-0.5" style={{ color: DARK, fontFamily: FONT }}>
            {item.price.toLocaleString()}원
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Outfit card (2-col) ──────────────────────────────────────────────────────

function SellerOutfitCard({ outfit, onTap }) {
  const [liked, setLiked] = useState(() => isLiked(outfit.id));
  const [count, setCount] = useState(() => getLikeCount(outfit.id, outfit.likes ?? 0));

  function handleLike(e) {
    e.stopPropagation();
    const r = toggleLike(outfit.id, outfit.likes ?? 0);
    setLiked(r.liked);
    setCount(r.count);
  }

  const imgSrc = outfit.previewImage?.includes("unsplash.com")
    ? unsplashUrl(outfit.previewImage, 320)
    : outfit.previewImage;

  return (
    <div
      className="relative rounded-2xl overflow-hidden active:opacity-90"
      style={{ aspectRatio: "3/4", backgroundColor: outfit.color || "#EEE", cursor: "pointer" }}
      onClick={() => onTap?.(outfit)}
    >
      <LazyImage
        src={imgSrc}
        alt={outfit.title}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
        responsive={outfit.previewImage?.includes("unsplash.com")}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 55%)" }}
      />
      {/* Like */}
      <button
        onClick={handleLike}
        className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full"
        style={{ backgroundColor: "rgba(0,0,0,0.30)", backdropFilter: "blur(6px)" }}
      >
        <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
          <path d="M6.5 11L1.5 6.3C1.06 5.86 1 5.18 1 4.5C1 3.12 2.12 2 3.5 2C4.3 2 5.02 2.41 5.5 3.04L6.5 4.19L7.5 3.04C7.98 2.41 8.7 2 9.5 2C10.88 2 12 3.12 12 4.5C12 5.18 11.94 5.86 11.5 6.3L6.5 11Z"
            fill={liked ? "#E84040" : "none"} stroke={liked ? "#E84040" : "rgba(255,255,255,0.85)"} strokeWidth="1.2" />
        </svg>
        <span className="text-[9px]" style={{ color: liked ? "#ff7070" : "rgba(255,255,255,0.85)", fontFamily: FONT }}>
          {count}
        </span>
      </button>
      {/* Title */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
        <p className="text-[12px] font-bold text-white truncate" style={{ fontFamily: FONT }}>{outfit.title}</p>
        <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)", fontFamily: FONT }}>{outfit.style}</p>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ emoji, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-2">
      <span style={{ fontSize: 40 }}>{emoji}</span>
      <p className="text-[13px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>{message}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SellerProfilePage({ seller, onBack }) {
  const [following,      setFollowing]      = useState(() => isFollowing(seller.id));
  const [activeTab,      setActiveTab]      = useState("items"); // "items" | "codis" | "sale"
  const [localFollowers, setLocalFollowers] = useState(seller.followers);
  // Internal detail overlays — managed here so z-stacking is clean
  const [selectedItem,   setSelectedItem]   = useState(null); // product shape
  const [selectedOutfit, setSelectedOutfit] = useState(null); // outfit object

  const items     = getSellerItems(seller.id);
  const outfits   = getSellerOutfits(seller.id);
  const saleItems = getSellerSaleItems(seller.id);

  function handleFollow() {
    const result = toggleFollow(seller.id);
    setFollowing(result.following);
    setLocalFollowers((n) => result.following ? n + 1 : n - 1);
  }

  const SUB_TABS = [
    { id: "items",  label: "아이템",  count: items.length   },
    { id: "codis",  label: "스타일북",  count: outfits.length },
    { id: "sale",   label: "판매중",  count: saleItems.length },
  ];

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white overflow-hidden">

      {/* Internal detail overlays (z-50 so they stack above this page's z-40) */}
      {selectedOutfit && (
        <OutfitDetailScreen outfit={selectedOutfit} onBack={() => setSelectedOutfit(null)} />
      )}
      {selectedItem && !selectedOutfit && (
        <ProductDetailPage product={selectedItem} onBack={() => setSelectedItem(null)} />
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* Cover image */}
        <div className="relative" style={{ height: 160 }}>
          <LazyImage
            src={seller.coverImage}
            alt={seller.displayName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            priority
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.05) 100%)" }}
          />
          {/* Back button */}
          <button
            onClick={onBack}
            className="absolute top-3 left-4 flex items-center gap-1.5 active:opacity-70"
            style={{
              backgroundColor: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(8px)",
              borderRadius: 20,
              padding: "6px 12px 6px 8px",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: "white" }}>뒤로</span>
          </button>
        </div>

        {/* Profile info block */}
        <div className="px-5 pt-4 pb-5" style={{ borderBottom: "1px solid #F0F0F0" }}>
          <div className="flex items-end justify-between mb-3">
            {/* Avatar */}
            <div
              className="rounded-full overflow-hidden border-4 border-white"
              style={{ width: 64, height: 64, marginTop: -36, boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}
            >
              <LazyImage
                src={seller.profileImage}
                alt={seller.displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            {/* Follow button */}
            <button
              onClick={handleFollow}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full active:opacity-70"
              style={{
                backgroundColor: following ? "#F5F5F5" : DARK,
                border:          following ? "1.5px solid #E0E0E0" : "none",
              }}
            >
              {following && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="#555" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <span
                className="text-[13px] font-bold"
                style={{ color: following ? "#555" : "white", fontFamily: FONT }}
              >
                {following ? "팔로잉" : "팔로우"}
              </span>
            </button>
          </div>

          {/* Name + verified */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-[17px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
              {seller.displayName}
            </p>
            {seller.verified && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7.5" fill={YELLOW} />
                <path d="M4.5 8L7 10.5L11.5 5.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <p className="text-[12px] mb-2" style={{ color: "#888", fontFamily: FONT }}>@{seller.username}</p>
          <p className="text-[13px] leading-relaxed mb-3" style={{ color: "#444", fontFamily: FONT }}>
            {seller.bio}
          </p>

          {/* Style tag */}
          <span
            className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-4"
            style={{ backgroundColor: "rgba(245,194,0,0.14)", color: "#B8920A", border: "1px solid rgba(245,194,0,0.3)", fontFamily: FONT }}
          >
            {seller.styleLabel}
          </span>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "아이템",  value: items.length },
              { label: "스타일",    value: outfits.length },
              { label: "팔로워",  value: localFollowers.toLocaleString() },
              { label: "팔로잉",  value: seller.following.toLocaleString() },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center">
                <p className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
                  {s.value}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Rating row */}
          <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid #F5F5F5" }}>
            <span style={{ fontSize: 14 }}>⭐</span>
            <span className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>{seller.rating}</span>
            <span className="text-[12px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              ({seller.reviewCount}개 리뷰)
            </span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex" style={{ borderBottom: "2px solid #F0F0F0" }}>
          {SUB_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center pt-3 pb-0"
              >
                <span
                  className="text-[13px] pb-2.5 flex items-center gap-1"
                  style={{ color: isActive ? DARK : "#AAAAAA", fontFamily: FONT, fontWeight: isActive ? 700 : 400 }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: isActive ? DARK : "#F0F0F0", color: isActive ? "white" : "#888", fontFamily: FONT }}
                    >
                      {tab.count}
                    </span>
                  )}
                </span>
                <div style={{ height: 2, width: "100%", backgroundColor: isActive ? DARK : "transparent", borderRadius: 1 }} />
              </button>
            );
          })}
        </div>

        {/* ── 아이템 tab ── */}
        {activeTab === "items" && (
          items.length === 0
            ? <EmptyState emoji="👗" message="등록된 아이템이 없어요" />
            : (
              <div className="grid grid-cols-2 gap-3 px-4 py-4">
                {items.map((item) => (
                  <SellerItemCard key={item.id} item={item} onTap={(p) => setSelectedItem(p)} />
                ))}
              </div>
            )
        )}

        {/* ── 스타일북 tab ── */}
        {activeTab === "codis" && (
          outfits.length === 0
            ? <EmptyState emoji="✨" message="등록된 스타일북이 없어요" />
            : (
              <div className="grid grid-cols-2 gap-3 px-4 py-4">
                {outfits.map((outfit) => (
                  <SellerOutfitCard key={outfit.id} outfit={outfit} onTap={(o) => setSelectedOutfit(o)} />
                ))}
              </div>
            )
        )}

        {/* ── 판매중 tab ── */}
        {activeTab === "sale" && (
          saleItems.length === 0
            ? <EmptyState emoji="🛍️" message="판매중인 아이템이 없어요" />
            : (
              <div className="grid grid-cols-2 gap-3 px-4 py-4">
                {saleItems.map((item) => (
                  <SellerItemCard key={item.id} item={item} onTap={(p) => setSelectedItem(p)} />
                ))}
              </div>
            )
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
