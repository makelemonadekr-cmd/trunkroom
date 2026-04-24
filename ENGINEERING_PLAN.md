# TRUNKROOM — Real App Implementation Engineering Plan
**Branch: `real-app-implementation` | Lead Engineer: Claude**  
**Last updated: 2026-04-25**

---

## 0. How to Use This Document

This document is the single source of truth for turning the TRUNKROOM UI prototype into a real working app. Every code change must align with the rules in Section 3. Every phase must be completed and verified before the next begins. Run `npm run build` after every phase and confirm zero errors before proceeding.

---

## 1. Product Goal

### What Trunkroom Is
트렁크룸(Trunkroom) is a Korean-language personal fashion management app for iOS/Android. It lets users:
- Manage their clothing inventory (내 옷장)
- Record daily outfits with photos (착용 기록)
- Create stylebook cards combining outfit photos + individual item images (스타일북)
- Discover and follow other users' public styles (발견)
- List their clothes for sale (판매)

**Company:** (주)메이크레모네이드 | **App Name:** 트렁크룸

### MVP Must Do
1. User signs up / logs in (email or social)
2. User adds clothing items to their closet (photo upload → AI auto-tag → save)
3. User records daily wear (photo + items selected → saved to profile)
4. User creates a stylebook (outfit photo background + item cards → 4:5 image)
5. User can view their own closet and records across sessions (real persistence)
6. User can make items/styles public or private
7. Other users can view public styles in Discovery tab

### What Must NOT Change
- The entire visual design (colors, typography, spacing, component shapes)
- The 375×812px phone shell UI layout
- All existing screens and their content
- The bottom navigation structure (5 tabs)
- The Korean language throughout
- Font: Spoqa Han Sans Neo
- Colors: #F5C200 (yellow), #1a1a1a (dark)
- All existing component behavior that already works

---

