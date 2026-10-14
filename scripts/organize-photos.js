/**
 * organize-photos.js
 *
 * 윤킴 옷장 사진 폴더 정리 스크립트
 *
 * 하는 일:
 *   1. 연속 파일명(IMG_0922~0924) 기준으로 같은 아이템 그룹핑
 *   2. 그룹당 최대 KEEP_PER_ITEM장만 남기고 나머지는 _removed/ 로 이동
 *   3. 3단계 폴더 → 카테고리 1단계로 평탄화
 *      예) 상의/반팔/블랙/img.jpg → 상의/img.jpg
 *
 * 실행:
 *   node scripts/organize-photos.js --dry-run   # 실제 이동 없이 미리보기
 *   node scripts/organize-photos.js             # 실제 실행
 *
 * 결과:
 *   - 원본 파일: 절대 삭제 안 함, _removed/ 폴더로 이동
 *   - organize_results.json: 무슨 일이 일어났는지 기록
 */

import fs from "fs";
import path from "path";

const PHOTOS_ROOT = "/Users/yoon/Library/CloudStorage/Dropbox/01. MAKE LEMONADE (법인)/00. 사업운영 ｜ 트렁크룸, 노브라블럼 ♥/1. 트렁크룸｜TRUNK ROOM/06. 상품관련/☆☆☆리얼윤킴옷장";
const RESULTS_FILE = path.resolve("scripts/organize_results.json");

const DRY_RUN        = process.argv.includes("--dry-run");
const KEEP_PER_ITEM  = 3;    // 아이템당 남길 최대 사진 수
const GAP_THRESHOLD  = 10;   // 파일번호 차이가 이 이상이면 다른 아이템으로 판단

// 건너뛸 폴더 (의류 아님)
const SKIP_FOLDERS = new Set(["17. 뷰티", "18. 반려동물", "19. 유아 어린이", "포토샵"]);

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function isImage(name) {
  return /\.(jpe?g|png|webp)$/i.test(name);
}

function normalize(name) {
  return name.normalize("NFC");
}

/** 파일명에서 숫자 추출 (IMG_0922.JPG → 922) */
function extractNumber(filename) {
  const match = filename.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/** 파일을 안전하게 이동 (덮어쓰기 방지) */
function moveFile(src, destDir, dryRun) {
  if (!dryRun) fs.mkdirSync(destDir, { recursive: true });

  let destName = path.basename(src);
  let dest     = path.join(destDir, destName);

  // 이름 충돌 방지
  let i = 1;
  while (!dryRun && fs.existsSync(dest)) {
    const ext  = path.extname(destName);
    const base = path.basename(destName, ext);
    dest = path.join(destDir, `${base}_${i}${ext}`);
    i++;
  }

  if (!dryRun) fs.renameSync(src, dest);
  return dest;
}

// ─── 이미지 수집 (재귀) ───────────────────────────────────────────────────────

function collectAllImages(dir, depth = 0) {
  const results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const name     = normalize(entry.name);
      const fullPath = path.join(dir, entry.name);

      if (entry.isFile() && isImage(name)) {
        results.push(fullPath);
      } else if (entry.isDirectory() && depth < 5) {
        if (!name.startsWith("_")) { // _removed 등 건너뜀
          results.push(...collectAllImages(fullPath, depth + 1));
        }
      }
    }
  } catch {}
  return results;
}

// ─── 연속 번호 기준 그룹핑 ──────────────────────────────────────────────────

/**
 * 파일 목록을 연속 번호 기준으로 그룹핑
 * IMG_0922, 0923, 0924 → 그룹 1
 * IMG_0930, 0931      → 그룹 2 (갭 > GAP_THRESHOLD)
 */
