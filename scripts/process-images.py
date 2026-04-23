#!/usr/bin/env python3
"""
TRUNKROOM Image Processing Pipeline
====================================
Processes, classifies, and organizes all sample clothes images into
structured assets for use in the app.

Three image sources:
  1. Numbered (001-300): Musinsa product shots  → item images
  2. snap_xxx          : Musinsa snap/outfit feed → coordi images
  3. pin_xxx           : Pinterest fashion pins   → coordi images

Usage:
  python3 scripts/process-images.py [--dry-run] [--force]

  --dry-run   Scan and classify only; do not copy or write files
  --force     Re-process even if output already exists

Output:
  public/assets/images/items/    ← clean product shot images
  public/assets/images/coordi/   ← face-cropped style/outfit images
  src/constants/imageAssets.json ← full metadata for app consumption
  scripts/processing-log.json    ← detailed per-image processing log
"""

import os
import sys
import json
import csv
import shutil
import argparse
from pathlib import Path
from datetime import datetime

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("WARNING: OpenCV not found. Run: pip3 install opencv-python-headless")

# ─────────────────────────────────────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR    = Path(__file__).parent.resolve()
PROJECT_ROOT  = SCRIPT_DIR.parent
SOURCE_DIR    = PROJECT_ROOT / "sample-clothes-image"
META_DIR      = SOURCE_DIR / "_metadata"
OUTPUT_ITEMS  = PROJECT_ROOT / "public" / "assets" / "images" / "items"
OUTPUT_COORD  = PROJECT_ROOT / "public" / "assets" / "images" / "coordi"
METADATA_OUT  = PROJECT_ROOT / "src" / "constants" / "imageAssets.json"
LOG_OUT       = SCRIPT_DIR / "processing-log.json"

# ─────────────────────────────────────────────────────────────────────────────
# KOREAN PRODUCT CATEGORY CLASSIFIER
# ─────────────────────────────────────────────────────────────────────────────

CATEGORY_KEYWORDS = {
    "tops": [
        # Korean
        "티셔츠", "니트", "스웨터", "후디", "후드", "맨투맨", "셔츠", "블라우스",
        "탑", "크롭", "긴소매", "반소매", "폴로", "피케", "기타 상의",
        # Korean short forms
        " 티 ", " 티-", "_티_",  # "긴팔 티" style names
        # English (lowercase matched)
        "t-shirt", "tee", "knit", "sweater", "sweatshirt", "hoodie", "shirt",
        "blouse", "polo", " top", "_top",
    ],
    "bottoms": [
        # Korean
        "팬츠", "바지", "스커트", "청바지", "데님", "반바지", "숏", "쇼츠",
        "레깅스", "슬랙스", "치마", "오버올",
        # Korean alternate jeans
        " 진", "_진",  # "501® 핏 진" style
        # English
        "pants", " pant", "jeans", "denim", "shorts", "skirt", "trousers", "legging",
        "overall",
    ],
    "outerwear": [
        # Korean
        "자켓", "재킷", "코트", "점퍼", "아우터", "패딩", "야상", "트렌치",
        "카디건", "가디건", "블레이저", "무스탕", "집업", "플리스", "베스트", "조끼",
        "윈드브레이커", "바람막이", "아노락", "윈드 브레이커",
        # English
        "jacket", "coat", "cardigan", "blazer", "windbreaker", "puffer",
        "fleece", "vest", "trench", "anorak",
    ],
    "dress": [
        "원피스", "드레스",
        "dress",
    ],
    "shoes": [
        # Korean
        "신발", "슈즈", "스니커즈", "부츠", "샌들", "슬리퍼", "로퍼",
        "플랫", "힐", "운동화", "구두",
        # English
        "shoes", "sneakers", "boots", "sandals", "loafer", "heel",
    ],
    "bags": [
        # Korean
        "가방", "숄더백", "크로스백", "토트백", "파우치", "클러치",
        "미니백", "에코백",
        # English (avoid "백" alone as it matches too broadly)
        "bag", "backpack", "tote", "clutch", "pouch",
    ],
    "accessories": [
        # Korean
        "모자", "캡", "양말", "벨트", "목걸이", "반지", "선글라스",
        "귀걸이", "스카프", "머플러", "장갑",
        # English
        "hat", "cap", "socks", "belt", "necklace", "ring", "sunglasses",
        "earring", "scarf", "gloves",
    ],
    "set": [
        "세트", "투피스", "셋업",
        "set", "two-piece",
    ],
}

