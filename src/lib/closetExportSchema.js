/**
 * closetExportSchema.js
 *
 * Defines the FLAT, export-friendly representation of a ClosetItem.
 * Used by exportClosetToCsv.js, exportClosetToXlsx.js, and mapClosetItemToNotion.js.
 *
 * Design rules:
 *  - All array fields are joined to a comma-separated string.
 *  - All values are strings or numbers — no nested objects.
 *  - Column/key order is stable.
 *  - Korean labels are ONLY in the CSV/XLSX header row — internal keys stay English.
 */

// ─── Column order for CSV / XLSX ──────────────────────────────────────────────

/**
 * Ordered list of export columns.
 * key          – internal field name in the flat export object
 * koLabel      – Korean column header for human-readable exports
 * notionType   – Notion property type (for mapClosetItemToNotion.js)
 */
export const EXPORT_COLUMNS = [
  { key: "id",            koLabel: "ID",             notionType: "title"        },
  { key: "name",          koLabel: "이름",            notionType: "rich_text"    },
  { key: "displayName",   koLabel: "표시명",          notionType: "rich_text"    },
  { key: "brand",         koLabel: "브랜드",          notionType: "rich_text"    },
  { key: "mainCategory",  koLabel: "카테고리",        notionType: "select"       },
  { key: "subCategory",   koLabel: "세부 카테고리",   notionType: "select"       },
  { key: "styleTags",     koLabel: "스타일",          notionType: "multi_select" },
  { key: "season",        koLabel: "시즌",            notionType: "multi_select" },
  { key: "color",         koLabel: "색상",            notionType: "rich_text"    },
  { key: "secondaryColor",koLabel: "세컨드 컬러",     notionType: "rich_text"    },
  { key: "tags",          koLabel: "태그",            notionType: "multi_select" },
  { key: "size",          koLabel: "사이즈",          notionType: "rich_text"    },
  { key: "condition",     koLabel: "컨디션",          notionType: "select"       },
  { key: "price",         koLabel: "가격 (원)",       notionType: "number"       },
  { key: "isForSale",     koLabel: "판매중",          notionType: "checkbox"     },
  { key: "source",        koLabel: "등록 방법",       notionType: "select"       },
  { key: "notes",         koLabel: "메모",            notionType: "rich_text"    },
  { key: "image",         koLabel: "이미지 URL",      notionType: "url"          },
  { key: "createdAt",     koLabel: "등록일",          notionType: "date"         },
  { key: "updatedAt",     koLabel: "수정일",          notionType: "date"         },
];

export const EXPORT_KEYS = EXPORT_COLUMNS.map((c) => c.key);

// ─── Flatten a ClosetItem for export ──────────────────────────────────────────

/**
 * Convert a ClosetItem (with arrays) into a flat, export-friendly object.
 * Arrays are joined as "값1,값2". Booleans become "Y"/"N".
 *
 * @param {import("./closetSchema.js").ClosetItem} item
 * @returns {Record<string, string|number>}
 */
export function flattenItemForExport(item) {
  return {
    id:             String(item.id ?? ""),
    name:           String(item.name ?? ""),
    displayName:    String(item.displayName ?? item.name ?? ""),
    brand:          String(item.brand ?? ""),
    mainCategory:   String(item.mainCategory ?? item.category ?? ""),
    subCategory:    String(item.subCategory ?? item.subcategory ?? ""),
    styleTags:      (item.styleTags ?? []).join(","),
    season:         (item.season ?? []).join(","),
    color:          String(item.color ?? ""),
    secondaryColor: String(item.secondaryColor ?? ""),
    tags:           (item.tags ?? []).join(","),
    size:           String(item.size ?? ""),
    condition:      String(item.condition ?? ""),
    price:          Number(item.price ?? 0),
    isForSale:      item.isForSale ? "Y" : "N",
    source:         String(item.source ?? "manual"),
    notes:          String(item.notes ?? ""),
    image:          String(item.image ?? ""),
    createdAt:      String(item.createdAt ?? ""),
    updatedAt:      String(item.updatedAt ?? ""),
  };
}

/**
 * Flatten an array of items.
 * @param {ClosetItem[]} items
 * @returns {Record<string, string|number>[]}
 */
export function flattenItemsForExport(items) {
  return items.map(flattenItemForExport);
}