## 2. Technical Direction

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | React 18 + Vite (keep as-is) | Already working, no migration cost |
| Styling | TailwindCSS v4 (keep as-is) | Already working |
| Backend/DB | Supabase | Auth + Postgres + Storage + RLS in one, generous free tier |
| Auth | Supabase Auth (email + Kakao OAuth later) | Fastest path, RLS ties to auth.users |
| Storage | Supabase Storage | Clothing images, style photos, avatars |
| AI Pipeline | Keep existing Express server for now | OpenAI + remove.bg already wired |
| Routing | React Router v6 (add, don't replace) | Current state-based routing breaks deep links |
| State | Zustand (add gradually, replace localStorage stores) | Minimal boilerplate, works with Supabase |
| App Store path | Capacitor (Ionic) wrapping the React PWA | Lowest migration cost from current codebase |

---

## 3. Non-Negotiable Rules

### UI Rules
- ❌ Do NOT rewrite any existing UI component from scratch
- ❌ Do NOT change colors, fonts, or spacing on existing screens
- ❌ Do NOT remove any existing screen or navigation item
- ❌ Do NOT rename existing component files without updating all imports
- ✅ ADD new components; do not modify working ones unless strictly necessary
- ✅ If a component needs a backend prop that didn't exist before, add it as optional with a fallback

### Development Rules
- ❌ Do NOT implement more than one phase at a time
- ❌ Do NOT connect Supabase to more than one feature at a time
- ❌ Do NOT delete localStorage stores until Supabase replacement is verified
- ✅ Run `npm run build` after EVERY phase — zero errors required
- ✅ Keep mock data working as fallback during migration (feature flags)
- ✅ Every Supabase call must have loading state + error state in the UI
- ✅ All new code in TypeScript-compatible JSDoc or `.ts`/`.tsx` files
- ✅ Commit after each phase with descriptive message

### Data Rules
- ❌ Do NOT store images as base64 in any database or localStorage
- ❌ Do NOT put API keys in frontend code
- ✅ All images → Supabase Storage → public URL saved in DB
- ✅ All user data scoped by `user_id` from Supabase auth
- ✅ RLS policies on every table — no public read without explicit policy

---

## 4. Database Model

All tables live in Supabase Postgres under the `public` schema unless noted.

---

### 4.1 `profiles`
**Purpose:** Public-facing user profile. Extends `auth.users`.

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,           -- @handle
  display_name  TEXT NOT NULL,                  -- 화면 표시 이름
  avatar_url    TEXT,                           -- Supabase Storage public URL
  bio           TEXT,                           -- 자기소개 (max 200 chars)
  is_seller     BOOLEAN DEFAULT FALSE,          -- 판매자 여부
  follower_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  item_count    INT DEFAULT 0,
  style_count   INT DEFAULT 0,
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships:** 1:1 with `auth.users`  
**Ownership:** User owns their own profile  
**Visibility:** Public read (username, display_name, avatar, bio, counts). Private: email (stays in auth.users)

**RLS:**
```sql
-- Anyone can read profiles
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
-- Only owner can update
CREATE POLICY "profiles_owner_update" ON profiles FOR UPDATE USING (auth.uid() = id);
```

---

### 4.2 `clothing_items`
**Purpose:** Individual clothing item in a user's closet.

```sql
CREATE TABLE clothing_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic info
  name            TEXT NOT NULL,                -- 짧은 이름 "블랙 반팔"
  display_name    TEXT,                         -- 긴 표시 이름
  brand           TEXT,
  
  -- Classification
  main_category   TEXT NOT NULL,               -- "상의"|"하의"|"아우터"|"원피스"|"신발"|"가방"|"액세서리"|"스포츠"
  sub_category    TEXT,
  style_tags      TEXT[] DEFAULT '{}',          -- max 4 tags
  season          TEXT[] DEFAULT '{}',          -- ["봄","여름","가을","겨울"] subset
  color           TEXT,
  secondary_color TEXT,
  tags            TEXT[] DEFAULT '{}',          -- freeform keywords
  
  -- Condition & size
  size            TEXT,
  condition       TEXT,                         -- "S급"|"A급"|"B급"|"C급"
  
  -- Images
  image_url       TEXT,                         -- primary Supabase Storage URL
  image_urls      TEXT[] DEFAULT '{}',          -- additional images
  
  -- Selling
  price           INT DEFAULT 0,
  is_for_sale     BOOLEAN DEFAULT FALSE,
  sell_status     TEXT DEFAULT 'not_listed',    -- "not_listed"|"listed"|"sold"|"reserved"
  sell_channel    TEXT,                         -- URL or channel name
  purchase_price  INT,                          -- 구매 가격
  purchase_date   DATE,
  purchase_url    TEXT,
  
  -- Wear tracking
  wear_count      INT DEFAULT 0,
  last_worn_at    DATE,
  
  -- Metadata
  source          TEXT DEFAULT 'manual',        -- "manual"|"auto"|"imported"
  notes           TEXT,
  is_public       BOOLEAN DEFAULT FALSE,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships:** Many:1 → `profiles`  
**Ownership:** `user_id` owns the item  
**Visibility:** `is_public = true` → readable by anyone. `is_public = false` → owner only.

**RLS:**
```sql
CREATE POLICY "items_owner_all" ON clothing_items
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "items_public_read" ON clothing_items
  FOR SELECT USING (is_public = true);
```

---

### 4.3 `styles`
**Purpose:** A saved stylebook/outfit record. One per day's worn outfit, OR a manually created stylebook.

```sql
CREATE TABLE styles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Content
  title           TEXT,                         -- "클린 미니멀 데일리" (optional)
  date_str        DATE,                         -- YYYY-MM-DD (착용일)
  
  -- Stylebook visual
  template_id     TEXT DEFAULT 'A',             -- "A" | "B" (see Section 7)
  background_url  TEXT,                         -- outfit photo → Supabase Storage
  stylebook_url   TEXT,                         -- exported 4:5 stylebook image URL
  
  -- Metadata
  mood            TEXT,                         -- "casual"|"minimal"|"chic" etc.
  custom_mood     TEXT,
  memo            TEXT,                         -- private notes
  weather_snapshot JSONB,                       -- { temp, condition, location }
  
  -- Social
  is_public       BOOLEAN DEFAULT FALSE,
  like_count      INT DEFAULT 0,
  view_count      INT DEFAULT 0,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships:** Many:1 → `profiles`; 1:N → `style_items`  
**Visibility:** `is_public = true` → Discovery feed. `false` → owner only.

**RLS:**
```sql
CREATE POLICY "styles_owner_all" ON styles
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "styles_public_read" ON styles
  FOR SELECT USING (is_public = true);
```

---

### 4.4 `style_items`
**Purpose:** Junction table — which clothing items appear in a style, and their canvas transform data.

```sql
CREATE TABLE style_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  style_id        UUID NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
  clothing_item_id UUID REFERENCES clothing_items(id) ON DELETE SET NULL,
  
  -- For guest items (items not in closet, or external)
  item_image_url  TEXT,                         -- fallback if no clothing_item_id
  item_name       TEXT,
  
  -- Canvas transform (matches StylebookTemplateEditor state)
  position_x      FLOAT DEFAULT 0,             -- dx in px
  position_y      FLOAT DEFAULT 0,             -- dy in px
  scale           FLOAT DEFAULT 1.0,
  rotation        FLOAT DEFAULT 0,             -- degrees
  layer_order     INT DEFAULT 0,               -- z-index
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Relationships:** Many:1 → `styles`; Many:1 → `clothing_items`  
**Ownership:** Inherits from parent `styles.user_id`  
**Visibility:** Readable if parent `styles` is readable

**RLS:**
```sql
CREATE POLICY "style_items_via_style" ON style_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM styles s
      WHERE s.id = style_id
        AND (s.user_id = auth.uid() OR s.is_public = true)
    )
  );
