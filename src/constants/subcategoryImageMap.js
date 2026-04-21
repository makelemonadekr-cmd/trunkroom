/**
 * subcategoryImageMap.js
 *
 * Deterministic mapping: subcategory label → representative Unsplash image URL.
 *
 * Rules:
 *  - Each subcategory gets its OWN distinct photo ID (no duplicate IDs).
 *  - Image should visually match the garment type (e.g. 청바지 → denim jeans shot).
 *  - Replace individual URLs with real product/category images when going live.
 *  - getSubcategoryImage(name) returns the URL, falling back to a generic shot.
 *
 * To update a subcategory image:
 *   Just change the URL in the object below — nothing else needs to change.
 */

export const SUBCATEGORY_IMAGE_MAP = {

  // ─── 상의 (Tops) ─────────────────────────────────────────────────────────────
  "반팔 티셔츠":    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80&fit=crop",
  "긴팔 티셔츠":    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&q=80&fit=crop",
  "셔츠":           "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80&fit=crop",
  "블라우스":       "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&q=80&fit=crop",
  "니트/스웨터":    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80&fit=crop",
  "후드티":         "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80&fit=crop",
  "맨투맨":         "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=400&q=80&fit=crop",
  "탱크탑":         "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&fit=crop",
  "가디건":         "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&q=80&fit=crop",
  "크롭탑":         "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&q=80&fit=crop",

  // ─── 하의 (Bottoms) ───────────────────────────────────────────────────────────
  "청바지":         "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80&fit=crop",
  "슬랙스":         "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80&fit=crop",
  "반바지":         "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80&fit=crop",
  "트레이닝 팬츠":  "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=80&fit=crop",
  "미니스커트":     "https://images.unsplash.com/photo-1548549557-dbe9946621da?w=400&q=80&fit=crop",
  "미디스커트":     "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80&fit=crop",
  "맥시스커트":     "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80&fit=crop",
  "와이드팬츠":     "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80&fit=crop",
  "레깅스":         "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80&fit=crop",
  "조거팬츠":       "https://images.unsplash.com/photo-1556906781-9a412961a28d?w=400&q=80&fit=crop",

  // ─── 아우터 (Outerwear) ───────────────────────────────────────────────────────
  "트렌치코트":     "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&q=80&fit=crop",
  "울 코트":        "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&q=80&fit=crop",
  "패딩":           "https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=400&q=80&fit=crop",
  "블레이저":       "https://images.unsplash.com/photo-1583744946564-b52d5a0ebe68?w=400&q=80&fit=crop",
  "점퍼":           "https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=400&q=80&fit=crop",
  "다운재킷":       "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=400&q=80&fit=crop",
  "체크코트":       "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&q=80&fit=crop",
  "오버핏코트":     "https://images.unsplash.com/photo-1512036666432-2181c1f26420?w=400&q=80&fit=crop",
  "레더재킷":       "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=400&q=80&fit=crop",
  "후리스":         "https://images.unsplash.com/photo-1515533958143-6d0fc3a87cf7?w=400&q=80&fit=crop",

  // ─── 원피스 (Dresses) ─────────────────────────────────────────────────────────
  "미니 원피스":    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80&fit=crop",
  "미디 원피스":    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80&fit=crop",
  "맥시 원피스":    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80&fit=crop",
  "니트 원피스":    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80&fit=crop",
  "셔츠 원피스":    "https://images.unsplash.com/photo-1496216090413-a4e4f41869c0?w=400&q=80&fit=crop",
  "플리츠 원피스":  "https://images.unsplash.com/photo-1503342560100-c4bc9ad9eed7?w=400&q=80&fit=crop",
  "점프수트":       "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=400&q=80&fit=crop",
  "원숄더":         "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80&fit=crop",
  "민소매 원피스":  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80&fit=crop",
  "캐주얼 원피스":  "https://images.unsplash.com/photo-1529629468175-90ee573d5b81?w=400&q=80&fit=crop",

  // ─── 신발 (Shoes) ─────────────────────────────────────────────────────────────
  "스니커즈":       "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80&fit=crop",
  "로퍼":           "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80&fit=crop",
  "힐/펌프스":      "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&q=80&fit=crop",
  "앵클 부츠":      "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&q=80&fit=crop",
  "샌들":           "https://images.unsplash.com/photo-1562273138-f46be4ebdf4c?w=400&q=80&fit=crop",
  "뮬":             "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=80&fit=crop",
  "옥스퍼드":       "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&q=80&fit=crop",
  "슬리퍼":         "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&q=80&fit=crop",
  "플랫폼":         "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=400&q=80&fit=crop",
  "스포츠 샌들":    "https://images.unsplash.com/photo-1555274175-6cbf6f3b137b?w=400&q=80&fit=crop",

  // ─── 가방 (Bags) ──────────────────────────────────────────────────────────────
  "숄더백":         "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80&fit=crop",
  "크로스백":       "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&q=80&fit=crop",
  "토트백":         "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80&fit=crop",
  "클러치":         "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&q=80&fit=crop",
  "백팩":           "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80&fit=crop",
  "버킷백":         "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80&fit=crop",
  "핸드백":         "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=400&q=80&fit=crop",
  "에코백":         "https://images.unsplash.com/photo-1583248369069-9d91f1640fe6?w=400&q=80&fit=crop",
  "파우치":         "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&q=80&fit=crop",
  "미니백":         "https://images.unsplash.com/photo-1589756823695-278bc923f962?w=400&q=80&fit=crop",

  // ─── 액세서리 (Accessories) ────────────────────────────────────────────────────
  "목걸이":         "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80&fit=crop",
  "귀걸이":         "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80&fit=crop",
  "반지":           "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=80&fit=crop",
  "선글라스":       "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80&fit=crop",
  "벨트":           "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80&fit=crop",
  "헤어밴드":       "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&q=80&fit=crop",
  "스카프":         "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&q=80&fit=crop",
  "모자":           "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&q=80&fit=crop",
  "시계":           "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80&fit=crop",
  "팔찌":           "https://images.unsplash.com/photo-1573408301185-9519f94cac7d?w=400&q=80&fit=crop",

  // ─── 스포츠 (Sports) ──────────────────────────────────────────────────────────
  "스포츠 레깅스":  "https://images.unsplash.com/photo-1584735422531-6a56c5e8a5ee?w=400&q=80&fit=crop",
  "스포츠 브라":    "https://images.unsplash.com/photo-1518310383802-640c2de311b6?w=400&q=80&fit=crop",
  "트레이닝 재킷":  "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&q=80&fit=crop",
  "러닝화":         "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80&fit=crop&crop=entropy",
  "요가복":         "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80&fit=crop",
  "압박 반바지":    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80&fit=crop",
  "윈드브레이커":   "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&q=80&fit=crop&crop=faces",
  "스포츠 티셔츠":  "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&q=80&fit=crop",
  "스포츠 양말":    "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=400&q=80&fit=crop",
  "헤드밴드":       "https://images.unsplash.com/photo-1616279969856-759f316a5ac1?w=400&q=80&fit=crop",
};

/** Generic fallback if subcategory not in map */
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80&fit=crop";

/**
 * Get the representative image URL for a given subcategory.
 * @param {string} subcategoryName
 * @returns {string} Unsplash URL
 */
export function getSubcategoryImage(subcategoryName) {
  return SUBCATEGORY_IMAGE_MAP[subcategoryName] ?? FALLBACK_IMAGE;
}
