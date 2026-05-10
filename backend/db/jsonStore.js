const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const jobsFilePath = path.join(__dirname, '..', 'data', 'jobs.json');
const proposalsFilePath = path.join(__dirname, '..', 'data', 'proposals.json');
const paymentsFilePath = path.join(__dirname, '..', 'data', 'payments.json');
const shareLinksFilePath = path.join(__dirname, '..', 'data', 'proposal_share_links.json');
const signaturesFilePath = path.join(__dirname, '..', 'data', 'proposal_signatures.json');
const versionsFilePath = path.join(__dirname, '..', 'data', 'proposal_versions.json');
const revisionRequestsFilePath = path.join(__dirname, '..', 'data', 'proposal_revision_requests.json');

function ensureFile() {
  const dir = path.dirname(jobsFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(jobsFilePath)) fs.writeFileSync(jobsFilePath, '[]', 'utf8');
}

function ensureProposalsFile() {
  const dir = path.dirname(proposalsFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(proposalsFilePath)) fs.writeFileSync(proposalsFilePath, '[]', 'utf8');
}

function _read() {
  ensureFile();
  const raw = fs.readFileSync(jobsFilePath, 'utf8');
  const arr = JSON.parse(raw || '[]');
  return Array.isArray(arr) ? arr : [];
}

function _write(jobs) {
  ensureFile();
  fs.writeFileSync(jobsFilePath, JSON.stringify(jobs, null, 2), 'utf8');
}

function _readProposals() {
  ensureProposalsFile();
  const raw = fs.readFileSync(proposalsFilePath, 'utf8');
  const arr = JSON.parse(raw || '[]');
  return Array.isArray(arr) ? arr : [];
}

function _writeProposals(proposals) {
  ensureProposalsFile();
  fs.writeFileSync(proposalsFilePath, JSON.stringify(proposals, null, 2), 'utf8');
}

function ensurePaymentsFile() {
  const dir = path.dirname(paymentsFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(paymentsFilePath)) fs.writeFileSync(paymentsFilePath, '[]', 'utf8');
}

function _readPayments() {
  ensurePaymentsFile();
  const raw = fs.readFileSync(paymentsFilePath, 'utf8');
  const arr = JSON.parse(raw || '[]');
  return Array.isArray(arr) ? arr : [];
}

function _writePayments(payments) {
  ensurePaymentsFile();
  fs.writeFileSync(paymentsFilePath, JSON.stringify(payments, null, 2), 'utf8');
}

// Generic file-backed array store (for share_links, signatures, versions, etc.)
function _readArray(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '[]', 'utf8');
  const raw = fs.readFileSync(filePath, 'utf8');
  const arr = JSON.parse(raw || '[]');
  return Array.isArray(arr) ? arr : [];
}
function _writeArray(filePath, arr) {
  fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), 'utf8');
}

