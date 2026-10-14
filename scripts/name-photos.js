/**
 * name-photos.js
 *
 * seed-photos/yoonkim 폴더의 사진들을
 * 연속 번호 기준으로 그룹핑하고,
 * 직접 사진을 보고 붙인 한국어 이름으로 파일명을 변경합니다.
 *
 * 실행:
 *   node scripts/name-photos.js --dry-run
 *   node scripts/name-photos.js
 */

import "dotenv/config";
import fs from "fs";
import path from "path";

const PHOTOS_ROOT  = "/Users/yoon/Library/CloudStorage/Dropbox/TRUNKROOM/seed-photos/yoonkim";
const RESULTS_FILE = path.resolve("scripts/name_results.json");
const DRY_RUN      = process.argv.includes("--dry-run");
const GAP          = 10; // 파일 번호 차이 이 이상이면 다른 아이템

// ─── 직접 보고 붙인 이름 ──────────────────────────────────────────────────────
// 카테고리별, 파일번호 오름차순으로 그룹핑했을 때의 순서와 일치
const NAMES = {
  "가방": [
    "퍼플_벨벳_토트백",          // IMG_0905: 보라색 벨벳 토트백, 초록 브레이드 장식
    "진저_쇼핑백",               // IMG_3019: GINGER 브랜드 쇼핑백
  ],
  "상의": [
    "블랙_레이스프릴_반팔탑",    // DEBB/debb/플랜제이: 블랙 레이스 프릴 칼라 반팔탑
    "코랄_타이프론트_크롭티",    // IMG_0104: 코랄 타이프론트 크롭티
    "레드_Bad_그래픽티",         // IMG_0168: Happening "Bad" 레드 티셔츠
    "레드_Bad_그래픽티",         // IMG_0200: 동일 아이템 (safeName이 자동 넘버링)
    "블랙_노트프론트_크롭티",    // IMG_0224: 블랙 노트/트위스트 프론트 크롭티
    "네이비_자수플라워_크롭탑",  // IMG_0255: 네이비 꽃 자수 크롭 민소매탑
    "네이비_플로럴_홀터탑",      // IMG_0291: 네이비 플로럴 프린트 홀터 탑
    "레드_스포츠_반팔탑",        // IMG_0312: 레드 화이트 스트라이프 스포츠 탑
    "옐로우_체크_홀터원피스",    // IMG_0484: 옐로우 멀티체크 홀터 원피스
    "블랙_리본백_민소매탑",      // IMG_0503: 블랙 리본 백 민소매탑
    "핑크_카툰_타이크롭티",      // IMG_0558: 핑크 카툰프린트 타이 크롭티
    "플로럴_롱기모노_가디건",    // IMG_0614: 플로럴 프린트 롱 기모노 가디건
    "블랙_메쉬_크롭탑",          // IMG_0677: 블랙 메쉬 민소매 크롭탑
    "아이보리_크롭_가디건",      // IMG_0753: 아이보리 브이넥 버튼 가디건
    "네이비_페플럼_블라우스",    // IMG_0785: 네이비 아일렛 페플럼 반팔 블라우스
    "민트_스트라이프_티셔츠",    // IMG_0887: 민트 스트라이프 브이넥 티셔츠
    "코랄_아디다스_스웨트탑",    // IMG_2962: 코랄 아디다스 샘플 스웨트탑
    "블루그레이_카울넥_부클탑",  // IMG_3024: 블루그레이 카울넥 부클레 탑
  ],
  "스포츠": [
    "연보라_르꼬끄_골프원피스",  // 르꼬끄골프+IMG_0001: 연보라/네이비 골프 원피스
    "블랙_라벤더_원피스수영복",  // IMG_0056: 블랙 라벤더 파이핑 원피스 수영복
    "핑크_마블_비치카프탄",      // IMG_0238: 핑크 마블 소용돌이 비치 카프탄
    "옐로우_배럴_서핑후디",      // IMG_0267: 옐로우 BARREL 트로피컬 서핑 후디
    "네이비_스트라이프_스포츠원피스", // IMG_0667: 네이비 금색 스트라이프 스포츠 원피스
    "버건디_민소매_탱크탑",      // IMG_0803: 버건디 플로이 민소매 탱크탑
    "버건디_알몬든_스포츠탑",    // IMG_3079: 버건디 Almondon 브랜드 스포츠 탑
  ],
  "신발": [
    "하늘색_샤넬_발레리나플랫",  // IMG_0922: 하늘색 샤넬 CC로고 발레리나 플랫
    "블랙_웨지_앵클부츠",        // IMG_3011: 블랙 레더 웨지 앵클부츠
  ],
  "아우터": [
    "화이트_레이스_크롭자켓",    // IMG_0015: 화이트 레이스 텍스처 크롭 자켓
    "베이지_라이더_가죽자켓",    // IMG_0557: 베이지 가죽 라이더 바이커 자켓
    "핑크_블랙줄무늬_퍼코트",    // IMG_0895: 블러쉬핑크 블랙 스트라이프 퍼 코트
  ],
  "액세서리": [
    "블랙_젠틀펜디_선글라스",    // IMG_0915: Gentle Monster x Fendi 콜라보 선글라스
  ],
  "원피스": [
    "그레이_랩_반팔원피스",              // 플랜제이: 그레이 멜란지 랩 반팔 원피스
    "옐로우_러플헴_민소매원피스",        // IMG_0095: 옐로우 러플 헴 스파게티 원피스
    "다크그린_스파게티_맥시원피스",      // IMG_0134: 다크그린 스파게티스트랩 맥시 원피스
    "하늘색_플러터슬리브_미니원피스",    // IMG_0206: 하늘색 플러터 슬리브 미니원피스
    "블랙_민소매_시스원피스",            // IMG_0243: 블랙 민소매 시스 원피스
    "블랙_민소매_맥시원피스",            // IMG_0285: 블랙 민소매 스퀘어넥 맥시원피스
    "옐로우_체크_홀터원피스",            // IMG_0484: 옐로우 멀티체크 홀터 맥시원피스
    "네이비_아일렛_미니원피스",          // IMG_0519: 네이비 아일렛 레이스 미니원피스
    "퍼플_오버사이즈_반팔원피스",        // IMG_0568: 퍼플 오버사이즈 반팔 코쿤원피스
    "멀티체크_홀터_오픈백원피스",        // IMG_2938: 옐로우/멀티 체크 홀터 오픈백 원피스
    "코튼_플로럴_원피스",                // IMG_2959: 코튼 플로럴 프린트 원피스
    "블랙_메쉬_원피스",                  // IMG_2999: 블랙 메쉬 탑 원피스
    "화이트_레드드레이프_원피스",        // IMG_3032: 화이트 레드 드레이프 패널 원피스
    "아이보리_기하학_스트랩원피스",      // IMG_3062: 아이보리/네이비 기하학 프린트 원피스
  ],
  "하의": [
    "베이지_11am_플리츠스커트",  // 11am_누끼: 베이지 11am 플리츠 미디스커트
    "베이지_플리츠_미디스커트",  // IMG_0053: 베이지 플리츠 미디스커트
    "틸_코끼리_사롱스커트",      // IMG_0311: 틸/블랙 코끼리 프린트 사롱 스커트
    "네이비_깅엄_체크팬츠",      // IMG_0928: 네이비 화이트 깅엄 체크 팬츠
  ],
};

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