def classify_from_name(product_name: str) -> str:
    """
    Classify clothing category from Korean or English product name.
    Matching is case-insensitive. Categories are checked in priority order
    so more specific matches win.
    """
    name = product_name.lower()
    # Priority order: more specific first
    priority = ["dress", "set", "shoes", "bags", "accessories",
                "outerwear", "bottoms", "tops"]
    for category in priority:
        for kw in CATEGORY_KEYWORDS[category]:
            if kw.lower() in name:
                return category
    return "unknown"


# ─────────────────────────────────────────────────────────────────────────────
# METADATA LOADERS
# ─────────────────────────────────────────────────────────────────────────────

def load_products_meta() -> dict:
    """Load products.json → keyed by product_id."""
    path = META_DIR / "products.json"
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    by_id = {}
    for p in data.get("products", []):
        # Extract product_id from local_image_path stem
        # Format: NNN_PRODUCTID_500.jpg
        fname = Path(p["local_image_path"]).name
        by_id[fname] = p
    return by_id


def load_snaps_meta() -> dict:
    """Load snaps.csv → keyed by filename."""
    path = META_DIR / "snaps.csv"
    if not path.exists():
        return {}
    by_file = {}
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            fname = Path(row["local_image_path"]).name
            by_file[fname] = row
    return by_file


def load_pins_meta() -> dict:
    """Load pins.json → keyed by filename."""
    path = META_DIR / "pins.json"
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    by_file = {}
    for p in data.get("pins", []):
        fname = Path(p["local_image_path"]).name
        by_file[fname] = p
    return by_file


# ─────────────────────────────────────────────────────────────────────────────
# FACE DETECTION & CROPPING
# ─────────────────────────────────────────────────────────────────────────────

def load_face_cascades():
    if not CV2_AVAILABLE:
        return None, None
    cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    cascade_alt = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml"
    )
    return cascade, cascade_alt