CREATE POLICY "style_items_owner_write" ON style_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM styles s WHERE s.id = style_id AND s.user_id = auth.uid()
    )
  );
```

---

### 4.5 `wear_logs`
**Purpose:** Daily record of what the user wore. Separate from `styles` — a wear_log is the raw daily log; a style is the curated stylebook version.

```sql
CREATE TABLE wear_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  style_id        UUID REFERENCES styles(id) ON DELETE SET NULL,  -- linked style if created
  date_str        DATE NOT NULL,
  
  item_ids        UUID[] DEFAULT '{}',          -- clothing_items.id array
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date_str)                     -- one log per user per day
);
```

**Relationships:** Many:1 → `profiles`; optional 1:1 → `styles`  
**Ownership:** `user_id`  
**Visibility:** Always private (no public RLS)

---

### 4.6 `follows`
**Purpose:** User follow relationships.

```sql
CREATE TABLE follows (
  follower_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);
```

**RLS:**
```sql
CREATE POLICY "follows_read" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_write" ON follows FOR ALL USING (auth.uid() = follower_id);
```

---

### 4.7 `saved_styles`
**Purpose:** User saves/bookmarks another user's style.

```sql
CREATE TABLE saved_styles (
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  style_id      UUID NOT NULL REFERENCES styles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, style_id)
);
```

**RLS:**
```sql
CREATE POLICY "saved_styles_owner" ON saved_styles
  FOR ALL USING (auth.uid() = user_id);
```

---

### 4.8 `inquiries`
**Purpose:** 1:1 item inquiry messages between users (about a listed item).

```sql
CREATE TABLE inquiries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id       UUID REFERENCES clothing_items(id) ON DELETE SET NULL,
  from_user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message       TEXT NOT NULL,
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS:**
```sql
CREATE POLICY "inquiries_participant" ON inquiries
  FOR ALL USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
```

---

## 5. Supabase Plan

### 5.1 Environment Variables