function isImage(name) { return /\.(png|jpe?g|webp)$/i.test(name); }

function extractNum(name) {
  const m = name.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

/** 폴더 안 파일을 번호 기준으로 그룹핑 */
function groupFiles(dir) {
  const files = fs.readdirSync(dir)
    .filter(f => isImage(f) && !f.startsWith("."))
    .sort((a, b) => extractNum(a) - extractNum(b));

  if (files.length === 0) return [];

  const groups = [[files[0]]];
  for (let i = 1; i < files.length; i++) {
    const prev = extractNum(files[i - 1]);
    const cur  = extractNum(files[i]);
    if (cur - prev <= GAP) groups[groups.length - 1].push(files[i]);
    else groups.push([files[i]]);
  }
  return groups;
}

/** 파일명 중복 방지 */
function safeName(dir, baseName, ext) {
  let dest = path.join(dir, `${baseName}${ext}`);
  if (!fs.existsSync(dest)) return dest;
  let i = 2;
  while (fs.existsSync(path.join(dir, `${baseName}_${i}${ext}`))) i++;
  return path.join(dir, `${baseName}_${i}${ext}`);
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  ✏️  사진 이름 짓기 (하드코딩 버전)");
  console.log("═══════════════════════════════════════════");
  console.log(`  DRY_RUN: ${DRY_RUN}\n`);

  const results = [];
  let totalItems = 0;

  const catDirs = fs.readdirSync(PHOTOS_ROOT, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith("_"))
    .map(e => e.name)
    .sort();

  for (const cat of catDirs) {
    const catNFC  = cat.normalize("NFC");
    const catPath = path.join(PHOTOS_ROOT, cat);
    const groups  = groupFiles(catPath);
    const nameList = NAMES[catNFC] || [];

    console.log(`\n📂 ${catNFC} — ${groups.length}개 아이템`);

    if (nameList.length !== groups.length) {
      console.warn(`  ⚠  이름 목록(${nameList.length}개) ≠ 그룹 수(${groups.length}개) — 확인 필요!`);
    }

    for (let gi = 0; gi < groups.length; gi++) {
      const group    = groups[gi];
      const itemName = nameList[gi] || `미분류_${catNFC}_${gi + 1}`;

      console.log(`  ${gi + 1}. ${itemName} (${group.length}장: ${group.slice(0, 3).join(", ")}${group.length > 3 ? " ..." : ""})`);

      // 파일 이름 변경
      for (let pi = 0; pi < group.length; pi++) {
        const oldPath   = path.join(catPath, group[pi]);
        const numSuffix = group.length > 1 ? `_${String(pi + 1).padStart(2, "0")}` : "";
        const newDest   = safeName(catPath, `${itemName}${numSuffix}`, ".png");

        results.push({ category: catNFC, item: itemName, from: group[pi], to: path.basename(newDest) });

        if (!DRY_RUN && oldPath !== newDest) {
          fs.renameSync(oldPath, newDest);
        }
      }

      totalItems++;
    }
  }

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

  console.log("\n═══════════════════════════════════════════");
  console.log(`  🏁 완료 — 총 ${totalItems}개 아이템 이름 지음`);
  console.log(`  📄 로그: ${RESULTS_FILE}`);
  if (DRY_RUN) console.log("  ※ DRY RUN — --dry-run 빼고 실행하면 파일명 변경돼요.");
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
