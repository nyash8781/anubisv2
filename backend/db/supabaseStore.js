const { supabaseServiceClient: _client } = require('./client');

const TABLE = 'opportunities';

function forUser(userId) {
  if (!_client) {
    throw new Error('[db/supabase] Supabase service role client not initialized');
  }

  return {
    async readJobs() {
      const { data, error } = await _client
        .from(TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(`[db/supabase] readJobs: ${error.message}`);
      return data || [];
    },

    async findJobById(id) {
      const { data, error } = await _client
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw new Error(`[db/supabase] findJobById: ${error.message}`);
      return data || null;
    },

    async createJob(jobData) {
      const { flags, id: _id, user_id: _uid, ...insertData } = jobData;
      const { data, error } = await _client
        .from(TABLE)
        .insert({ ...insertData, user_id: userId })
        .select()
        .single();
      if (error) throw new Error(`[db/supabase] createJob: ${error.message}`);
      return data;
    },

    async updateJob(id, jobData) {
      // Strip computed/readonly fields before sending to Supabase.
      const { flags, id: _id, user_id: _uid, ...updateData } = jobData;
      const { data, error } = await _client
        .from(TABLE)
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw new Error(`[db/supabase] updateJob: ${error.message}`);
      return data;
    },

    async deleteJob(id) {
      const { error, count } = await _client
        .from(TABLE)
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw new Error(`[db/supabase] deleteJob: ${error.message}`);
      return (count || 0) > 0;
    },

    async createActivity(data) {
      const { error } = await _client
        .from('activities')
        .insert({ ...data, user_id: userId });
      if (error) throw new Error(`[db/supabase] createActivity: ${error.message}`);
    },

    async logActivity(jobId, actorUserId, type, note) {
      const { error } = await _client
        .from('activities')
        .insert({ job_id: jobId, user_id: actorUserId, type, note });
      if (error) throw new Error(`[db/supabase] logActivity: ${error.message}`);
    },

    async getActivities(jobId, limit = 50) {
      const { data, error } = await _client
        .from('activities')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(`[db/supabase] getActivities: ${error.message}`);
      return data || [];
    },

    async getSettings() {
      const { data } = await _client
        .from('user_settings')
        .select('base_prompt, business_context, extra')
        .eq('user_id', userId)
        .maybeSingle();
      if (!data) return {};
      return { ...data, ...(data.extra || {}) };
    },

    async getStats() {
      const { data, error } = await _client
        .from(TABLE)
        .select('status, milestone, price')
        .eq('user_id', userId);
      if (error) throw new Error(`[db/supabase] getStats: ${error.message}`);

      const jobs = data || [];
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

    // ── Milestones ─────────────────────────────────────────────────────────────

    async listMilestones() {
      const { data, error } = await _client
        .from('milestones')
        .select('*')
        .eq('user_id', userId)
        .order('order_index', { ascending: true });
      if (error) throw new Error(`[db/supabase] listMilestones: ${error.message}`);
      return data || [];
    },

    async seedMilestones(uid, defaults) {
      const rows = defaults.map((m) => ({ ...m, user_id: uid }));
      const { data, error } = await _client.from('milestones').insert(rows).select();
      if (error) throw new Error(`[db/supabase] seedMilestones: ${error.message}`);
      return data || [];
    },

    async createMilestone(uid, fields) {
      const { data, error } = await _client
        .from('milestones')
        .insert({ ...fields, user_id: uid })
        .select()
        .single();
      if (error) throw new Error(`[db/supabase] createMilestone: ${error.message}`);
      return data;
    },

    async updateMilestone(uid, id, fields) {
      const { data, error } = await _client
        .from('milestones')
        .update(fields)
        .eq('id', id)
        .eq('user_id', uid)
        .select()
        .maybeSingle();
      if (error) throw new Error(`[db/supabase] updateMilestone: ${error.message}`);
      return data;
    },

    async deleteMilestone(uid, id) {
      const { error } = await _client
        .from('milestones')
        .delete()
        .eq('id', id)
        .eq('user_id', uid);
      if (error) throw new Error(`[db/supabase] deleteMilestone: ${error.message}`);
    },

    async reorderMilestones(uid, order) {
      // order: [{ id, order_index }]
      await Promise.all(
        order.map(({ id, order_index }) =>
          _client.from('milestones').update({ order_index }).eq('id', id).eq('user_id', uid)
        )
      );
    },

    // ── Team members ───────────────────────────────────────────────────────────

    async listTeamMembers() {
      const { data, error } = await _client
        .from('team_members')
        .select('*')
        .eq('admin_user_id', userId)
        .order('invited_at', { ascending: false });
      if (error) throw new Error(`[db/supabase] listTeamMembers: ${error.message}`);
      return data || [];
    },

    async inviteTeamMember(invite_email, role = 'member') {
      const { data, error } = await _client
        .from('team_members')
        .insert({ admin_user_id: userId, invite_email, role, status: 'pending' })
        .select()
        .single();
      if (error) throw new Error(`[db/supabase] inviteTeamMember: ${error.message}`);
      return data;
    },

    async updateTeamMemberStatus(id, status) {
      const { data, error } = await _client
        .from('team_members')
        .update({ status })
        .eq('id', id)
        .eq('admin_user_id', userId)
        .select()
        .maybeSingle();
      if (error) throw new Error(`[db/supabase] updateTeamMemberStatus: ${error.message}`);
      return data;
    },

    async removeTeamMember(id) {
      const { error } = await _client
        .from('team_members')
        .delete()
        .eq('id', id)
        .eq('admin_user_id', userId);
      if (error) throw new Error(`[db/supabase] removeTeamMember: ${error.message}`);
    },

    // ── Proposals ──────────────────────────────────────────────────────────────

    async listProposals({ opportunityId } = {}) {
      let q = _client
        .from('proposals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (opportunityId !== undefined && opportunityId !== null) {
        q = q.eq('opportunity_id', opportunityId);
      }
      const { data, error } = await q;
      if (error) throw new Error(`[db/supabase] listProposals: ${error.message}`);
      return data || [];
    },

    async getProposal(id) {
      const { data: proposal, error: pErr } = await _client
        .from('proposals')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();
      if (pErr) throw new Error(`[db/supabase] getProposal: ${pErr.message}`);
      if (!proposal) return null;
      const { data: items, error: iErr } = await _client
        .from('proposal_line_items')
        .select('*')
        .eq('proposal_id', id)
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });
      if (iErr) throw new Error(`[db/supabase] getProposal lineItems: ${iErr.message}`);
      return { ...proposal, line_items: items || [] };
    },

    async createProposal(fields) {
      const { line_items = [], ...proposalFields } = fields;
      const { data: proposal, error: pErr } = await _client
        .from('proposals')
        .insert({ ...proposalFields, user_id: userId })
        .select()
        .single();
      if (pErr) throw new Error(`[db/supabase] createProposal: ${pErr.message}`);
      let items = [];
      if (line_items.length > 0) {
        const rows = line_items.map((li, i) => ({
          ...li,
          proposal_id: proposal.id,
          user_id: userId,
          sort_order: li.sort_order ?? i,
        }));
        const { data: inserted, error: iErr } = await _client
          .from('proposal_line_items')
          .insert(rows)
          .select();
        if (iErr) throw new Error(`[db/supabase] createProposal lineItems: ${iErr.message}`);
        items = inserted || [];
      }
      // Optionally set this as the primary proposal on the opportunity
      if (proposal.opportunity_id) {
        await _client
          .from('opportunities')
          .update({ proposal_id: proposal.id })
          .eq('id', proposal.opportunity_id)
          .eq('user_id', userId);
      }
      return { ...proposal, line_items: items };
    },

    async updateProposal(id, fields) {
      const { line_items, ...proposalFields } = fields;
      const { data: proposal, error: pErr } = await _client
        .from('proposals')
        .update(proposalFields)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (pErr) throw new Error(`[db/supabase] updateProposal: ${pErr.message}`);

      // Replace-all strategy for line items: simpler than diffing, fine at this scale.
      // Future optimization: switch to diff-based upsert if line item edit volume becomes high.
      if (Array.isArray(line_items)) {
        const { error: dErr } = await _client
          .from('proposal_line_items')
          .delete()
          .eq('proposal_id', id)
          .eq('user_id', userId);
        if (dErr) throw new Error(`[db/supabase] updateProposal deleteItems: ${dErr.message}`);
        if (line_items.length > 0) {
          const rows = line_items.map((li, i) => {
            const { id: _liId, ...rest } = li;
            return { ...rest, proposal_id: id, user_id: userId, sort_order: rest.sort_order ?? i };
          });
          const { error: iErr } = await _client
            .from('proposal_line_items')
            .insert(rows);
          if (iErr) throw new Error(`[db/supabase] updateProposal insertItems: ${iErr.message}`);
        }
      }

      const { data: items, error: lErr } = await _client
        .from('proposal_line_items')
        .select('*')
        .eq('proposal_id', id)
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });
      if (lErr) throw new Error(`[db/supabase] updateProposal listItems: ${lErr.message}`);
      return { ...proposal, line_items: items || [] };
    },

    async deleteProposal(id) {
      // Clear opportunities.proposal_id if it currently points here
      await _client
        .from('opportunities')
        .update({ proposal_id: null })
        .eq('proposal_id', id)
        .eq('user_id', userId);
      const { error, count } = await _client
        .from('proposals')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw new Error(`[db/supabase] deleteProposal: ${error.message}`);
      return (count || 0) > 0;
    },

    async setProposalStatus(id, status, timestamps = {}) {
      const updates = { status, ...timestamps };
      const { data, error } = await _client
        .from('proposals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .maybeSingle();
      if (error) throw new Error(`[db/supabase] setProposalStatus: ${error.message}`);
      return data;
    },

    // ── Payments ───────────────────────────────────────────────────────────────

    async listPayments({ opportunityId } = {}) {
      let q = _client
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });
      if (opportunityId !== undefined && opportunityId !== null) {
        q = q.eq('opportunity_id', opportunityId);
      }
      const { data, error } = await q;
      if (error) throw new Error(`[db/supabase] listPayments: ${error.message}`);
      return data || [];
    },

    async getPayment(id) {
      const { data, error } = await _client
        .from('payments')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw new Error(`[db/supabase] getPayment: ${error.message}`);
      return data || null;
    },

    async createPayment(fields) {
      const { data, error } = await _client
        .from('payments')
        .insert({ ...fields, user_id: userId })
        .select()
        .single();
      if (error) throw new Error(`[db/supabase] createPayment: ${error.message}`);
      return data;
    },

    async updatePayment(id, fields) {
      const { data, error } = await _client
        .from('payments')
        .update(fields)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .maybeSingle();
      if (error) throw new Error(`[db/supabase] updatePayment: ${error.message}`);
      return data;
    },

    // Webhook lookup — by stripe IDs (uses service role; not user-scoped because
    // the webhook arrives without auth context. Caller must validate signature.)
    async findPaymentByStripeRef({ session_id, payment_intent_id }) {
      let q = _client.from('payments').select('*');
      if (session_id) q = q.eq('stripe_session_id', session_id);
      else if (payment_intent_id) q = q.eq('stripe_payment_intent_id', payment_intent_id);
      else return null;
      const { data, error } = await q.maybeSingle();
      if (error) throw new Error(`[db/supabase] findPaymentByStripeRef: ${error.message}`);
      return data || null;
    },

    // Atomic-ish balance decrement (best-effort — Supabase doesn't expose a
    // RETURNING + arithmetic update helper; we read-then-write, accepting
    // that a concurrent webhook racing this is unlikely at our scale).
    async decrementOpportunityBalance(opportunityId, amount) {
      const { data: opp, error: rErr } = await _client
        .from('opportunities')
        .select('balance_due')
        .eq('id', opportunityId)
        .eq('user_id', userId)
        .maybeSingle();
      if (rErr) throw new Error(`[db/supabase] decrementOpportunityBalance read: ${rErr.message}`);
      if (!opp) return null;
      const current = parseFloat(opp.balance_due) || 0;
      const next = Math.max(0, current - amount);
      const { error: uErr } = await _client
        .from('opportunities')
        .update({ balance_due: String(next) })
        .eq('id', opportunityId)
        .eq('user_id', userId);
      if (uErr) throw new Error(`[db/supabase] decrementOpportunityBalance write: ${uErr.message}`);
      return next;
    },
  };
}