function groupByNumber(files) {
  if (files.length === 0) return [];

  // 번호 순 정렬
  const sorted = [...files].sort((a, b) => {
    const na = extractNumber(path.basename(a)) ?? 0;
    const nb = extractNumber(path.basename(b)) ?? 0;
    return na - nb;
  });

  const groups = [[sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const prev    = extractNumber(path.basename(sorted[i - 1])) ?? 0;
    const current = extractNumber(path.basename(sorted[i])) ?? 0;
    const gap     = current - prev;

    if (gap <= GAP_THRESHOLD) {
      groups[groups.length - 1].push(sorted[i]);
    } else {
      groups.push([sorted[i]]);
    }
  }

  return groups;
}

// ─── 폴더 평탄화 ──────────────────────────────────────────────────────────────

/**
 * catDir (예: .../상의) 안의 파일들을 catDir 바로 아래로 이동
 * 하위 폴더들은 모두 제거
 */
function flattenCategoryFolder(catDir, dryRun, log) {
  const allImages = collectAllImages(catDir);

  // 이미 catDir 바로 아래 있는 파일은 건너뜀
  const toMove = allImages.filter(f => path.dirname(f) !== catDir);

  for (const src of toMove) {
    let destName = path.basename(src);
    let dest     = path.join(catDir, destName);

    // 이름 충돌 방지
    let i = 1;
    while (fs.existsSync(dest) && !dryRun) {
      const ext  = path.extname(destName);
      const base = path.basename(destName, ext);
      dest = path.join(catDir, `${base}_flat${i}${ext}`);
      i++;
    }

    log.push({ action: "flatten", from: src, to: dest });
    if (!dryRun) fs.renameSync(src, dest);
  }

  // 빈 하위 폴더 삭제
  if (!dryRun) {
    for (const entry of fs.readdirSync(catDir, { withFileTypes: true })) {
      const name = normalize(entry.name);
      if (entry.isDirectory() && !name.startsWith("_")) {
        removeEmptyDirs(path.join(catDir, entry.name));
      }
    }
  }
}

function removeEmptyDirs(dir) {
  try {
    const entries = fs.readdirSync(dir);
    for (const e of entries) {
      const full = path.join(dir, e);
      if (fs.statSync(full).isDirectory()) removeEmptyDirs(full);
    }
    if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  } catch {}
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  📁 TRUNKROOM 사진 폴더 정리 스크립트");
  console.log("═══════════════════════════════════════════");
  console.log(`  DRY_RUN:       ${DRY_RUN}`);
  console.log(`  아이템당 보관:  ${KEEP_PER_ITEM}장`);
  console.log(`  번호 갭 기준:   ${GAP_THRESHOLD} 이상이면 다른 아이템`);
  console.log("═══════════════════════════════════════════\n");

  const log     = [];
  let totalKept = 0;
  let totalMoved = 0;
  let totalFlattened = 0;

  // 최상위 카테고리 폴더 순회
  const topEntries = fs.readdirSync(PHOTOS_ROOT, { withFileTypes: true });

  for (const topEntry of topEntries) {
    const catName = normalize(topEntry.name);
    const catPath = path.join(PHOTOS_ROOT, topEntry.name);

    if (!topEntry.isDirectory()) continue;
    if (SKIP_FOLDERS.has(catName)) {
      console.log(`⏭  건너뜀: ${catName}`);
      continue;
    }

    console.log(`\n📂 ${catName}`);

    // Step 1: 이 카테고리의 모든 이미지 수집
    const allImages = collectAllImages(catPath);
    console.log(`   총 ${allImages.length}장 발견`);

    if (allImages.length === 0) continue;

    // Step 2: 번호 기준 그룹핑
    const groups = groupByNumber(allImages);
    console.log(`   → ${groups.length}개 아이템 그룹`);

    // Step 3: 각 그룹에서 KEEP_PER_ITEM장만 남기기
    const removedDir = path.join(catPath, "_removed");
    let catKept  = 0;
    let catMoved = 0;

    for (const group of groups) {
      const keep   = group.slice(0, KEEP_PER_ITEM);
      const remove = group.slice(KEEP_PER_ITEM);

      catKept += keep.length;

      for (const file of remove) {
        const dest = moveFile(file, removedDir, DRY_RUN);
        log.push({ action: "remove_duplicate", from: file, to: dest, groupSize: group.length });
        catMoved++;
      }
    }

    console.log(`   ✓ 보관: ${catKept}장 / 이동: ${catMoved}장 → _removed/`);
    totalKept  += catKept;
    totalMoved += catMoved;

    // Step 4: 폴더 평탄화 (하위 폴더 없애고 catPath 바로 아래로)
    const beforeFlatten = log.length;
    flattenCategoryFolder(catPath, DRY_RUN, log);
    const flattened = log.length - beforeFlatten;
    totalFlattened += flattened;
    if (flattened > 0) console.log(`   ✓ 평탄화: ${flattened}개 파일 이동`);
  }

  // 결과 저장
  fs.writeFileSync(RESULTS_FILE, JSON.stringify({
    summary: { totalKept, totalMoved, totalFlattened, dryRun: DRY_RUN },
    actions: log,
  }, null, 2));

  console.log("\n═══════════════════════════════════════════");
  console.log("  🏁 완료");
  console.log("═══════════════════════════════════════════");
  console.log(`  📌 보관:     ${totalKept}장`);
  console.log(`  📦 이동:     ${totalMoved}장 → 각 카테고리/_removed/`);
  console.log(`  📐 평탄화:   ${totalFlattened}개 파일`);
  console.log(`  📄 로그:     ${RESULTS_FILE}`);
  if (DRY_RUN) console.log("\n  ※ DRY RUN — 실제 변경 없음. 확인 후 --dry-run 없이 실행하세요.");
}

main().catch(err => {
  console.error("❌ 오류:", err.message);
  process.exit(1);
});