def detect_faces(img_bgr, cascade, cascade_alt) -> list:
    """Detect faces using two Haar cascades (frontal + alt). Returns list of (x,y,w,h)."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)

    results = []
    for casc in (cascade, cascade_alt):
        faces = casc.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40),
            flags=cv2.CASCADE_SCALE_IMAGE,
        )
        if len(faces) > 0:
            results.extend(faces.tolist())
    return results


def crop_below_faces(img_bgr, faces: list, padding_ratio: float = 0.3):
    """
    Crop the image to remove faces from the top.

    Strategy:
    - Find the lowest 'face bottom' across all detected faces
    - Add padding = padding_ratio × face_height below the chin
    - Crop from that point downward (full width)
    - Reject if less than 35% of original height remains

    Returns: (cropped_bgr | None, crop_info_dict)
    """
    h, w = img_bgr.shape[:2]

    crop_start = 0
    for (fx, fy, fw, fh) in faces:
        candidate = fy + fh + int(fh * padding_ratio)
        crop_start = max(crop_start, candidate)

    # Safety: never crop past 75% of image height
    crop_start = min(crop_start, int(h * 0.75))
    remaining_h = h - crop_start
    remaining_ratio = remaining_h / h

    if remaining_ratio < 0.35:
        return None, {
            "crop_applied": False,
            "excluded": True,
            "exclude_reason": "face_dominant",
            "face_count": len(faces),
            "crop_start_y": crop_start,
            "remaining_ratio": round(remaining_ratio, 3),
        }

    cropped = img_bgr[crop_start:h, 0:w]
    return cropped, {
        "crop_applied": True,
        "excluded": False,
        "face_count": len(faces),
        "original_size": [w, h],
        "crop_start_y": crop_start,
        "cropped_size": [w, remaining_h],
        "remaining_ratio": round(remaining_ratio, 3),
    }


# ─────────────────────────────────────────────────────────────────────────────
# PROCESSORS
# ─────────────────────────────────────────────────────────────────────────────

def process_item(src: Path, dst: Path, meta: dict, dry_run: bool) -> dict:
    """
    Process a Musinsa product-shot image.
    - Copies to output/items (no face detection needed)
    - Enriches with product metadata (name, brand, price, category)
    """
    product_name = meta.get("product_name", "")
    category = classify_from_name(product_name) if product_name else "unknown"

    record = {
        "id":                  src.stem,
        "type":                "item",
        "source":              "musinsa_product",
        "original_filename":   src.name,
        "original_path":       f"sample-clothes-image/{src.name}",
        "processed_path":      f"assets/images/items/{dst.name}",
        "app_url":             f"/assets/images/items/{dst.name}",
        "category":            category,
        "needs_category_review": category == "unknown",
        # Product metadata
        "product_id":          meta.get("product_id"),
        "product_name":        product_name,
        "brand_name":          meta.get("brand_name"),
        "brand_id":            meta.get("brand_id"),
        "price":               meta.get("final_price"),
        "original_price":      meta.get("original_price"),
        "discount_ratio":      meta.get("discount_ratio"),
        "product_url":         meta.get("product_url"),
        "rank":                meta.get("rank"),
        # Processing
        "face_detected":       False,
        "crop_applied":        False,
        "excluded":            False,
        "recommended_for":     ["item_display"],
    }

    if not dry_run:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)

    return record


def process_coordi(src: Path, dst: Path, meta: dict, source_type: str,
                   dry_run: bool, cascade, cascade_alt) -> dict:
    """
    Process a snap or Pinterest pin image.
    - Detects faces via Haar cascades
    - Crops below face area if found
    - Saves to output/coordi
    """
    record = {
        "id":                  src.stem,
        "type":                "coordi",
        "source":              source_type,
        "original_filename":   src.name,
        "original_path":       f"sample-clothes-image/{src.name}",
        "processed_path":      f"assets/images/coordi/{dst.name}",
        "app_url":             f"/assets/images/coordi/{dst.name}",
        "category":            "outfit",
        "face_detected":       False,
        "crop_applied":        False,
        "excluded":            False,
        "recommended_for":     ["coordi_display", "style_display"],
    }

    # Attach source-specific metadata
    if source_type == "musinsa_snap":
        record["snap_id"]  = meta.get("snap_id")
        record["snap_url"] = meta.get("snap_url")
    elif source_type == "pinterest_pin":
        record["pin_id"]         = meta.get("pin_id")
        record["pin_url"]        = meta.get("pin_url")
        record["dominant_color"] = meta.get("dominant_color")
        record["description"]    = meta.get("description")
        record["board_name"]     = meta.get("board_name")

    try:
        if not CV2_AVAILABLE or cascade is None:
            if not dry_run:
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)
            return record

        img = cv2.imread(str(src))
        if img is None:
            record["excluded"] = True
            record["exclude_reason"] = "unreadable"
            return record

        h, w = img.shape[:2]
        record["original_size"] = [w, h]

        faces = detect_faces(img, cascade, cascade_alt)
        record["face_detected"] = len(faces) > 0
        record["face_count"]    = len(faces)

        if len(faces) > 0:
            cropped, crop_info = crop_below_faces(img, faces)
            record.update(crop_info)

            if record.get("excluded"):
                return record  # Face dominant — skip

            if not dry_run:
                dst.parent.mkdir(parents=True, exist_ok=True)
                # Use JPEG quality params only for JPEG outputs; PNG uses lossless by default
                if dst.suffix.lower() in (".jpg", ".jpeg"):
                    cv2.imwrite(str(dst), cropped, [cv2.IMWRITE_JPEG_QUALITY, 90])
                else:
                    cv2.imwrite(str(dst), cropped)
        else:
            # No face — copy as-is
            if not dry_run:
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)

    except Exception as e:
        record["excluded"]       = True
        record["exclude_reason"] = f"error: {e}"

    return record


# ─────────────────────────────────────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def run_pipeline(dry_run: bool = False, force: bool = False):
    start_time = datetime.now()
    print(f"\n{'='*60}")
    print("TRUNKROOM Image Processing Pipeline")
    print(f"{'='*60}")
    print(f"Source:   {SOURCE_DIR}")
    print(f"Items  →  {OUTPUT_ITEMS}")
    print(f"Coordi →  {OUTPUT_COORD}")
    print(f"Dry run: {dry_run} | Force: {force}")
    print(f"{'='*60}\n")

    if not SOURCE_DIR.exists():
        print(f"ERROR: Source not found: {SOURCE_DIR}")
        sys.exit(1)

    # Load metadata from all three sources
    print("Loading metadata…")
    products_meta = load_products_meta()
    snaps_meta    = load_snaps_meta()
    pins_meta     = load_pins_meta()
    print(f"  → {len(products_meta)} product records")
    print(f"  → {len(snaps_meta)} snap records")
    print(f"  → {len(pins_meta)} pin records\n")

    # Load face detectors
    cascade, cascade_alt = load_face_cascades()
    if CV2_AVAILABLE:
        print("✓ OpenCV face detectors loaded\n")

    # Gather all image files
    image_exts = {".jpg", ".jpeg", ".png", ".webp"}
    all_files = sorted([f for f in SOURCE_DIR.iterdir()
                         if f.suffix.lower() in image_exts])
    print(f"✓ Found {len(all_files)} image files")

    item_files   = [f for f in all_files if f.name[0].isdigit()]
    snap_files   = [f for f in all_files if f.name.startswith("snap_")]
    pin_files    = [f for f in all_files if f.name.startswith("pin_")]
    other_files  = [f for f in all_files
                    if not f.name[0].isdigit()
                    and not f.name.startswith("snap_")
                    and not f.name.startswith("pin_")]

    print(f"  → {len(item_files)} Musinsa product images (items)")
    print(f"  → {len(snap_files)} Musinsa snap images  (coordi)")
    print(f"  → {len(pin_files)} Pinterest pin images  (coordi)")
    print(f"  → {len(other_files)} other files (skipped)\n")

    records = []
    stats = {
        "total_scanned":           len(all_files),
        "item_count":              0,
        "coordi_count":            0,
        "face_detected":           0,
        "crop_applied":            0,
        "face_dominant_excluded":  0,
        "error_excluded":          0,
        "other_skipped":           len(other_files),
        "category_breakdown":      {},
    }

    # ── 1. Process item images ────────────────────────────────────────────────
    print(f"Processing {len(item_files)} item images…")
    for i, src in enumerate(item_files, 1):
        dst = OUTPUT_ITEMS / src.name
        if not force and not dry_run and dst.exists():
            # Rebuild minimal record for existing file
            meta = products_meta.get(src.name, {})
            pname = meta.get("product_name", "")
            cat   = classify_from_name(pname) if pname else "unknown"
            rec = {
                "id": src.stem, "type": "item", "source": "musinsa_product",
                "original_filename": src.name,
                "original_path": f"sample-clothes-image/{src.name}",
                "processed_path": f"assets/images/items/{src.name}",
                "app_url": f"/assets/images/items/{src.name}",
                "category": cat, "needs_category_review": cat == "unknown",
                "product_id": meta.get("product_id"),
                "product_name": pname,
                "brand_name": meta.get("brand_name"),
                "price": meta.get("final_price"),
                "face_detected": False, "crop_applied": False, "excluded": False,
                "recommended_for": ["item_display"],
                "skipped_existing": True,
            }
        else:
            meta = products_meta.get(src.name, {})
            rec  = process_item(src, dst, meta, dry_run)

        records.append(rec)
        if not rec.get("excluded"):
            stats["item_count"] += 1
            cat = rec.get("category", "unknown")
            stats["category_breakdown"][cat] = stats["category_breakdown"].get(cat, 0) + 1

        if i % 50 == 0 or i == len(item_files):
            print(f"  [{i:3d}/{len(item_files)}] items processed")

    # ── 2. Process snap images ────────────────────────────────────────────────
    print(f"\nProcessing {len(snap_files)} snap/coordi images…")
    for i, src in enumerate(snap_files, 1):
        dst = OUTPUT_COORD / src.name
        if not force and not dry_run and dst.exists():
            meta = snaps_meta.get(src.name, {})
            rec = {
                "id": src.stem, "type": "coordi", "source": "musinsa_snap",
                "original_filename": src.name,
                "original_path": f"sample-clothes-image/{src.name}",
                "processed_path": f"assets/images/coordi/{src.name}",
                "app_url": f"/assets/images/coordi/{src.name}",
                "category": "outfit",
                "snap_id": meta.get("snap_id"),
                "snap_url": meta.get("snap_url"),
                "face_detected": None, "crop_applied": None, "excluded": False,
                "recommended_for": ["coordi_display", "style_display"],
                "skipped_existing": True,
            }
        else:
            meta = snaps_meta.get(src.name, {})
            rec  = process_coordi(src, dst, meta, "musinsa_snap",
                                  dry_run, cascade, cascade_alt)

        records.append(rec)
        if not rec.get("excluded"):
            stats["coordi_count"] += 1
        if rec.get("face_detected"):
            stats["face_detected"] += 1
        if rec.get("crop_applied"):
            stats["crop_applied"] += 1
        if rec.get("exclude_reason") == "face_dominant":
            stats["face_dominant_excluded"] += 1
        if rec.get("exclude_reason", "").startswith("error"):
            stats["error_excluded"] += 1

        if i % 50 == 0 or i == len(snap_files):
            pct = i / len(snap_files) * 100
            print(f"  [{i:3d}/{len(snap_files)}] snaps processed  ({pct:.0f}%)")

    # ── 3. Process pin images ─────────────────────────────────────────────────
    print(f"\nProcessing {len(pin_files)} Pinterest pin images…")
    for i, src in enumerate(pin_files, 1):
        dst = OUTPUT_COORD / src.name
        if not force and not dry_run and dst.exists():
            meta = pins_meta.get(src.name, {})
            rec = {
                "id": src.stem, "type": "coordi", "source": "pinterest_pin",
                "original_filename": src.name,
                "original_path": f"sample-clothes-image/{src.name}",
                "processed_path": f"assets/images/coordi/{src.name}",
                "app_url": f"/assets/images/coordi/{src.name}",
                "category": "outfit",
                "pin_id": meta.get("pin_id"),
                "pin_url": meta.get("pin_url"),
                "dominant_color": meta.get("dominant_color"),
                "face_detected": None, "crop_applied": None, "excluded": False,
                "recommended_for": ["coordi_display", "style_display"],
                "skipped_existing": True,
            }
        else:
            meta = pins_meta.get(src.name, {})
            rec  = process_coordi(src, dst, meta, "pinterest_pin",
                                  dry_run, cascade, cascade_alt)

        records.append(rec)
        if not rec.get("excluded"):
            stats["coordi_count"] += 1
        if rec.get("face_detected"):
            stats["face_detected"] += 1
        if rec.get("crop_applied"):
            stats["crop_applied"] += 1
        if rec.get("exclude_reason") == "face_dominant":
            stats["face_dominant_excluded"] += 1
        if rec.get("exclude_reason", "").startswith("error"):
            stats["error_excluded"] += 1

        if i % 50 == 0 or i == len(pin_files):
            pct = i / len(pin_files) * 100
            print(f"  [{i:3d}/{len(pin_files)}] pins processed  ({pct:.0f}%)")

    # ── Build manifest ───────────────────────────────────────────────────────
    elapsed = (datetime.now() - start_time).total_seconds()

    usable_items  = [r for r in records if r["type"] == "item"   and not r.get("excluded")]
    usable_coordi = [r for r in records if r["type"] == "coordi" and not r.get("excluded")]
    excluded      = [r for r in records if r.get("excluded")]

    manifest = {
        "_meta": {
            "generated_at":     datetime.now().isoformat(),
            "elapsed_seconds":  round(elapsed, 1),
            "pipeline_version": "2.0.0",
            "source_dir":       str(SOURCE_DIR),
            "dry_run":          dry_run,
        },
        "stats": {
            **stats,
            "usable_items":   len(usable_items),
            "usable_coordi":  len(usable_coordi),
            "total_excluded": len(excluded),
        },
        "items":    usable_items,
        "coordi":   usable_coordi,
        "excluded": excluded,
    }

    if not dry_run:
        METADATA_OUT.parent.mkdir(parents=True, exist_ok=True)
        with open(METADATA_OUT, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        print(f"\n✓ Metadata → {METADATA_OUT}")

        LOG_OUT.parent.mkdir(parents=True, exist_ok=True)
        with open(LOG_OUT, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        print(f"✓ Log      → {LOG_OUT}")

    # ── Final report ─────────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print("PIPELINE COMPLETE")
    print(f"{'='*60}")
    print(f"  Total scanned:              {stats['total_scanned']}")
    print(f"  Item images usable:         {len(usable_items)}")
    print(f"  Coordi images usable:       {len(usable_coordi)}")
    print(f"    └─ Musinsa snaps:         {sum(1 for r in usable_coordi if r.get('source')=='musinsa_snap')}")
    print(f"    └─ Pinterest pins:        {sum(1 for r in usable_coordi if r.get('source')=='pinterest_pin')}")
    print(f"  Faces detected:             {stats['face_detected']}")
    print(f"  Face crops applied:         {stats['crop_applied']}")
    print(f"  Excluded (face dominant):   {stats['face_dominant_excluded']}")
    print(f"  Excluded (errors):          {stats['error_excluded']}")
    print(f"  Other skipped:              {stats['other_skipped']}")
    print(f"  Category breakdown (items):")
    for cat, cnt in sorted(stats["category_breakdown"].items(), key=lambda x: -x[1]):
        print(f"    {cat:<18} {cnt}")
    print(f"  Elapsed: {elapsed:.1f}s")
    print(f"{'='*60}\n")

    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TRUNKROOM Image Processing Pipeline")
    parser.add_argument("--dry-run", action="store_true",
                        help="Classify only, do not write output files")
    parser.add_argument("--force", action="store_true",
                        help="Re-process even if output already exists")
    args = parser.parse_args()
    run_pipeline(dry_run=args.dry_run, force=args.force)