// ── Webhook helpers (no user context — service-role only, signature-verified upstream) ──

async function findPaymentByStripeRefAdmin({ session_id, payment_intent_id }) {
  if (!_client) throw new Error('[db/supabase] client not initialized');
  let q = _client.from('payments').select('*');
  if (session_id) q = q.eq('stripe_session_id', session_id);
  else if (payment_intent_id) q = q.eq('stripe_payment_intent_id', payment_intent_id);
  else return null;
  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(`[db/supabase] findPaymentByStripeRefAdmin: ${error.message}`);
  return data || null;
}

async function adminUpdatePayment(id, fields) {
  if (!_client) throw new Error('[db/supabase] client not initialized');
  const { data, error } = await _client
    .from('payments')
    .update(fields)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`[db/supabase] adminUpdatePayment: ${error.message}`);
  return data;
}

async function adminDecrementOpportunityBalance(opportunityId, userIdOwner, amount) {
  if (!_client) throw new Error('[db/supabase] client not initialized');
  const { data: opp, error: rErr } = await _client
    .from('opportunities')
    .select('balance_due')
    .eq('id', opportunityId)
    .eq('user_id', userIdOwner)
    .maybeSingle();
  if (rErr) throw new Error(`[db/supabase] adminDecrementOpportunityBalance read: ${rErr.message}`);
  if (!opp) return null;
  const current = parseFloat(opp.balance_due) || 0;
  const next = Math.max(0, current - amount);
  const { error: uErr } = await _client
    .from('opportunities')
    .update({ balance_due: String(next) })
    .eq('id', opportunityId)
    .eq('user_id', userIdOwner);
  if (uErr) throw new Error(`[db/supabase] adminDecrementOpportunityBalance write: ${uErr.message}`);
  return next;
}