// userId ignored — single-user dev mode
function forUser(_userId) {
  return {
    async readJobs() {
      return _read();
    },

    async findJobById(id) {
      return _read().find((j) => j.id === Number(id)) || null;
    },

    async createJob(data) {
      const jobs = _read();
      const maxId = jobs.reduce((max, j) => Math.max(max, Number(j.id) || 0), 0);
      const now = new Date().toISOString();
      const newJob = {
        id: maxId + 1,
        created_at: data.created_at || now,
        updated_at: data.updated_at || now,
        ...data,
      };
      jobs.unshift(newJob);
      _write(jobs);
      return newJob;
    },

    async updateJob(id, data) {
      const jobs = _read();
      const idx = jobs.findIndex((j) => j.id === Number(id));
      if (idx === -1) return null;
      jobs[idx] = { ...jobs[idx], ...data };
      _write(jobs);
      return jobs[idx];
    },

    async deleteJob(id) {
      const jobs = _read();
      const next = jobs.filter((j) => j.id !== Number(id));
      if (next.length === jobs.length) return false;
      _write(next);
      return true;
    },

    // Activity stubs — JSON store has no persistence for activities.
    async createActivity(_data) {
      return null;
    },

    async getActivities(_jobId, _limit = 50) {
      return [];
    },

    async getSettings() {
      return {};
    },

    // logActivity — no-op stub (JSON store has no activity persistence)
    async logActivity(_jobId, _userId, _type, _note) {
      return null;
    },

    // ── Milestones — return hardcoded defaults; no persistence in JSON mode ──
    async listMilestones() {
      return [
        { id: 'lead',         label: 'Lead',         order_index: 0, stale_days: 30, color: '#3B82F6', is_terminal: false },
        { id: 'proposal',     label: 'Proposal',     order_index: 1, stale_days: 30, color: '#F59E0B', is_terminal: false },
        { id: 'construction', label: 'Construction', order_index: 2, stale_days: 14, color: '#F97316', is_terminal: false },
        { id: 'completed',    label: 'Completed',    order_index: 3, stale_days: 0,  color: '#22C55E', is_terminal: true  },
      ];
    },

    async seedMilestones(_uid, defaults) {
      return defaults.map((m, i) => ({ ...m, id: m.label.toLowerCase().replace(/\s+/g, '-') }));
    },

    async createMilestone(_uid, fields) {
      return { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), ...fields };
    },

    async updateMilestone(_uid, id, fields) {
      return { id, ...fields };
    },

    async deleteMilestone(_uid, _id) {
      return true;
    },

    async reorderMilestones(_uid, _order) {
      return true;
    },

    // ── Team members — no-op stubs; JSON store is single-user ──────────────
    async listTeamMembers() {
      return [];
    },

    async inviteTeamMember(email, role = 'member') {
      return { id: String(Date.now()), email, role, status: 'pending', created_at: new Date().toISOString() };
    },

    async updateTeamMemberStatus(id, status) {
      return { id, status };
    },

    async removeTeamMember(_id) {
      return true;
    },

    async getStats() {
      const jobs = _read();
      const open = jobs.filter((j) => j.status !== 'Closed');
      const revenue = jobs
        .filter((j) => j.status === 'Closed')
        .reduce((sum, j) => sum + (parseFloat(j.price) || 0), 0);

      const byMilestone = {};
      for (const j of open) {
        const m = j.milestone || 'Lead';
        byMilestone[m] = (byMilestone[m] || 0) + 1;
      }

      return {
        total: jobs.length,
        open: open.length,
        closed: jobs.length - open.length,
        revenue,
        byMilestone,
      };
    },

    // ── Proposals (file-backed for dev parity) ─────────────────────────────────

    async listProposals({ opportunityId } = {}) {
      const all = _readProposals();
      const filtered = opportunityId !== undefined && opportunityId !== null
        ? all.filter((p) => Number(p.opportunity_id) === Number(opportunityId))
        : all;
      // Strip line_items from list response to match Supabase pattern
      return filtered
        .map(({ line_items: _li, ...rest }) => rest)
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    },

    async getProposal(id) {
      const all = _readProposals();
      return all.find((p) => p.id === id) || null;
    },

    async createProposal(fields) {
      const { line_items = [], ...proposalFields } = fields;
      const now = new Date().toISOString();
      const id = randomUUID();
      const proposal = {
        id,
        ...proposalFields,
        line_items: line_items.map((li, i) => ({
          id: li.id || randomUUID(),
          ...li,
          proposal_id: id,
          sort_order: li.sort_order ?? i,
          created_at: now,
          updated_at: now,
        })),
        created_at: now,
        updated_at: now,
      };
      const all = _readProposals();
      all.push(proposal);
      _writeProposals(all);
      // Mirror the supabase-side opportunity link
      if (proposal.opportunity_id !== undefined && proposal.opportunity_id !== null) {
        const jobs = _read();
        const idx = jobs.findIndex((j) => Number(j.id) === Number(proposal.opportunity_id));
        if (idx !== -1) {
          jobs[idx].proposal_id = id;
          _write(jobs);
        }
      }
      return proposal;
    },

    async updateProposal(id, fields) {
      const { line_items, ...proposalFields } = fields;
      const all = _readProposals();
      const idx = all.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      const now = new Date().toISOString();
      const updated = {
        ...all[idx],
        ...proposalFields,
        updated_at: now,
      };
      if (Array.isArray(line_items)) {
        updated.line_items = line_items.map((li, i) => ({
          id: li.id || randomUUID(),
          ...li,
          proposal_id: id,
          sort_order: li.sort_order ?? i,
          updated_at: now,
        }));
      }
      all[idx] = updated;
      _writeProposals(all);
      return updated;
    },

    async deleteProposal(id) {
      const all = _readProposals();
      const next = all.filter((p) => p.id !== id);
      if (next.length === all.length) return false;
      _writeProposals(next);
      // Clear from opportunities
      const jobs = _read();
      let changed = false;
      jobs.forEach((j) => {
        if (j.proposal_id === id) { j.proposal_id = null; changed = true; }
      });
      if (changed) _write(jobs);
      return true;
    },

    async setProposalStatus(id, status, timestamps = {}) {
      const all = _readProposals();
      const idx = all.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      all[idx] = { ...all[idx], status, ...timestamps, updated_at: new Date().toISOString() };
      _writeProposals(all);
      return all[idx];
    },

    // ── Payments (file-backed for dev parity) ──────────────────────────────────

    async listPayments({ opportunityId } = {}) {
      const all = _readPayments();
      const filtered = opportunityId !== undefined && opportunityId !== null
        ? all.filter((p) => Number(p.opportunity_id) === Number(opportunityId))
        : all;
      return filtered.sort((a, b) => (b.requested_at || '').localeCompare(a.requested_at || ''));
    },

    async getPayment(id) {
      return _readPayments().find((p) => p.id === id) || null;
    },

    async createPayment(fields) {
      const now = new Date().toISOString();
      const payment = {
        id: randomUUID(),
        currency: 'usd',
        status: 'requested',
        description: '',
        metadata: {},
        requested_at: now,
        created_at: now,
        updated_at: now,
        ...fields,
      };
      const all = _readPayments();
      all.push(payment);
      _writePayments(all);
      return payment;
    },

    async updatePayment(id, fields) {
      const all = _readPayments();
      const idx = all.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      all[idx] = { ...all[idx], ...fields, updated_at: new Date().toISOString() };
      _writePayments(all);
      return all[idx];
    },

    async findPaymentByStripeRef({ session_id, payment_intent_id }) {
      return _readPayments().find((p) =>
        (session_id && p.stripe_session_id === session_id) ||
        (payment_intent_id && p.stripe_payment_intent_id === payment_intent_id)
      ) || null;
    },

    async decrementOpportunityBalance(opportunityId, amount) {
      const jobs = _read();
      const idx = jobs.findIndex((j) => Number(j.id) === Number(opportunityId));
      if (idx === -1) return null;
      const current = parseFloat(jobs[idx].balance_due) || 0;
      const next = Math.max(0, current - amount);
      jobs[idx].balance_due = String(next);
      _write(jobs);
      return next;
    },
  };
}

