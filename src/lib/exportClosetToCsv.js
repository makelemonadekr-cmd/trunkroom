/**
 * exportClosetToCsv.js
 *
 * Exports closet items to a UTF-8 CSV file and triggers a browser download.
 *
 * Usage:
 *   import { exportClosetToCsv } from "./exportClosetToCsv.js";
 *   exportClosetToCsv(items);
 *
 * To connect to a "내보내기" button:
 *   <button onClick={() => exportClosetToCsv(getClosetItems())}>내보내기</button>
 */

import { EXPORT_COLUMNS, flattenItemsForExport } from "./closetExportSchema.js";

/**
 * Escape a single CSV cell value.
 * Wraps in quotes if the value contains commas, quotes, or newlines.
 * @param {string|number} value
 * @returns {string}
 */
function escapeCell(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of flat row objects into a CSV string.
 * First row is the Korean header.
 * @param {Record<string, string|number>[]} rows
 * @returns {string}
 */
export function rowsToCsvString(rows) {
  if (!rows.length) return "";

  const header = EXPORT_COLUMNS.map((c) => escapeCell(c.koLabel)).join(",");
  const body   = rows.map((row) =>
    EXPORT_COLUMNS.map((c) => escapeCell(row[c.key] ?? "")).join(",")
  );

  return [header, ...body].join("\r\n");
}

/**
 * Trigger a browser download of a CSV file.
 * @param {string} csvString
 * @param {string} filename
 */
function downloadCsv(csvString, filename) {
  // Add BOM for correct Korean display in Excel
  const bom     = "\uFEFF";
  const blob    = new Blob([bom + csvString], { type: "text/csv;charset=utf-8;" });
  const url     = URL.createObjectURL(blob);
  const link    = document.createElement("a");
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export closet items to a downloadable CSV file.
 *
 * @param {import("./closetSchema.js").ClosetItem[]} items
 * @param {string} [filename] — default: trunkroom_closet_YYYY-MM-DD.csv
 */
export function exportClosetToCsv(items, filename) {
  const rows = flattenItemsForExport(items);
  const csv  = rowsToCsvString(rows);
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(csv, filename ?? `trunkroom_closet_${date}.csv`);
}