async function adminLogActivity(jobId, userIdOwner, type, note) {
  if (!_client) throw new Error('[db/supabase] client not initialized');
  const { error } = await _client
    .from('activities')
    .insert({ job_id: jobId, user_id: userIdOwner, type, note });
  if (error) throw new Error(`[db/supabase] adminLogActivity: ${error.message}`);
}

// Team-invite acceptance — invitee's user_id differs from the admin who created
// the invite, so this must be admin-mode (no per-user filter).
async function acceptTeamInviteAdmin(inviteId, memberUserId, memberEmail) {
  if (!_client) throw new Error('[db/supabase] client not initialized');
  const { data: invite, error: rErr } = await _client
    .from('team_members')
    .select('*')
    .eq('id', inviteId)
    .maybeSingle();
  if (rErr) throw new Error(`[db/supabase] acceptTeamInviteAdmin read: ${rErr.message}`);
  if (!invite) return { ok: false, reason: 'not_found' };
  if (invite.status === 'revoked') return { ok: false, reason: 'revoked' };
  // Optional: verify the auth email matches the invite email
  if (memberEmail && invite.invite_email && invite.invite_email.toLowerCase() !== memberEmail.toLowerCase()) {
    return { ok: false, reason: 'email_mismatch' };
  }
  const { data, error: uErr } = await _client
    .from('team_members')
    .update({
      member_user_id: memberUserId,
      status: 'active',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', inviteId)
    .select()
    .single();
  if (uErr) throw new Error(`[db/supabase] acceptTeamInviteAdmin write: ${uErr.message}`);
  return { ok: true, invite: data };
}

async function getTeamInviteAdmin(inviteId) {
  if (!_client) throw new Error('[db/supabase] client not initialized');
  const { data, error } = await _client
    .from('team_members')
    .select('*')
    .eq('id', inviteId)
    .maybeSingle();
  if (error) throw new Error(`[db/supabase] getTeamInviteAdmin: ${error.message}`);
  return data || null;
}

// ── Proposal share links / public client view (admin/service-role) ──────────

async function createShareLinkAdmin({ proposal_id, user_id, token, expires_at, version_id }) {
  if (!_client) throw new Error('[db/supabase] client not initialized');
  const { data, error } = await _client
    .from('proposal_share_links')
    .insert({ proposal_id, user_id, token, expires_at, version_id: version_id || null })
    .select()
    .single();
  if (error) throw new Error(`[db/supabase] createShareLinkAdmin: ${error.message}`);
  return data;
}

async function getShareLinkByTokenAdmin(token) {
  if (!_client) throw new Error('[db/supabase] client not initialized');
  const { data, error } = await _client
    .from('proposal_share_links')
    .select('*')
    .eq('token', token)
    .is('revoked_at', null)
    .maybeSingle();
  if (error) throw new Error(`[db/supabase] getShareLinkByTokenAdmin: ${error.message}`);
  return data || null;
}

async function bumpShareLinkOpenedAdmin(id) {
  if (!_client) throw new Error('[db/supabase] client not initialized');
  // Read-then-write because Supabase doesn't expose atomic increment helpers.
  const { data: link } = await _client
    .from('proposal_share_links')
    .select('opened_count')
    .eq('id', id)
    .maybeSingle();
  const next = ((link?.opened_count || 0) + 1);
  await _client
    .from('proposal_share_links')
    .update({ opened_count: next, last_opened_at: new Date().toISOString() })
    .eq('id', id);
}

async function getProposalForPublicAdmin(proposalId) {
  if (!_client) throw new Error('[db/supabase] client not initialized');
  const { data: proposal, error: pErr } = await _client
    .from('proposals')
    .select('*')
    .eq('id', proposalId)
    .maybeSingle();
  if (pErr) throw new Error(`[db/supabase] getProposalForPublicAdmin: ${pErr.message}`);
  if (!proposal) return null;
  const { data: items } = await _client
    .from('proposal_line_items')
    .select('*')
    .eq('proposal_id', proposalId)
    .order('sort_order', { ascending: true });
  return { ...proposal, line_items: items || [] };
}

async function recordSignatureAdmin(payload) {
  if (!_client) throw new Error('[db/supabase] client not initialized');
  const { data, error } = await _client
    .from('proposal_signatures')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(`[db/supabase] recordSignatureAdmin: ${error.message}`);
  return data;
}

async function recordRevisionRequestAdmin(payload) {
  if (!_client) throw new Error('[db/supabase] client not initialized');
  const { data, error } = await _client
    .from('proposal_revision_requests')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(`[db/supabase] recordRevisionRequestAdmin: ${error.message}`);
  return data;
}

async function setProposalStatusAdmin(proposalId, status, timestamps = {}) {
  if (!_client) throw new Error('[db/supabase] client not initialized');
  const { data, error } = await _client
    .from('proposals')
    .update({ status, ...timestamps })
    .eq('id', proposalId)
    .select()
    .maybeSingle();
  if (error) throw new Error(`[db/supabase] setProposalStatusAdmin: ${error.message}`);
  return data;
}

async function createVersionSnapshotAdmin({ proposal_id, user_id, version_number, snapshot, share_link_id }) {
  if (!_client) throw new Error('[db/supabase] client not initialized');
  const { data, error } = await _client
    .from('proposal_versions')
    .insert({ proposal_id, user_id, version_number, snapshot, share_link_id })
    .select()
    .single();
  if (error) throw new Error(`[db/supabase] createVersionSnapshotAdmin: ${error.message}`);
  return data;
}

async function getNextVersionNumberAdmin(proposalId) {
  if (!_client) throw new Error('[db/supabase] client not initialized');
  const { data } = await _client
    .from('proposal_versions')
    .select('version_number')
    .eq('proposal_id', proposalId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.version_number || 0) + 1);
}

module.exports = {
  forUser,
  // Admin helpers used by the Stripe webhook (no user JWT context)
  findPaymentByStripeRefAdmin,
  adminUpdatePayment,
  adminDecrementOpportunityBalance,
  adminLogActivity,
  // Admin helpers for team-invite acceptance
  getTeamInviteAdmin,
  acceptTeamInviteAdmin,
  // Admin helpers for public proposal view + signature + versions
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
