/**
 * exportClosetToXlsx.js
 *
 * Exports closet items as an XLSX file.
 *
 * Strategy: generates a minimal XLSX (Office Open XML) without external libraries,
 * keeping the bundle small. Each column uses the Korean label as the header.
 *
 * To use a full XLSX library (e.g. SheetJS / xlsx) later:
 *   1. npm install xlsx
 *   2. Replace the body of exportClosetToXlsx with:
 *        import * as XLSX from "xlsx";
 *        const ws = XLSX.utils.json_to_sheet(rows, { header: keys });
 *        const wb = XLSX.utils.book_new();
 *        XLSX.utils.book_append_sheet(wb, ws, "내 옷장");
 *        XLSX.writeFile(wb, filename);
 *
 * Current implementation exports a well-formed minimal XLSX that opens in Excel/Numbers/Sheets.
 */

import { EXPORT_COLUMNS, flattenItemsForExport } from "./closetExportSchema.js";

// ─── Minimal XLSX builder ─────────────────────────────────────────────────────

/** XML-escape a cell value */
function xmlEscape(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Build the shared strings XML and a string → index map */
function buildSharedStrings(rows) {
  const map   = new Map();
  const items = [];

  function add(str) {
    const key = String(str ?? "");
    if (!map.has(key)) {
      map.set(key, items.length);
      items.push(key);
    }
    return map.get(key);
  }

  // Headers
  EXPORT_COLUMNS.forEach((c) => add(c.koLabel));
  // Data rows
  rows.forEach((row) =>
    EXPORT_COLUMNS.forEach((c) => {
      const v = row[c.key] ?? "";
      if (c.notionType !== "number") add(String(v));
    })
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
    ` count="${items.length}" uniqueCount="${items.length}">`,
    ...items.map((s) => `<si><t>${xmlEscape(s)}</t></si>`),
    "</sst>",
  ].join("\n");

  return { xml, map };
}

/** Convert 0-based column index to Excel column letter (A, B, …, Z, AA, …) */
function colLetter(idx) {
  let result = "";
  let n = idx;
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
}

/** Build the worksheet XML */
function buildWorksheet(rows, ssMap) {
  const numCols  = EXPORT_COLUMNS.length;
  const numRows  = rows.length + 1; // +1 for header

  const cells = [];

  const addCell = (r, c, value, isNumber = false) => {
    const ref = `${colLetter(c)}${r + 1}`;
    if (isNumber) {
      cells.push(`<c r="${ref}"><v>${Number(value) || 0}</v></c>`);
    } else {
      const si = ssMap.get(String(value ?? "")) ?? 0;
      cells.push(`<c r="${ref}" t="s"><v>${si}</v></c>`);
    }
  };

  // Header row
  EXPORT_COLUMNS.forEach((col, ci) => addCell(0, ci, col.koLabel));

  // Data rows
  rows.forEach((row, ri) => {
    EXPORT_COLUMNS.forEach((col, ci) => {
      const v        = row[col.key] ?? "";
      const isNumber = col.notionType === "number";
      addCell(ri + 1, ci, isNumber ? v : String(v), isNumber);
    });
  });

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    `<dimension ref="A1:${colLetter(numCols - 1)}${numRows}"/>`,
    "<sheetData>",
    ...cells.map((c) => c),
    "</sheetData>",
    "</worksheet>",
  ].join("\n");
}

/** Pack files into a ZIP-like XLSX (OOXML) using JSZip-free approach */
async function buildXlsx(sheetXml, sharedStringsXml) {
  // We import JSZip lazily so it's tree-shaken if not used.
  // If JSZip is not available, fall back to CSV.
  let JSZip;
  try {
    JSZip = (await import("jszip")).default;
  } catch {
    return null; // signal caller to fall back
  }

  const zip = new JSZip();

  zip.file("[Content_Types].xml", [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>',
    '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>',
    "</Types>",
  ].join("\n"));

  zip.file("_rels/.rels", [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
    "</Relationships>",
  ].join("\n"));

  zip.file("xl/workbook.xml", [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    "<sheets><sheet name=\"내 옷장\" sheetId=\"1\" r:id=\"rId1\"/></sheets>",
    "</workbook>",
  ].join("\n"));

  zip.file("xl/_rels/workbook.xml.rels", [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>',
    "</Relationships>",
  ].join("\n"));

  zip.file("xl/worksheets/sheet1.xml", sheetXml);
  zip.file("xl/sharedStrings.xml", sharedStringsXml);

  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

// ─── Public export function ───────────────────────────────────────────────────

/**
 * Export closet items as an XLSX file and trigger a browser download.
 * Falls back to CSV if JSZip is not installed.
 *
 * @param {import("./closetSchema.js").ClosetItem[]} items
 * @param {string} [filename]
 */
export async function exportClosetToXlsx(items, filename) {
  const rows               = flattenItemsForExport(items);
  const { xml: ssXml, map } = buildSharedStrings(rows);
  const sheetXml           = buildWorksheet(rows, map);
  const date               = new Date().toISOString().slice(0, 10);
  const fname              = filename ?? `trunkroom_closet_${date}.xlsx`;

  const blob = await buildXlsx(sheetXml, ssXml);

  if (!blob) {
    // JSZip not installed — fall back to CSV
    const { exportClosetToCsv } = await import("./exportClosetToCsv.js");
    exportClosetToCsv(items, fname.replace(".xlsx", ".csv"));
    console.warn("[exportClosetToXlsx] JSZip not found — exported as CSV instead. Run: npm install jszip");
    return;
  }

  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = fname;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
