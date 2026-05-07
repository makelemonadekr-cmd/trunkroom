// ─── DEPRECATED MOCK STUBS ─────────────────────────────────────────────────
// All mock outfit data has been removed for App Store submission.
// Real data flows through fetchPublicStyles (discoveryService) → Supabase styles table.
// This file remains only to keep legacy imports compiling.

export const OUTFIT_DATA = [];

export function getOutfitsByStyle(_style) { return []; }
export function getOutfitsByStyleAndSeason(_style, _season) { return []; }
export function getOutfitsContainingItem(_itemId, _item = null) { return []; }
