# TRUNKROOM Image Processing Pipeline

Processes the sample clothes image library into organized, face-safe assets for use in the app.

## Quick Start

```bash
# Install dependencies (one time)
pip3 install -r scripts/requirements.txt

# Run the full pipeline
python3 scripts/process-images.py

# Re-run when you add new images
python3 scripts/process-images.py --force

# Dry run (classify only, no file writes)
python3 scripts/process-images.py --dry-run
```

## Input

Source folder: `sample-clothes-image/`

Three image types are processed:

| Prefix      | Source              | Count | App role       |
|-------------|---------------------|-------|----------------|
| `001-300_`  | Musinsa products    | 300   | Item images    |
| `snap_`     | Musinsa outfit feed | 323   | Coordi images  |
| `pin_`      | Pinterest fashion   | 316   | Coordi images  |

Metadata files used from `sample-clothes-image/_metadata/`:
- `products.json` → Korean product names, brand, price, rank
- `snaps.csv` → Musinsa snap URLs
- `pins.json` → Pinterest pin metadata, dominant colors

## Output

```
public/assets/images/
  items/   ← 300 product shot images (no people, Vite-served at /assets/images/items/)
  coordi/  ← 410 style/outfit images (face-cropped, served at /assets/images/coordi/)

src/constants/
  imageAssets.json  ← full metadata for app consumption

scripts/
  processing-log.json  ← detailed per-image processing log
```

## Face Handling

For coordi (snap + pin) images, OpenCV Haar cascades detect frontal faces.

| Face found? | Remaining body ≥ 35% | Result                               |
|-------------|----------------------|--------------------------------------|
| Yes         | Yes                  | Cropped from chin+padding downward   |
| Yes         | No                   | Excluded (face_dominant)             |
| No          | —                    | Copied as-is                         |

**Limitation:** Haar cascades work best for frontal faces. Angled, side-profile, or phone-obscured faces may not be detected. Images where the phone covers the face (common mirror selfies) pass through correctly since there is no detectable face.

Of 639 coordi images: 473 faces detected, 246 cropped, 229 excluded (face dominant → too little body content), 410 usable.

## Category Classification

Item images are classified using keyword matching on Korean product names.

| Category    | Count | Sample keywords                            |
|-------------|-------|--------------------------------------------|
| tops        | 136   | 티셔츠, 니트, 후드, 맨투맨, shirt, hoodie  |
| bottoms     | 88    | 팬츠, 스커트, 청바지, pants, jeans         |
| outerwear   | 63    | 자켓, 코트, 카디건, jacket, windbreaker    |
| dress       | 11    | 원피스, 드레스, dress                      |
| shoes       | 1     | 슈즈, 스니커즈, boots                      |
| accessories | 1     | 모자, 벨트, hat                            |
| **Total**   | **300** |                                          |

Classification accuracy: **300/300 (100%)** on current dataset.

## App Usage

```js
import {
  getItemImages,
  getItemsByCategory,
  getCoordinateImages,
  getRandomItems,
  getRandomCoordi,
  searchItemsByBrand,
  buildDiscoveryFeed,
} from "../services/imageAssetService";

// Get all tops
const tops = getItemsByCategory("tops");
// → [{ app_url: "/assets/images/items/001_xxx.jpg", product_name: "후드 티셔츠", brand_name: "반스", price: 43200, ... }]

// Get 10 random coordi images for a style feed
const feed = getRandomCoordi(10);
// → [{ app_url: "/assets/images/coordi/snap_xxx.jpg", source: "musinsa_snap", ... }]

// Search by brand
const vans = searchItemsByBrand("반스");

// Discovery feed (interleaved items + coordi)
const discovery = buildDiscoveryFeed({ itemCount: 20, coordiCount: 30 });
```

## Adding New Images

1. Drop new images into `sample-clothes-image/`
   - Name them `NNN_productId_500.jpg` for product shots (item type)
   - Name them `snap_xxx.jpg` or `pin_xxx.jpg` for outfit photos (coordi type)
   - Add corresponding metadata to `_metadata/products.json` or `_metadata/pins.json` if available

2. Re-run the pipeline:
   ```bash
   python3 scripts/process-images.py --force
   ```

3. The app immediately uses the new images via `imageAssets.json`.

## Notes

- Original images are never modified — outputs go to `public/assets/images/`
- The pipeline is fully rerunnable and idempotent (use `--force` to reprocess)
- PNG images are supported and will be processed/saved as PNG
- Large images are cropped (not resized) — aspect ratio of cropped area is preserved