Add to `.env` (never commit — already in `.gitignore`):
```bash
# Supabase
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Existing (keep)
VITE_AI_ENABLED=false
VITE_AI_BASE_URL=http://localhost:3001

# Server-side only (Express .env, not VITE_)
OPENAI_API_KEY=sk-...
REMOVE_BG_API_KEY=...
API_PORT=3001
```

Add to `.env.example` (commit this):
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5.2 Supabase Client Setup

File to create: `src/lib/supabase.js`
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Install: `npm install @supabase/supabase-js`

### 5.3 Auth Flow

**Sign Up:**
1. User enters email + password on onboarding screen
2. `supabase.auth.signUp({ email, password })`
3. Supabase sends confirmation email
4. On confirm → auto-create `profiles` row via database trigger
5. App receives session → store in Supabase's built-in session management

**Sign In:**
1. `supabase.auth.signInWithPassword({ email, password })`
2. Returns session → supabase client handles token refresh automatically

**Session persistence:**
- Supabase JS client persists session in localStorage automatically
- On app load: `supabase.auth.getSession()` → if session exists, skip onboarding
- `supabase.auth.onAuthStateChange()` → global listener in App.jsx

**Profile auto-creation trigger (SQL):**
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 5.4 Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `clothing-images` | Private (owner) | Closet item photos |
| `style-photos` | Private → public URL on share | Outfit/background photos |
| `stylebook-exports` | Public read | Exported 4:5 stylebook images |
| `avatars` | Public read | User profile photos |

**Bucket policies:**
```sql
-- clothing-images: owner reads/writes
CREATE POLICY "clothing_images_owner"
  ON storage.objects FOR ALL
  USING (auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
```

File naming convention: `{bucket}/{user_id}/{uuid}.{ext}`

### 5.5 Service Layer

Create `src/services/` directory with these files:

```
src/services/
├── supabase.js          ← client singleton (see 5.2)
├── authService.js       ← signIn, signUp, signOut, getSession, onAuthChange
├── profileService.js    ← getProfile, updateProfile, getPublicProfile
├── closetService.js     ← getItems, addItem, updateItem, deleteItem
├── styleService.js      ← getStyles, saveStyle, deleteStyle, getPublicFeed
├── wearLogService.js    ← getLog, saveLog, getStats
├── storageService.js    ← uploadImage, deleteImage, getPublicUrl
├── followService.js     ← follow, unfollow, isFollowing, getFollowers
└── savedStyleService.js ← saveStyle, unsaveStyle, getSaved
```

Each service function pattern:
```javascript
// Example pattern for all service functions
export async function getClosetItems(userId) {
  const { data, error } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}
```

### 5.6 Loading / Error State Pattern

Every Supabase-connected component must use this pattern:
```javascript
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  async function load() {
    try {
      setLoading(true)
      const result = await closetService.getItems(userId)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  if (userId) load()
}, [userId])
```

Do NOT show blank screens on load. Always show:
- Loading: existing skeleton UI or spinner
- Error: toast notification (use existing `toastUtils.js`)
- Empty: existing empty state UI

---

## 6. Frontend Architecture Plan

### 6.1 Target Folder Structure

```
src/
├── App.jsx                        ← minimal changes (add auth gate)
├── main.jsx                       ← add FavoritesProvider wrapping
├── router/
│   └── index.jsx                  ← NEW: React Router setup (Phase 7)
│
├── pages/                         ← keep all existing pages
│   └── (all existing files)
│
├── components/                    ← keep all existing components
│   └── (all existing files)
│
├── features/                      ← NEW: feature modules (Phase 2+)
│   ├── auth/
│   │   ├── LoginScreen.jsx
│   │   └── SignUpScreen.jsx
│   ├── closet/
│   └── record/
│
├── hooks/                         ← NEW custom hooks
│   ├── useWeather.js              ← keep existing
│   ├── useAuth.js                 ← NEW
│   ├── useCloset.js               ← NEW
│   ├── useProfile.js              ← NEW
│   └── useStyle.js                ← NEW
│
├── services/                      ← NEW service layer (see 5.5)
│   ├── supabase.js
│   ├── authService.js
│   ├── closetService.js
│   ├── styleService.js
│   ├── wearLogService.js
│   ├── storageService.js
│   └── ...
│
├── types/                         ← NEW JSDoc type definitions
│   ├── closet.js
│   ├── style.js
│   ├── user.js
│   └── index.js
│
├── lib/                           ← keep all existing utils
│   ├── supabase.js                ← NEW client (replaces nothing, just added)
│   ├── closetStore.js             ← keep during migration
│   └── (all existing files)
│
├── constants/                     ← keep all existing
│   └── (all existing files)
│
└── services/ (existing)
    └── (keep existing aiService etc.)
```

