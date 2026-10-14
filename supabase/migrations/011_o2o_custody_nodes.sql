-- 011_o2o_custody_nodes.sql
--
-- O2O layer (TRUNKROOM × PULDA STAY): extend the EXISTING clothing_items table
-- so ONE table can hold three kinds of garment at once, then add the physical
-- nodes/lockers/storage/booking/shipment tables that reference it.
--
-- The linchpin is `owner_type`:
--   'user'            → a person's own closet item (today's only case; default)
--   'rental_inventory'→ garment the node rents out (PULLDA STAY house inventory)
--   'consignment'     → user's item handed to a node to resell (from Cleanout / SleepingMoney)
--
-- `custody` tracks where the physical garment currently is.
-- Nothing here breaks existing rows: every add is IF NOT EXISTS with a safe default,
-- and existing items become owner_type='user', custody='home'.
--
-- Safe to run multiple times (IF NOT EXISTS / IF EXISTS guards).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Extend clothing_items (reuse the table we already have)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE clothing_items
  ADD COLUMN IF NOT EXISTS owner_type   TEXT NOT NULL DEFAULT 'user'
    CHECK (owner_type IN ('user', 'rental_inventory', 'consignment')),
  ADD COLUMN IF NOT EXISTS custody      TEXT NOT NULL DEFAULT 'home'
    CHECK (custody IN ('home', 'in_storage', 'in_locker', 'listed', 'sold', 'rented_out')),
  ADD COLUMN IF NOT EXISTS node_id      UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rental_price INTEGER DEFAULT NULL, -- KRW per rental, NULL = not rentable
  ADD COLUMN IF NOT EXISTS times_rented INTEGER NOT NULL DEFAULT 0;

-- Backfill: every pre-existing garment is a personal item kept at home.
UPDATE clothing_items
   SET owner_type = 'user', custody = 'home'
 WHERE owner_type IS NULL OR custody IS NULL;

COMMENT ON COLUMN clothing_items.owner_type   IS 'user | rental_inventory | consignment — turns one table into closet + rental catalog + resale stock';
COMMENT ON COLUMN clothing_items.custody      IS 'home | in_storage | in_locker | listed | sold | rented_out';
COMMENT ON COLUMN clothing_items.node_id      IS 'FK → nodes.id when the physical garment lives at / is managed by a node';
COMMENT ON COLUMN clothing_items.rental_price IS 'KRW charged per rental (NULL = not rentable)';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. nodes — a physical space (a PULDA STAY hostel) that acts as a TRUNKROOM node
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nodes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,                     -- 'PULDA STAY COEX'
  kind        TEXT NOT NULL DEFAULT 'hostel'
              CHECK (kind IN ('hostel', 'studio', 'warehouse', 'partner')),
  address     TEXT,
  timezone    TEXT NOT NULL DEFAULT 'Asia/Seoul',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- now that nodes exists, point the FK we referenced above
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clothing_items_node_id_fkey') THEN
    ALTER TABLE clothing_items
      ADD CONSTRAINT clothing_items_node_id_fkey
      FOREIGN KEY (node_id) REFERENCES nodes (id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. lockers — pickup/dropoff slots inside a node
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lockers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id    UUID NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
  label      TEXT NOT NULL,                      -- '#12'
  status     TEXT NOT NULL DEFAULT 'free'
             CHECK (status IN ('free', 'reserved', 'occupied', 'maintenance')),
  UNIQUE (node_id, label)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. storage_boxes — a customer's off-season box held at a node (local mode)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS storage_boxes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  node_id      UUID NOT NULL REFERENCES nodes (id) ON DELETE RESTRICT,
  label        TEXT,
  status       TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'retrieved', 'closed')),
  monthly_krw  INTEGER NOT NULL DEFAULT 9900,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. bookings — a rental and/or storage transaction (guest or local)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id      UUID NOT NULL REFERENCES nodes (id) ON DELETE RESTRICT,
  user_id      UUID REFERENCES auth.users (id) ON DELETE SET NULL, -- NULL = walk-in guest
  guest_name   TEXT,                              -- for walk-ins with no account
  kind         TEXT NOT NULL
               CHECK (kind IN ('rental', 'storage', 'luggage', 'shiphome')),
  outfit_id    UUID DEFAULT NULL,                 -- FK → outfits(id): the AI-staged look set
  locker_id    UUID REFERENCES lockers (id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'reserved'
               CHECK (status IN ('reserved', 'picked_up', 'returned', 'purchased', 'cancelled')),
  amount_krw   INTEGER NOT NULL DEFAULT 0,
  starts_at    TIMESTAMPTZ,
  ends_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Which garments are in this booking (rental sets, stored items…).
CREATE TABLE IF NOT EXISTS booking_items (
  booking_id UUID NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  item_id    UUID NOT NULL REFERENCES clothing_items (id) ON DELETE CASCADE,
  PRIMARY KEY (booking_id, item_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. shipments — ship-home / consignment logistics
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID REFERENCES bookings (id) ON DELETE SET NULL,
  user_id      UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  destination  TEXT NOT NULL,                     -- 'Tokyo, JP'
  carrier      TEXT,
  tracking_no  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled')),
  fee_krw      INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS clothing_items_owner_type_idx ON clothing_items (owner_type);
CREATE INDEX IF NOT EXISTS clothing_items_node_id_idx    ON clothing_items (node_id);
CREATE INDEX IF NOT EXISTS lockers_node_id_idx           ON lockers (node_id);
CREATE INDEX IF NOT EXISTS bookings_node_id_idx          ON bookings (node_id);
CREATE INDEX IF NOT EXISTS bookings_user_id_idx          ON bookings (user_id);
CREATE INDEX IF NOT EXISTS storage_boxes_user_id_idx     ON storage_boxes (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RLS — keep the app's existing posture (see 001_rls_policies.sql / 004)
--    Users see their own bookings/boxes; node/locker/rental_inventory is readable
--    so guests can browse. Node write access is for staff/service-role only.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE nodes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lockers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments     ENABLE ROW LEVEL SECURITY;

-- Public read of active nodes / rentable inventory (browse before login)
DROP POLICY IF EXISTS nodes_read_public ON nodes;
CREATE POLICY nodes_read_public ON nodes
  FOR SELECT USING (is_active = TRUE);

-- A customer sees and manages their own bookings
DROP POLICY IF EXISTS bookings_owner_rw ON bookings;
CREATE POLICY bookings_owner_rw ON bookings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- A customer sees and manages their own storage boxes
DROP POLICY IF EXISTS storage_owner_rw ON storage_boxes;
CREATE POLICY storage_owner_rw ON storage_boxes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- NOTE: staff/back-office writes to nodes, lockers, and rental_inventory items
-- go through the service-role key on the server (server/) — never the anon key.
