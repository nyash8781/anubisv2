const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { getDb, useSupabase } = require('../db/index');
const { isServiceConfigured, env } = require('../config/env');
const logger = require('../lib/logger');

// Admin store handles (no per-user filter — used for invite acceptance where
// the invitee's user_id differs from the admin who created the invite).
const adminStore = useSupabase
  ? require('../db/supabaseStore')
  : require('../db/jsonStore');

const router = Router();

// GET /team — list team members for the admin
router.get('/', requireAuth, async (req, res) => {
  const db = getDb(req.user.id);
  try {
    const members = await db.listTeamMembers();
    res.json(members);
  } catch (err) {
    logger.error({ err }, 'GET /team failed');
    res.status(500).json({ error: 'Failed to load team members' });
  }
});

// GET /team/invites/:id — public-ish lookup used by the accept page
// Returns minimal invite info so the accept page can show "You're being invited
// to {Company Name} as {role}". Requires auth (the invitee is logged in).
router.get('/invites/:id', requireAuth, async (req, res) => {
  try {
    const invite = await adminStore.getTeamInviteAdmin(req.params.id);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.status === 'revoked') return res.status(410).json({ error: 'This invite has been revoked' });
    res.json({
      id: invite.id,
      invite_email: invite.invite_email,
      role: invite.role,
      status: invite.status,
      invited_at: invite.invited_at,
      // Don't expose admin_user_id to the invitee
    });
  } catch (err) {
    logger.error({ err, id: req.params.id }, 'GET /team/invites/:id failed');
    res.status(500).json({ error: 'Failed to load invite' });
  }
});

// POST /team/accept — invitee accepts an invite by id
// The invitee is signed in (this route requires auth). We verify the invite
// exists + isn't revoked, then bind member_user_id to the current auth user.
router.post('/accept', requireAuth, async (req, res) => {
  const { invite_id } = req.body;
  if (!invite_id || typeof invite_id !== 'string') {
    return res.status(400).json({ error: 'invite_id is required' });
  }
  try {
    const result = await adminStore.acceptTeamInviteAdmin(invite_id, req.user.id, req.user.email);
    if (!result.ok) {
      const codeMap = { not_found: 404, revoked: 410, email_mismatch: 403 };
      const status = codeMap[result.reason] || 400;
      const messageMap = {
        not_found: 'Invite not found',
        revoked: 'This invite has been revoked',
        email_mismatch: 'Invite email does not match the signed-in account',
      };
      return res.status(status).json({ error: messageMap[result.reason] || 'Cannot accept invite' });
    }
    res.json({ ok: true, invite: result.invite });
  } catch (err) {
    logger.error({ err }, 'POST /team/accept failed');
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// POST /team/invite — invite a new team member by email
router.post('/invite', requireAuth, async (req, res) => {
  const { email, role } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email is required' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const db = getDb(req.user.id);
  try {
    const member = await db.inviteTeamMember(normalizedEmail, role || 'member');

    // Best-effort invite email send. Gracefully no-ops when Resend isn't configured.
    let emailSent = false;
    let emailError = null;
    if (isServiceConfigured('resend')) {
      try {
        const { Resend } = require('resend');
        const resend = new Resend(env.resendApiKey);
        const settings = await db.getSettings().catch(() => ({}));
        const businessName = settings?.business_name || settings?.businessProfile?.companyName || 'Anubis';
        const fromEmail = process.env.RESEND_FROM_EMAIL || `noreply@${process.env.RESEND_DOMAIN || 'example.com'}`;
        const acceptUrl = `${process.env.FRONTEND_URL || ''}/team/accept?invite_id=${encodeURIComponent(member.id)}`;

        await resend.emails.send({
          from: `${businessName} <${fromEmail}>`,
          to: normalizedEmail,
          subject: `You've been invited to ${businessName} on Anubis`,
          html: `
            <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 540px; margin: auto; padding: 24px;">
              <h2 style="font-size: 20px; margin: 0 0 16px;">You've been invited to ${businessName}</h2>
              <p style="color: #444; line-height: 1.55;">
                You were added to the ${businessName} team on Anubis as <strong>${role || 'member'}</strong>.
                Click the button below to accept the invitation and sign in.
              </p>
              <p style="margin: 24px 0;">
                <a href="${acceptUrl}"
                   style="display: inline-block; background: #0052FF; color: #fff; text-decoration: none;
                          padding: 12px 20px; border-radius: 8px; font-weight: 600;">
                  Accept Invitation
                </a>
              </p>
              <p style="color: #888; font-size: 13px; line-height: 1.5;">
                If you didn't expect this invite you can safely ignore this email.
              </p>
            </div>
          `,
          text: `You've been invited to ${businessName} on Anubis. Accept here: ${acceptUrl}`,
        });
        emailSent = true;
      } catch (err) {
        logger.error({ err }, 'Resend invite email send failed (invite row was still created)');
        emailError = err.message;
      }
    } else {
      // DEFERRED: team.invite.email
      // See local/reports/deferred_implementation.md
      logger.warn('[DEFERRED team.invite.email] Resend not configured — invite created without email');
    }

    res.status(201).json({
      ...member,
      email_sent: emailSent,
      email_error: emailError,
    });
  } catch (err) {
    logger.error({ err }, 'POST /team/invite failed');
    if (err.message?.includes('unique')) {
      return res.status(409).json({ error: 'This email has already been invited' });
    }
    res.status(500).json({ error: 'Failed to invite team member' });
  }
});

// PUT /team/:id — update member status (active | revoked)
router.put('/:id', requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!['active', 'revoked', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  const db = getDb(req.user.id);
  try {
    const updated = await db.updateTeamMemberStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Team member not found' });
    res.json(updated);
  } catch (err) {
    logger.error({ err }, 'PUT /team/:id failed');
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

// DELETE /team/:id — remove a team member
router.delete('/:id', requireAuth, async (req, res) => {
  const db = getDb(req.user.id);
  try {
    await db.removeTeamMember(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'DELETE /team/:id failed');
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

module.exports = router;
