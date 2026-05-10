-- Migration 011: Proposal share links + signatures + versions
-- Backs the Phase 4 public client view, e-signature, and "snapshot on send"
-- versioning model. Idempotent.

-- ─── proposal_share_links ──────────────────────────────────────────────────────
-- Token-backed URLs for the public client view. Token is hashed at rest;
-- the cleartext is only returned once at creation time (handed back from
-- POST /proposals/:id/send).
CREATE TABLE IF NOT EXISTS proposal_share_links (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id   UUID         NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id       UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Plaintext token (URL-safe). For higher-security setups, switch to a hash
  -- + comparison. We start with plaintext + per-IP rate-limit and a 30-day
  -- default expiry.
  token         TEXT         NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ  NOT NULL,
  revoked_at    TIMESTAMPTZ,
  -- Optional version reference — if set, the public view always serves this
  -- version snapshot regardless of edits to the live proposal.
  version_id    UUID,
  opened_count  INTEGER      NOT NULL DEFAULT 0,
  last_opened_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS proposal_share_links_token_idx
  ON proposal_share_links (token) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS proposal_share_links_proposal_idx
  ON proposal_share_links (proposal_id);

ALTER TABLE proposal_share_links ENABLE ROW LEVEL SECURITY;

-- Owner-only access; the public view route uses the service-role client and
-- validates the token cryptographically before returning the proposal.
CREATE POLICY "Owner manages own share links"
  ON proposal_share_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── proposal_versions ─────────────────────────────────────────────────────────
-- Immutable snapshots taken at each Send. Old public links continue to serve
-- the version they were created with even if the contractor edits the live
-- proposal.
CREATE TABLE IF NOT EXISTS proposal_versions (
  id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id     UUID         NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number  INTEGER      NOT NULL,
  -- Full snapshot: { proposal: {...}, line_items: [...] }
  snapshot        JSONB        NOT NULL,
  sent_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  share_link_id   UUID         REFERENCES proposal_share_links(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (proposal_id, version_number)
);

CREATE INDEX IF NOT EXISTS proposal_versions_proposal_idx
  ON proposal_versions (proposal_id, version_number DESC);

ALTER TABLE proposal_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own proposal versions"
  ON proposal_versions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── proposal_signatures ───────────────────────────────────────────────────────
-- ESIGN-Act-compatible audit trail for typed signatures captured on the
-- public client view.
CREATE TABLE IF NOT EXISTS proposal_signatures (
  id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id     UUID         NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_link_id   UUID         REFERENCES proposal_share_links(id) ON DELETE SET NULL,
  signer_name     TEXT         NOT NULL,
  signer_email    TEXT         NOT NULL,
  signature_text  TEXT         NOT NULL,
  agreed_terms    BOOLEAN      NOT NULL DEFAULT FALSE,
  ip_address      TEXT,
  user_agent      TEXT,
  signed_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS proposal_signatures_proposal_idx
  ON proposal_signatures (proposal_id, signed_at DESC);

ALTER TABLE proposal_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own signatures"
  ON proposal_signatures FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts come from the public route (service-role); no public-side INSERT policy.


-- ─── Add 'revision_requested' status ───────────────────────────────────────────
-- Drop the existing status CHECK and recreate with the additional value.
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_status_check;
ALTER TABLE proposals ADD CONSTRAINT proposals_status_check
  CHECK (status IN ('draft','ready','sent','revision_requested','approved','declined','expired'));

-- ─── Add proposal_revision_requests for client feedback during revision ──────
CREATE TABLE IF NOT EXISTS proposal_revision_requests (
  id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id     UUID         NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_link_id   UUID         REFERENCES proposal_share_links(id) ON DELETE SET NULL,
  message         TEXT         NOT NULL DEFAULT '',
  resolved        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS proposal_revision_requests_proposal_idx
  ON proposal_revision_requests (proposal_id, created_at DESC);

ALTER TABLE proposal_revision_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own revision requests"
  ON proposal_revision_requests FOR SELECT
  USING (auth.uid() = user_id);
