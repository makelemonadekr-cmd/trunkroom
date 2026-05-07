// ─── DEPRECATED MOCK STUBS ─────────────────────────────────────────────────
// All mock closet data has been removed for App Store submission.
// Real data flows through useCloset(userId) → closetService → Supabase.
// This file remains only to keep legacy imports compiling. Do not add fixtures here.

export { MAIN_CATEGORIES, SUBCATEGORIES } from "./categories";

export const CLOSET_ITEMS = [];

export function getItemsByCategory(_category) { return []; }
export function getItemsBySubcategory(_subcategory) { return []; }
export function getItemsByStyleTag(_styleTag) { return []; }
export function getWeatherRecommendedClosetOutfit(_weather, _items = []) { return []; }
