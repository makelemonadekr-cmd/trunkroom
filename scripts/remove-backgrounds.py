"""
remove-backgrounds.py

seed-photos/yoonkim 폴더의 모든 사진 배경을 제거합니다.
rembg 라이브러리 사용 — 완전 무료, 로컬 실행.

실행:
  python3 scripts/remove-backgrounds.py --dry-run   # 미리보기
  python3 scripts/remove-backgrounds.py             # 실제 실행

결과:
  - 원본 파일: 그대로 유지 (_orig 폴더에 백업)
  - 배경 제거된 PNG로 교체
"""

import os
import sys
import json
import shutil
from pathlib import Path

try:
    from rembg import remove
    from PIL import Image
    import io
except ImportError:
    print("❌ 필요한 패키지가 없어요. 실행하세요:")
    print("   pip3 install rembg pillow")
    sys.exit(1)

# ─── 설정 ────────────────────────────────────────────────────────────────────

PHOTOS_ROOT = Path("/Users/yoon/Library/CloudStorage/Dropbox/TRUNKROOM/seed-photos/yoonkim")
RESULTS_FILE = Path("scripts/remove_bg_results.json")
DRY_RUN = "--dry-run" in sys.argv

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

# ─── 메인 ────────────────────────────────────────────────────────────────────

def collect_images():
    images = []
    for cat_dir in sorted(PHOTOS_ROOT.iterdir()):
        if not cat_dir.is_dir() or cat_dir.name.startswith("_"):
            continue
        for f in sorted(cat_dir.iterdir()):
            if f.is_file() and f.suffix.lower() in IMAGE_EXTS:
                # 이미 배경 제거된 PNG는 건너뜀 (_orig 백업이 있는 경우)
                orig_backup = f.parent / "_orig" / f.name
                if f.suffix.lower() == ".png" and orig_backup.exists():
                    continue
                images.append(f)
    return images

def process_image(img_path: Path) -> dict:
    """배경 제거 후 PNG로 저장, 원본은 _orig/ 백업"""
    orig_dir = img_path.parent / "_orig"
    orig_dir.mkdir(exist_ok=True)

    # 원본 백업
    backup_path = orig_dir / img_path.name
    if not backup_path.exists():
        shutil.copy2(img_path, backup_path)

    # 배경 제거
    with open(img_path, "rb") as f:
        input_data = f.read()

    output_data = remove(input_data)

    # PNG로 저장 (배경 투명)
    new_path = img_path.with_suffix(".png")
    with open(new_path, "wb") as f:
        f.write(output_data)

    # 원본이 jpg였으면 삭제 (png로 교체됨)
    if img_path.suffix.lower() in {".jpg", ".jpeg"} and new_path != img_path:
        img_path.unlink()

    return {
        "file": str(img_path),
        "result": str(new_path),
        "status": "ok"
    }

def main():
    print("═══════════════════════════════════════════")
    print("  🎨 배경 제거 스크립트 (rembg - 무료)")
    print("═══════════════════════════════════════════")
    print(f"  DRY_RUN: {DRY_RUN}")
    print()

    images = collect_images()
    print(f"📸 처리할 사진: {len(images)}장")

    if DRY_RUN:
        for img in images[:10]:
            print(f"  → {img.parent.name}/{img.name}")
        if len(images) > 10:
            print(f"  ... 외 {len(images)-10}장")
        print("\n✅ DRY RUN 완료. --dry-run 없이 실행하면 실제 처리돼요.")
        return

    results = []
    ok = 0
    errors = 0

    for i, img_path in enumerate(images, 1):
        rel = f"{img_path.parent.name}/{img_path.name}"
        print(f"[{i}/{len(images)}] {rel} ", end="", flush=True)

        try:
            result = process_image(img_path)
            print("✓")
            results.append(result)
            ok += 1
        except Exception as e:
            print(f"❌ {e}")
            results.append({"file": str(img_path), "status": "error", "reason": str(e)})
            errors += 1

        # 중간 저장 (중단해도 안전)
        if i % 10 == 0:
            RESULTS_FILE.write_text(json.dumps(results, indent=2, ensure_ascii=False))

    RESULTS_FILE.write_text(json.dumps(results, indent=2, ensure_ascii=False))

    print()
    print("═══════════════════════════════════════════")
    print("  🏁 완료")
    print("═══════════════════════════════════════════")
    print(f"  ✅ 성공: {ok}장")
    print(f"  ❌ 실패: {errors}장")
    print(f"  📁 원본 백업: 각 카테고리/_orig/ 폴더")
    print(f"  📄 로그: {RESULTS_FILE}")

if __name__ == "__main__":
    main()