### 6.2 Components to Create

| Component | Purpose | Phase |
|-----------|---------|-------|
| `AuthGate.jsx` | Wraps app, shows login if no session | 1 |
| `LoginScreen.jsx` | Email/password sign in UI | 1 |
| `SignUpScreen.jsx` | Email/password sign up UI | 1 |
| `LoadingSpinner.jsx` | Reusable loading indicator | 1 |
| `ImageUploader.jsx` | File pick → Supabase Storage upload | 2 |
| `ConfirmDialog.jsx` | Reusable delete/action confirmation | 2 |
| `ProfileAvatar.jsx` | User avatar with fallback | 2 |

### 6.3 Components to Refactor

| Component | Change | Priority |
|-----------|--------|----------|
| `StyleRecordFlow.jsx` | Split into sub-files in `features/record/` | Medium |
| `ClosetItemDetailScreen.jsx` | Accept real item data + save callback | High |
| `AddClosetItemScreen.jsx` | Connect to `closetService.addItem` | High |
| `RecordPage.jsx` | Connect to `wearLogService` + `styleService` | High |
| `DiscoveryPage.jsx` | Connect to public feed query | Medium |
| `MenuPage.jsx` | Connect to real profile + auth signout | High |

### 6.4 Hooks to Create

```javascript
// useAuth.js — global auth state
export function useAuth() {
  // returns: { user, session, loading, signIn, signOut, signUp }
}

// useCloset.js — user's closet items
export function useCloset(userId) {
  // returns: { items, loading, error, addItem, updateItem, deleteItem, refresh }
}

// useProfile.js — profile data
export function useProfile(userId) {
  // returns: { profile, loading, error, updateProfile }
}

// useStyle.js — style/wear records
export function useStyle(userId) {
  // returns: { styles, loading, error, saveStyle, deleteStyle }
}
```

### 6.5 Types to Create (`src/types/`)

```javascript
// closet.js
/**
 * @typedef {Object} ClothingItem
 * @property {string} id
 * @property {string} userId
 * @property {string} name
 * @property {string} displayName
 * @property {string} brand
 * @property {string} mainCategory
 * @property {string} subCategory
 * @property {string[]} styleTags
 * @property {string[]} season
 * @property {string} color
 * @property {string} imageUrl
 * @property {string[]} imageUrls
 * @property {string} size
 * @property {string} condition
 * @property {number} price
 * @property {boolean} isForSale
 * @property {string} sellStatus
 * @property {number} wearCount
 * @property {string} lastWornAt
 * @property {boolean} isPublic
 * @property {string} createdAt
 */
```

### 6.6 Routes to Preserve

The current `activeTab` navigation must continue working exactly as-is throughout all phases. React Router is deferred to Phase 7. No URLs will change until then.

---

## 7. Stylebook Implementation Plan

### 7.1 The 4:5 Stylebook Format

Every stylebook is a **4:5 aspect ratio canvas** (e.g. 320×400px in the editor, exported at 1080×1350px for sharing). This is the core visual product of Trunkroom.

The `StylebookTemplateEditor` component already implements the interactive canvas. The goal is to save the output to Supabase and support both Template A and Template B visual styles.

