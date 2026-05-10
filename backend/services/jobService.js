// Per-milestone stale defaults (days without contact before flagging as stale).
// These kick in when the user has not configured their own thresholds in Settings.
const STALE_DEFAULTS = {
  Lead: 30,
  'Site Visit': 14,
  Proposal: 30,
  Construction: 14,
};
const STALE_FALLBACK = 30;

const STALE_SETTING_KEYS = {
  Lead: 'stale_lead_days',
  'Site Visit': 'stale_site_visit_days',
  Proposal: 'stale_proposal_days',
  Construction: 'stale_construction_days',
};

function buildCompactId(dateInput, sequence) {
  const created = dateInput ? new Date(dateInput) : new Date();
  const yy = String(created.getFullYear()).slice(-2);
  const mm = String(created.getMonth() + 1).padStart(2, '0');
  const dd = String(created.getDate()).padStart(2, '0');
  const seq = String(sequence).padStart(4, '0');
  return `${yy}${mm}${dd}${seq}`;
}

function getDailySequence(jobs, createdAt) {
  const created = createdAt ? new Date(createdAt) : new Date();
  const yy = String(created.getFullYear()).slice(-2);
  const mm = String(created.getMonth() + 1).padStart(2, '0');
  const dd = String(created.getDate()).padStart(2, '0');
  const prefix = `${yy}${mm}${dd}`;

  const sameDay = jobs
    .map((job) => job.opportunity_id)
    .filter((id) => typeof id === 'string' && id.replace(/^P/, '').startsWith(prefix))
    .map((id) => Number(id.replace(/^P/, '').slice(6)))
    .filter((n) => !Number.isNaN(n));

  if (sameDay.length === 0) return 1;
  return Math.max(...sameDay) + 1;
}

function computeFlags(job, settings = {}) {
  if (!job.last_contacted_date) {
    return { isStale: false, isAged: false, agedType: null };
  }
  const last = new Date(job.last_contacted_date);
  const now = new Date();
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));

  const milestone = job.milestone || 'Lead';
  const settingKey = STALE_SETTING_KEYS[milestone];
  const defaultDays = STALE_DEFAULTS[milestone] ?? STALE_FALLBACK;
  const staleDays = settingKey && settings[settingKey]
    ? (parseInt(settings[settingKey], 10) || defaultDays)
    : defaultDays;

  const agingThreshold = settings.aging_threshold_days
    ? (parseInt(settings.aging_threshold_days, 10) || 60)
    : 60;

  return {
    isStale: diffDays >= staleDays && job.status !== 'Closed',
    isAged: diffDays >= agingThreshold,
    agedType: diffDays >= agingThreshold * 2 ? 'old' : diffDays >= agingThreshold ? 'aging' : null,
  };
}

function normalizeJob(job, settings = {}) {
  const nextJob = { ...job };
  if (!nextJob.created_at) nextJob.created_at = new Date().toISOString();
  if (!nextJob.milestone) nextJob.milestone = settings.default_new_milestone || 'Lead';
  if (!nextJob.status) {
    nextJob.status =
      nextJob.opportunity_id && String(nextJob.opportunity_id).startsWith('P')
        ? 'Draft'
        : (settings.default_new_status || 'New');
  }
  if (!nextJob.contact_status) nextJob.contact_status = nextJob.status;
  nextJob.flags = computeFlags(nextJob, settings);
  return nextJob;
}

function updateContact(job, method, settings = {}) {
  const autoMarkKeys = { call: 'auto_mark_contacted_call', text: 'auto_mark_contacted_text', email: 'auto_mark_contacted_email' };
  const settingKey = autoMarkKeys[method];
  // Default to true unless explicitly set to false in settings
  const shouldMark = !settingKey || settings[settingKey] !== false;

  return {
    ...job,
    last_contacted_date: new Date().toISOString().split('T')[0],
    last_contact_method: method,
    status: !shouldMark ? job.status : (job.status === 'Draft' ? 'Draft' : 'Contacted'),
    contact_status: !shouldMark ? job.contact_status : (job.status === 'Draft' ? 'Draft' : 'Contacted'),
  };
}

module.exports = { buildCompactId, getDailySequence, normalizeJob, updateContact };
