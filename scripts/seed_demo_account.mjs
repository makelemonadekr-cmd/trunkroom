/**
 * Seed demo@trunkroom.com with closet items, a coordi, and a wear log.
 * Run: node scripts/seed_demo_account.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://obdizjrkmjwddhaeixmm.supabase.co";
const SUPABASE_KEY  = "sb_publishable_cZrxZjOpdODuOx2R_B0qmw_WvzuNja1";

const DEMO_EMAIL    = "demo@trunkroom.com";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "trunkroom1111";

const HOST = "https://trunkroom.netlify.app";

// 12 items spanning multiple categories
const ITEMS = [
  { name: "화이트 코튼 티셔츠",   brand: "MUJI",       category: "상의",   subCategory: "반팔 티셔츠", color: "화이트", season: ["봄","여름"], img: "001_5944401_500.jpg" },
  { name: "스트라이프 티셔츠",     brand: "COS",        category: "상의",   subCategory: "반팔 티셔츠", color: "네이비", season: ["봄","여름"], img: "002_5883260_500.jpg" },
  { name: "베이지 니트 가디건",   brand: "LE17SEPTEMBRE", category: "상의", subCategory: "가디건",     color: "베이지", season: ["봄","가을"], img: "003_5910173_500.jpg" },
  { name: "오버핏 옥스포드 셔츠", brand: "UNIQLO",     category: "상의",   subCategory: "셔츠",        color: "라이트블루", season: ["봄","가을"], img: "004_6056141_500.jpg" },
  { name: "블랙 와이드 슬랙스",    brand: "INSILENCE",  category: "하의",   subCategory: "슬랙스",      color: "블랙",   season: ["가을","겨울"], img: "081_5893609_500.jpg" },
  { name: "데님 스트레이트 진",   brand: "LEVIS",      category: "하의",   subCategory: "청바지",      color: "블루",   season: ["봄","가을","겨울"], img: "082_6307110_500.jpg" },
  { name: "베이지 코튼 팬츠",      brand: "ANDERSSON BELL", category: "하의", subCategory: "슬랙스",   color: "베이지", season: ["봄","가을"], img: "083_6173901_500.jpg" },
  { name: "오버사이즈 트렌치코트",brand: "MAX MARA",   category: "아우터", subCategory: "트렌치코트",  color: "베이지", season: ["봄","가을"], img: "151_6074752_500.jpg" },
  { name: "블랙 레더 자켓",        brand: "ACNE",       category: "아우터", subCategory: "레더재킷",   color: "블랙",   season: ["봄","가을"], img: "152_6306414_500.jpg" },
  { name: "체크 패턴 미디 스커트",brand: "TOTEME",     category: "하의",   subCategory: "미디스커트",  color: "체크",   season: ["봄","가을"], img: "153_6314323_500.jpg" },
  { name: "화이트 스니커즈",       brand: "AXEL ARIGATO",category: "신발",  subCategory: "스니커즈",   color: "화이트", season: ["봄","여름","가을"], img: "201_6197990_500.jpg" },
  { name: "블랙 토트백",           brand: "POLENE",     category: "가방",   subCategory: "토트백",      color: "블랙",   season: ["봄","여름","가을","겨울"], img: "202_5873760_500.jpg" },
];

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Sign in as demo
  console.log(`🔐 Signing in as ${DEMO_EMAIL}…`);
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (authErr) {
    console.error("❌ Login failed:", authErr.message);
    process.exit(1);
  }
  const userId = auth.user.id;
  console.log(`✓ Logged in. user_id = ${userId}`);

  // 2. Clear any previously seeded data for clean re-runs.
  // Order matters: wear_logs first (references items), then styles (cascades style_items),
  // then clothing_items last.
  console.log("🧹 Clearing existing wear_logs / styles / closet items…");
  await supabase.from("wear_logs").delete().eq("user_id", userId);
  // Get existing style ids so we can blow away orphaned style_items first
  const { data: existing } = await supabase.from("styles").select("id").eq("user_id", userId);
  if (existing?.length) {
    await supabase.from("style_items").delete().in("style_id", existing.map((s) => s.id));
  }
  await supabase.from("styles").delete().eq("user_id", userId);
  const { error: delErr } = await supabase.from("clothing_items").delete().eq("user_id", userId);
  if (delErr) console.warn("  (delete warn — ok if first run):", delErr.message);

  // 3. Insert clothing items
  console.log(`👕 Inserting ${ITEMS.length} closet items…`);
  const rows = ITEMS.map((it) => ({
    user_id:       userId,
    name:          it.name,
    display_name:  it.name,
    brand:         it.brand,
    main_category: it.category,
    sub_category:  it.subCategory,
    style_tags:    [],
    season:        it.season,
    color:         it.color,
    image_url:     `${HOST}/assets/images/items/${it.img}`,
    image_urls:    [`${HOST}/assets/images/items/${it.img}`],
    price:         0,
    is_for_sale:   false,
    sell_status:   "not_listed",
    source:        "manual",
    is_public:     true,
  }));

  const { data: insertedItems, error: itemErr } = await supabase
    .from("clothing_items")
    .insert(rows)
    .select();
  if (itemErr) {
    console.error("❌ Item insert failed:", itemErr.message);
    process.exit(1);
  }
  console.log(`✓ Inserted ${insertedItems.length} items`);

  // 4. Create a style (코디)
  console.log("🎨 Creating a sample style…");
  const ids = insertedItems.map((i) => i.id);
  const today = new Date().toISOString().slice(0, 10);

  const styleRows = [
    { title: "오늘의 데일리룩",   date_str: today, mood: "casual", picks: [ids[0], ids[4], ids[10]] },
    { title: "주말 카페 외출",     date_str: today, mood: "comfy",  picks: [ids[2], ids[5], ids[10], ids[11]] },
  ];

  for (const s of styleRows) {
    const { data: style, error: sErr } = await supabase
      .from("styles")
      .insert({
        user_id:        userId,
        title:          s.title,
        date_str:       s.date_str,
        mood:           s.mood,
        template_id:    "board",
        is_public:      false,
      })
      .select()
      .single();
    if (sErr) { console.warn("  style insert err:", sErr.message); continue; }

    const itemRows = s.picks.map((id, idx) => {
      const it = insertedItems.find((x) => x.id === id);
      return {
        style_id:         style.id,
        clothing_item_id: id,
        item_image_url:   it?.image_url ?? null,
        item_name:        it?.name      ?? null,
        layer_order:      idx,
      };
    });
    const { error: siErr } = await supabase.from("style_items").insert(itemRows);
    if (siErr) console.warn("  style_items err:", siErr.message);
    else console.log(`  ✓ "${s.title}" (${s.picks.length} items)`);
  }

  // 5. Insert a wear log
  console.log("📅 Adding a wear log for today…");
  const { error: logErr } = await supabase.from("wear_logs").upsert({
    user_id:  userId,
    date_str: today,
    item_ids: [ids[0], ids[4], ids[10]],
    note:     "데일리 출근룩",
  }, { onConflict: "user_id,date_str" });
  if (logErr) console.warn("  wear_log err:", logErr.message);
  else console.log("  ✓ Wear log added");

  console.log("\n🎉 All done!");
}

main().catch((e) => { console.error(e); process.exit(1); });