### 7.2 Template A — `style-template1.png`

**Visual:** Wearing photo fills the background. Individual clothing items float as **white-card panels** placed around the person. Items have solid white backgrounds with subtle shadows. The person is clearly visible. Items don't overlap the face.

**Behavior:**
- Background: user's outfit photo (or solid color if none)
- Items: each rendered as a white-background card with item image inside
- Layout: use `SLOT_CONFIGS` from `StylebookTemplateEditor.jsx` (already implemented)
- Item cards: white bg (`rgba(255,255,255,0.96)`), `borderRadius: 10`, shadow
- Canvas look: clean editorial collage

**Current status:** Already implemented in `StylebookTemplateEditor.jsx`. This IS Template A.

### 7.3 Template B — `style-template2.png`

**Visual:** Wearing photo fills the background. Individual clothing items are overlaid **directly on the photo without white card backgrounds** — they blend semi-transparently into the scene. The overall effect is more atmospheric and magazine-like.

**Behavior:**
- Background: same as Template A (outfit photo)
- Items: transparent background (PNG cutout preferred), directly on photo
- Item cards: no white background (`backgroundColor: transparent`), no border
- Subtle drop shadow only (`0 4px 20px rgba(0,0,0,0.3)`)
- Same `SLOT_CONFIGS` positioning as Template A

**Implementation needed:**
- Add `templateId` prop to `StylebookTemplateEditor`
- When `templateId === 'B'`: set ItemBox `backgroundColor: 'transparent'`, remove border
- The background-removal feature (already built) becomes essential for Template B

### 7.4 Item Box Placement (Both Templates)

```
SLOT_CONFIGS (already in StylebookTemplateEditor.jsx):
1 item  → 1 large card (right side)
2 items → 2 medium cards (left/right)
3 items → 1 large left + 2 small stacked right
4 items → 2×2 grid
5 items → 2 left + 3 right
6 items → 3×2 grid
```

Each item box supports:
- Drag (single finger)
- Pinch-scale + twist-rotate (two fingers) ← Fixed in current session
- Delete (× button)
- Bring forward / send backward (floating action bar)
- Background removal (canvas flood-fill)

### 7.5 Stylebook Save Flow

```
User finishes editing in StylebookTemplateEditor
  ↓
DraftStep → "다음" button → InfoStep (mood, memo, public toggle)
  ↓
User taps "저장하기"
  ↓
1. Export canvas as PNG (html2canvas on the editor div)
2. Upload background photo → Supabase Storage (style-photos bucket)
3. Upload exported 4:5 image → Supabase Storage (stylebook-exports bucket)
4. INSERT into styles table (with background_url, stylebook_url, template_id)
5. INSERT into style_items table (one row per item, with transform data)
6. UPDATE wear_logs for the date (item_ids)
7. UPDATE clothing_items wear_count + last_worn_at for each item
8. Show "기록 완료" DoneStep
```

### 7.6 Stylebook Preview

The existing `StylebookTemplate.jsx` renders a **read-only** version of a saved style. It takes:
- `photoUrl` (background)
- `items[]` (clothing items)

For saved styles, add:
- `templateId` prop (A or B)
- `stylebook_url` — if exported image exists, show it directly (faster, no re-render needed)

### 7.7 style_items Relationship

When saving, store transform data in `style_items`:
```javascript
// For each item in editItems:
{
  style_id: newStyleId,
  clothing_item_id: item.id,      // null if external item
  item_image_url: item.image,     // fallback
  item_name: item.displayName,
  position_x: transforms[i].dx,
  position_y: transforms[i].dy,
  scale: transforms[i].scale,
  rotation: transforms[i].rotation,
  layer_order: layerOrder[i]
}
```

### 7.8 Future Export/Share

Phase 5+: Add "공유하기" button that:
1. Generates the 4:5 PNG via html2canvas (already imported)
2. Uses Web Share API (`navigator.share`) for native share sheet
3. Falls back to download link for desktop/unsupported browsers

