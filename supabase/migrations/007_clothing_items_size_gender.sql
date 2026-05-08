-- 007_clothing_items_size_gender.sql
--
-- Add `size` and `gender` columns to clothing_items.
-- These fields were added to AddClosetItemScreen in the May 2026 App Store prep.
--
-- safe to run multiple times (IF NOT EXISTS guards)

ALTER TABLE clothing_items
  ADD COLUMN IF NOT EXISTS size   TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT '여성'
    CHECK (gender IN ('여성', '남성', '공용'));

-- Backfill existing rows with the default
UPDATE clothing_items SET gender = '여성' WHERE gender IS NULL;

COMMENT ON COLUMN clothing_items.size   IS 'User-selected size (e.g. 66, M, 250). Unit depends on category.';
COMMENT ON COLUMN clothing_items.gender IS 'Target gender for sizing: 여성 | 남성 | 공용';
