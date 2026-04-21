/**
 * mapClosetItemToNotion.js
 *
 * Maps a ClosetItem to a Notion database page properties object.
 *
 * ─── HOW TO CONNECT TO NOTION LATER ────────────────────────────────────────
 *
 * 1. Create a Notion database with these properties:
 *    (Column names match EXPORT_COLUMNS koLabel values — see closetExportSchema.js)
 *
 *    이름         Title
 *    표시명       Text
 *    브랜드       Text
 *    카테고리     Select
 *    세부 카테고리 Select
 *    스타일       Multi-select
 *    시즌         Multi-select
 *    색상         Text
 *    태그         Multi-select
 *    사이즈       Text
 *    컨디션       Select
 *    가격 (원)    Number
 *    판매중       Checkbox
 *    등록 방법    Select
 *    메모         Text
 *    이미지 URL   URL
 *    등록일       Date
 *    수정일       Date
 *
 * 2. Get your Notion integration token: https://www.notion.so/my-integrations
 *    Share the database with your integration.
 *
 * 3. Install the Notion SDK:  npm install @notionhq/client
 *
 * 4. In your server (server/index.js), add:
 *
 *    import { Client } from "@notionhq/client";
 *    import { mapClosetItemToNotionProperties } from "../src/lib/mapClosetItemToNotion.js";
 *
 *    const notion = new Client({ auth: process.env.NOTION_API_KEY });
 *
 *    app.post("/api/export-to-notion", express.json(), async (req, res) => {
 *      const { items, databaseId } = req.body;
 *      const results = [];
 *      for (const item of items) {
 *        const page = await notion.pages.create({
 *          parent:     { database_id: databaseId },
 *          properties: mapClosetItemToNotionProperties(item),
 *        });
 *        results.push(page.id);
 *      }
 *      res.json({ exported: results.length });
 *    });
 *
 * 5. Add NOTION_API_KEY to your .env file.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Map a ClosetItem to a Notion page properties object.
 * The property names match the Korean database column names above.
 *
 * @param {import("./closetSchema.js").ClosetItem} item
 * @returns {object} Notion properties payload
 */
export function mapClosetItemToNotionProperties(item) {
  const toText  = (v)  => ({ rich_text: [{ text: { content: String(v ?? "") } }] });
  const toTitle = (v)  => ({ title:     [{ text: { content: String(v ?? "") } }] });
  const toSelect = (v) => v ? { select: { name: String(v) } } : { select: null };
  const toMulti = (arr) => ({
    multi_select: (arr ?? []).filter(Boolean).map((n) => ({ name: String(n) })),
  });
  const toNum   = (v)  => ({ number: Number(v ?? 0) });
  const toCheck = (v)  => ({ checkbox: Boolean(v) });
  const toUrl   = (v)  => v ? { url: String(v) } : { url: null };
  const toDate  = (v)  => v ? { date: { start: String(v).slice(0, 10) } } : { date: null };

  return {
    "이름":          toTitle(item.name ?? item.displayName),
    "표시명":        toText(item.displayName ?? item.name),
    "브랜드":        toText(item.brand),
    "카테고리":      toSelect(item.mainCategory ?? item.category),
    "세부 카테고리": toSelect(item.subCategory ?? item.subcategory),
    "스타일":        toMulti(item.styleTags),
    "시즌":          toMulti(item.season),
    "색상":          toText(item.color),
    "태그":          toMulti(item.tags),
    "사이즈":        toText(item.size),
    "컨디션":        toSelect(item.condition),
    "가격 (원)":     toNum(item.price),
    "판매중":        toCheck(item.isForSale),
    "등록 방법":     toSelect(item.source ?? "manual"),
    "메모":          toText(item.notes),
    "이미지 URL":    toUrl(item.image),
    "등록일":        toDate(item.createdAt),
    "수정일":        toDate(item.updatedAt),
  };
}

/**
 * Preview the Notion properties for an item (for debugging).
 * @param {import("./closetSchema.js").ClosetItem} item
 */
export function previewNotionProperties(item) {
  const props = mapClosetItemToNotionProperties(item);
  console.table(
    Object.entries(props).map(([key, val]) => ({
      property: key,
      value:    JSON.stringify(val),
    }))
  );
  return props;
}