---

## 8. Implementation Phases

---

### Phase 1 — Supabase Setup + Auth Foundation
**Goal:** Supabase connected. User can sign up, log in, stay logged in across sessions. No UI screens changed.

**Files to create:**
- `.env` (local only, not committed)
- `src/lib/supabase.js` — Supabase client
- `src/services/authService.js` — signIn, signUp, signOut, getSession
- `src/hooks/useAuth.js` — auth state hook
- `src/types/index.js` — JSDoc types
- `src/features/auth/LoginScreen.jsx` — minimal login UI (reuse existing design system)
- `src/features/auth/SignUpScreen.jsx` — minimal signup UI
- `src/components/AuthGate.jsx` — session check wrapper

**Files to modify:**
- `package.json` — add `@supabase/supabase-js`
- `src/App.jsx` — add auth state check; if no session → show LoginScreen; if session → show existing app
- `src/pages/onboarding/TrunkRoomOnboarding.jsx` — add "시작하기" → LoginScreen path

**What NOT to touch:**
- Any existing screen content
- Any existing component
- Any localStorage store
- Navigation structure

**Supabase tasks (in Supabase dashboard):**
- Create project
- Enable email auth
- Create `profiles` table + trigger
- Set RLS on profiles

**How to test:**
1. `npm run build` → zero errors
2. `npm run dev:vite`
3. Sign up with test email → profile row created in Supabase
4. Reload → session persists, app loads normally
5. Sign out → login screen shows

---

### Phase 2 — Closet CRUD + Image Upload
**Goal:** User's closet items are saved to Supabase. Image upload goes to Storage. AI analysis still works.

**Files to create:**
- `src/services/closetService.js`
- `src/services/storageService.js`
- `src/hooks/useCloset.js`

**Files to modify:**
- `src/lib/closetStore.js` — add Supabase write alongside localStorage (dual-write)
- `src/pages/sell/AddClosetItemScreen.jsx` — call `closetService.addItem()` after AI analysis
- `src/pages/closet/ClosetPage.jsx` — load items from `useCloset` hook (with localStorage fallback)

**Supabase tasks:**
- Create `clothing_items` table + RLS
- Create `clothing-images` storage bucket

**What NOT to touch:**
- AI analysis flow (keep existing `aiService.js` + Express server)
- Item detail UI
- Filter/search UI

**How to test:**
1. `npm run build` → zero errors
2. Add item → check Supabase dashboard → row appears
3. Reload app → item still visible
4. Upload item photo → check storage bucket

---

### Phase 3 — Style/WearLog Save to Supabase
**Goal:** StyleRecordFlow saves to Supabase. Wear logs persist.

**Files to create:**
- `src/services/styleService.js`
- `src/services/wearLogService.js`
- `src/hooks/useStyle.js`

**Files to modify:**
- `src/components/StyleRecordFlow.jsx` — `handleDraftSave` calls `styleService.saveStyle()`
- `src/pages/record/RecordPage.jsx` — load wear history from `wearLogService`

**Supabase tasks:**
- Create `styles`, `style_items`, `wear_logs` tables + RLS
- Create `style-photos` and `stylebook-exports` buckets

**photo migration:** Replace base64 photoUrl with Storage upload in `DraftStep`.

**How to test:**
1. Create a style → check styles table in Supabase
2. Check style_items table for item transforms
3. Check wear_logs table for date entry
4. Reload app → record appears in calendar

---

### Phase 4 — Real Profile + Menu
**Goal:** MenuPage shows real user data. Profile editing saves to Supabase.

**Files to create:**
- `src/services/profileService.js`
- `src/hooks/useProfile.js`

**Files to modify:**
- `src/pages/menu/MenuPage.jsx` — show real avatar, name, counts; add sign out button
- `src/pages/account/EditProfilePage.jsx` — save to profileService
- `src/lib/userStore.js` — dual-write to Supabase