// ── Admin helpers (used by webhooks; no user JWT context) ──────────────────

async function findPaymentByStripeRefAdmin({ session_id, payment_intent_id }) {
  return _readPayments().find((p) =>
    (session_id && p.stripe_session_id === session_id) ||
    (payment_intent_id && p.stripe_payment_intent_id === payment_intent_id)
  ) || null;
}

async function adminUpdatePayment(id, fields) {
  const all = _readPayments();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...fields, updated_at: new Date().toISOString() };
  _writePayments(all);
  return all[idx];
}

async function adminDecrementOpportunityBalance(opportunityId, _userIdOwner, amount) {
  const jobs = _read();
  const idx = jobs.findIndex((j) => Number(j.id) === Number(opportunityId));
  if (idx === -1) return null;
  const current = parseFloat(jobs[idx].balance_due) || 0;
  const next = Math.max(0, current - amount);
  jobs[idx].balance_due = String(next);
  _write(jobs);
  return next;
}

async function adminLogActivity(_jobId, _userIdOwner, _type, _note) {
  // jsonStore has no activity persistence (matches the per-user stub)
  return null;
}

// Team-invite acceptance — jsonStore is single-user, so this is a no-op stub
// that "succeeds" so dev mode doesn't crash.
async function getTeamInviteAdmin(_inviteId) {
  return null;
}
async function acceptTeamInviteAdmin(_inviteId, _memberUserId, _memberEmail) {
  return { ok: true, invite: { id: _inviteId, status: 'active', member_user_id: _memberUserId } };
}

