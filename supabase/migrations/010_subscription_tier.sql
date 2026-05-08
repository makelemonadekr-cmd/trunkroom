-- 010_subscription_tier.sql
--
-- Add premium subscription fields to profiles.
-- Stage 1: server reads is_premium to skip monthly AI limits.
-- Stage 2: Apple IAP / RevenueCat will flip is_premium via Edge Function.
--
-- Safe to run multiple times (IF NOT EXISTS / IF EXISTS guards).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_premium         BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ  DEFAULT NULL;

-- Index for fast server-side lookup
CREATE INDEX IF NOT EXISTS profiles_is_premium_idx ON profiles (id) WHERE is_premium = TRUE;

COMMENT ON COLUMN profiles.is_premium         IS 'TRUE while user has an active premium subscription';
COMMENT ON COLUMN profiles.premium_expires_at IS 'UTC timestamp when premium expires (NULL = never set)';