**How to test:**
1. Edit display name → check profiles table
2. Upload avatar → check avatars bucket
3. Sign out → auth cleared

---

### Phase 5 — Sell Fields + Item Detail
**Goal:** Selling fields (price, channel, status) are real. Item detail shows real data.

**Files to modify:**
- `src/components/ClosetItemDetailScreen.jsx` — connect to real item data + save
- `src/pages/sell/SellPage.jsx` — connect to real closet items with `isForSale`
- `src/pages/product/ProductDetailPage.jsx` — connect to public items

---

### Phase 6 — Public Feed + Discovery
**Goal:** DiscoveryPage shows real public styles from other users.

**Files to modify:**
- `src/pages/discover/DiscoveryPage.jsx` — query public styles
- `src/pages/discover/SellerProfilePage.jsx` — real user profiles
- `src/lib/followStore.js` → `followService.js`
- `src/lib/likesStore.js` → savedStyleService

---

### Phase 7 — React Router + App Store Prep
**Goal:** URL-based routing. Capacitor setup for native app wrapping.

**New setup:**
- Install `react-router-dom`
- Create `src/router/index.jsx`
- Map all `activeTab` values to URL paths
- Install Capacitor: `npm install @capacitor/core @capacitor/ios @capacitor/android`
- `npx cap init`, `npx cap add ios`

---

## 9. First Coding Task (Phase 1 — Step 1 only)

This is the ONLY thing to implement in the first coding session. Everything else waits.

### Task: Supabase Client + Auth Service + Types

**Step 1.1 — Install dependency**
```bash
npm install @supabase/supabase-js
```
Verify: `package.json` has `@supabase/supabase-js` in dependencies.

**Step 1.2 — Create .env file**
Create `/Users/yoon/Library/CloudStorage/Dropbox/TRUNKROOM/.env` with:
```
VITE_SUPABASE_URL=<to be filled by user>
VITE_SUPABASE_ANON_KEY=<to be filled by user>
VITE_AI_ENABLED=false
VITE_AI_BASE_URL=http://localhost:3001
```
Do NOT commit this file.

**Step 1.3 — Update .env.example**
Add Supabase vars to existing `.env.example`.

**Step 1.4 — Create Supabase client**
Create `src/lib/supabase.js`:
- Import `createClient` from `@supabase/supabase-js`
- Read from `import.meta.env`
- Export `supabase` singleton

**Step 1.5 — Create auth service**
Create `src/services/authService.js`:
- `signIn(email, password)` → `supabase.auth.signInWithPassword`
- `signUp(email, password, displayName)` → `supabase.auth.signUp`
- `signOut()` → `supabase.auth.signOut`
- `getSession()` → `supabase.auth.getSession`
- `onAuthChange(callback)` → `supabase.auth.onAuthStateChange`

**Step 1.6 — Create types**
Create `src/types/index.js` with JSDoc definitions for:
- `User` (from Supabase auth)
- `Profile`
- `ClothingItem`
- `Style`
- `WearLog`

**Step 1.7 — Run build**
```bash
npm run build
```
Must complete with zero errors. If any error, fix before proceeding.

**Step 1.8 — Commit**
```bash
git add -A
git commit -m "Phase 1 step 1: Supabase client + auth service + types"
```

**What is NOT done in this step:**
- No UI changes
- No screen changes
- No Supabase dashboard setup (user does that)
- No auth gate
- No login screen
- Nothing in App.jsx changes

---

## 10. Pre-Flight Checklist

Before starting any coding, verify:
- [ ] `git branch --show-current` returns `real-app-implementation`
- [ ] `npm run build` passes on current codebase
- [ ] Supabase project created at supabase.com
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` available
- [ ] `.env` created locally (not committed)
- [ ] `profiles` table + trigger created in Supabase dashboard
- [ ] Email auth enabled in Supabase Auth settings

---

*This document should be updated at the end of each phase to reflect actual implementation decisions.*
