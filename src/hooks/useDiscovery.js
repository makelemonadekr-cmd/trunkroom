/**
 * useDiscovery.js
 *
 * Hooks for the public discovery feed.
 *
 *   usePublicStyles()         → { styles, loading, refresh }
 *   usePublicItems()          → { items,  loading, refresh }
 *   usePublicSellers()        → { sellers, loading, refresh }
 *   useSellerContent(userId)  → { items, styles, saleItems, loading }
 *
 * Data is normalised to the shapes DiscoveryPage components already
 * understand (the mock-data shape), so no changes are needed in the
 * card components themselves.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchPublicStyles,
  fetchPublicItems,
  fetchPublicSellers,
  fetchSellerContent,
} from "../services/discoveryService.js";

// ── Seller stub (used inside item / style normalizers) ─────────────────────────
function profileToSellerStub(profile) {
  if (!profile) return null;
  return {
    id:           profile.id,
    displayName:  profile.nickname ?? "익명",
    profileImage: profile.avatar_url ?? null,
    verified:     false,
  };
}

// ── Normalise a `styles` row → CodibookOutfitCard shape ───────────────────────
function normalizePublicStyle(row) {
  return {
    id:           row.id,
    title:        row.title       || "제목 없음",
    previewImage: row.background_url ?? null,
    color:        "#F2F2F2",
    bgColor:      "#F2F2F2",
    style:        row.mood        ?? null,
    season:       [],
    likes:        0,
    dateStr:      row.date_str    ?? null,
    seller:       profileToSellerStub(row._profile ?? null),
    userId:       row.user_id,
    source:       "real",
  };
}

// ── Normalise a `clothing_items` row → PublicItemCard / SellerItemCard shape ──
function normalizePublicItem(row) {
  return {
    id:           row.id,
    name:         row.name                        || "아이템",
    displayName:  (row.display_name ?? row.name)  || "아이템",
    brand:        row.brand                       ?? "",
    color:        row.color                       ?? "",
    size:         row.size                        ?? "",
    mainCategory: row.main_category ?? row.category ?? "기타",
    category:     row.main_category ?? "기타",
    season:       row.season                      ?? [],
    image:        row.image_url                   ?? null,
    isForSale:    row.is_for_sale                 ?? false,
    price:        row.price                       ?? 0,
    sellerId:     row.user_id,
    seller:       profileToSellerStub(row._profile ?? null),
    source:       "real",
  };
}

// ── Normalise a `profiles` row → SELLER_PROFILES shape ────────────────────────
function normalizePublicSeller(row) {
  return {
    id:           row.id,
    username:     row.id.slice(0, 8),       // 최대 8자 UUID prefix (표시용)
    displayName:  row.nickname   ?? "익명",
    bio:          row.bio        ?? "",
    profileImage: row.avatar_url ?? null,
    coverImage:   null,                     // 커버 이미지 아직 없음
    followers:    0,
    following:    0,
    styleLabel:   null,
    rating:       null,
    reviewCount:  0,
    verified:     false,
    source:       "real",
  };
}

// ─── usePublicStyles ──────────────────────────────────────────────────────────

/**
 * @returns {{ styles: Object[], loading: boolean, refresh: () => void }}
 */
export function usePublicStyles() {
  const [styles,  setStyles]  = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { styles: fetched, error } = await fetchPublicStyles();
    setLoading(false);
    if (error) {
      console.warn("[useDiscovery] styles fetch error:", error.message);
    } else {
      setStyles(fetched.map(normalizePublicStyle));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { styles, loading, refresh };
}

// ─── usePublicItems ───────────────────────────────────────────────────────────

/**
 * @returns {{ items: Object[], loading: boolean, refresh: () => void }}
 */
export function usePublicItems() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { items: fetched, error } = await fetchPublicItems();
    setLoading(false);
    if (error) {
      console.warn("[useDiscovery] items fetch error:", error.message);
    } else {
      setItems(fetched.map(normalizePublicItem));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { items, loading, refresh };
}

// ─── usePublicSellers ─────────────────────────────────────────────────────────

/**
 * @returns {{ sellers: Object[], loading: boolean, refresh: () => void }}
 */
export function usePublicSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { sellers: fetched, error } = await fetchPublicSellers();
    setLoading(false);
    if (error) {
      console.warn("[useDiscovery] sellers fetch error:", error.message);
    } else {
      setSellers(fetched.map(normalizePublicSeller));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { sellers, loading, refresh };
}

// ─── useSellerContent ─────────────────────────────────────────────────────────

/**
 * Fetch a single seller's public items and styles.
 * Pass `null` as userId to skip fetching (returns empty arrays immediately).
 *
 * @param {string|null} userId
 * @returns {{ items: Object[], styles: Object[], saleItems: Object[], loading: boolean }}
 */
export function useSellerContent(userId) {
  const [items,   setItems]   = useState([]);
  const [styles,  setStyles]  = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setStyles([]);
      return;
    }
    setLoading(true);
    fetchSellerContent(userId).then(({ items: rawItems, styles: rawStyles }) => {
      setLoading(false);
      setItems(rawItems.map((r)  => normalizePublicItem(r)));
      setStyles(rawStyles.map((r) => normalizePublicStyle(r)));
    });
  }, [userId]);

  const saleItems = useMemo(() => items.filter((i) => i.isForSale), [items]);

  return { items, styles, saleItems, loading };
}