// ── Public proposal admin helpers (file-backed for dev parity) ──────────────

async function createShareLinkAdmin({ proposal_id, user_id, token, expires_at, version_id }) {
  const now = new Date().toISOString();
  const link = {
    id: randomUUID(),
    proposal_id,
    user_id,
    token,
    expires_at,
    revoked_at: null,
    version_id: version_id || null,
    opened_count: 0,
    last_opened_at: null,
    created_at: now,
  };
  const all = _readArray(shareLinksFilePath);
  all.push(link);
  _writeArray(shareLinksFilePath, all);
  return link;
}

async function getShareLinkByTokenAdmin(token) {
  const all = _readArray(shareLinksFilePath);
  return all.find((l) => l.token === token && !l.revoked_at) || null;
}

async function bumpShareLinkOpenedAdmin(id) {
  const all = _readArray(shareLinksFilePath);
  const idx = all.findIndex((l) => l.id === id);
  if (idx === -1) return;
  all[idx].opened_count = (all[idx].opened_count || 0) + 1;
  all[idx].last_opened_at = new Date().toISOString();
  _writeArray(shareLinksFilePath, all);
}

async function getProposalForPublicAdmin(proposalId) {
  const all = _readProposals();
  return all.find((p) => p.id === proposalId) || null;
}

async function recordSignatureAdmin(payload) {
  const sig = { id: randomUUID(), ...payload, signed_at: payload.signed_at || new Date().toISOString(), created_at: new Date().toISOString() };
  const all = _readArray(signaturesFilePath);
  all.push(sig);
  _writeArray(signaturesFilePath, all);
  return sig;
}

async function recordRevisionRequestAdmin(payload) {
  const req = { id: randomUUID(), ...payload, resolved: false, created_at: new Date().toISOString() };
  const all = _readArray(revisionRequestsFilePath);
  all.push(req);
  _writeArray(revisionRequestsFilePath, all);
  return req;
}

async function setProposalStatusAdmin(proposalId, status, timestamps = {}) {
  const all = _readProposals();
  const idx = all.findIndex((p) => p.id === proposalId);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], status, ...timestamps, updated_at: new Date().toISOString() };
  _writeProposals(all);
  return all[idx];
}

async function createVersionSnapshotAdmin({ proposal_id, user_id, version_number, snapshot, share_link_id }) {
  const v = {
    id: randomUUID(),
    proposal_id,
    user_id,
    version_number,
    snapshot,
    share_link_id: share_link_id || null,
    sent_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  const all = _readArray(versionsFilePath);
  all.push(v);
  _writeArray(versionsFilePath, all);
  return v;
}

async function getNextVersionNumberAdmin(proposalId) {
  const all = _readArray(versionsFilePath).filter((v) => v.proposal_id === proposalId);
  if (all.length === 0) return 1;
  return Math.max(...all.map((v) => v.version_number || 0)) + 1;
}

module.exports = {
  forUser,
  findPaymentByStripeRefAdmin,
  adminUpdatePayment,
  adminDecrementOpportunityBalance,
  adminLogActivity,
  getTeamInviteAdmin,
  acceptTeamInviteAdmin,
  createShareLinkAdmin,
  getShareLinkByTokenAdmin,
  bumpShareLinkOpenedAdmin,
  getProposalForPublicAdmin,
  recordSignatureAdmin,
  recordRevisionRequestAdmin,
  setProposalStatusAdmin,
  createVersionSnapshotAdmin,
  getNextVersionNumberAdmin,
};
