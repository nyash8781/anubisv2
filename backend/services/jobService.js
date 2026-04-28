const STALE_DAYS = 14;

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

function computeFlags(job) {
  if (!job.last_contacted_date) {
    return { isStale: false, isAged: false, agedType: null };
  }
  const last = new Date(job.last_contacted_date);
  const now = new Date();
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  return {
    isStale: diffDays >= STALE_DAYS && job.status !== 'Closed',
    isAged: diffDays >= 30,
    agedType: diffDays >= 60 ? 'old' : diffDays >= 30 ? 'aging' : null,
  };
}

function normalizeJob(job) {
  const nextJob = { ...job };
  if (!nextJob.created_at) nextJob.created_at = new Date().toISOString();
  if (!nextJob.milestone) nextJob.milestone = 'Lead';
  if (!nextJob.status) {
    nextJob.status =
      nextJob.opportunity_id && String(nextJob.opportunity_id).startsWith('P')
        ? 'Draft'
        : 'New';
  }
  if (!nextJob.contact_status) nextJob.contact_status = nextJob.status;
  nextJob.flags = computeFlags(nextJob);
  return nextJob;
}

function updateContact(job, method) {
  return {
    ...job,
    last_contacted_date: new Date().toISOString().split('T')[0],
    last_contact_method: method,
    status: job.status === 'Draft' ? 'Draft' : 'Contacted',
    contact_status: job.status === 'Draft' ? 'Draft' : 'Contacted',
  };
}

module.exports = { buildCompactId, getDailySequence, normalizeJob, updateContact };
