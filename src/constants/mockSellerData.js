// ─── DEPRECATED MOCK STUBS ─────────────────────────────────────────────────
// All mock seller/discovery data has been removed for App Store submission.
// Real data flows through discoveryService → Supabase profiles + styles tables.
// This file remains only to keep legacy imports compiling.

export const SELLER_PROFILES = [];

export function getSellerById(_sellerId) { return null; }
export function getSellerItems(_sellerId) { return []; }
export function getSellerSaleItems(_sellerId) { return []; }
export function getSellerOutfits(_sellerId) { return []; }
export function getAllPublicItems() { return []; }
export function getAllForSaleItems() { return []; }
export function getAllPublicOutfits() { return []; }
export function toProductShape(item) {
  if (!item) return null;
  return {
    id: item.id,
    name: item.displayName ?? item.name ?? "",
    brand: item.brand ?? "",
    image: item.image ?? null,
    price: item.price ?? 0,
    isForSale: item.isForSale ?? false,
    seller: item.seller ?? null,
  };
}
