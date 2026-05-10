// Activity service — Phase 2 event stream.
// Never throws; all errors are swallowed so activity logging never breaks the request.

async function logActivity(db, { jobId, userId, projectName, action, description, activityType, metadata = {} }) {
  try {
    await db.createActivity({
      job_id: jobId,
      user_id: userId,
      project_name: projectName || '',
      action: action || '',
      description: description || '',
      action_type: activityType,
      metadata,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[activityService] logActivity failed (non-fatal):', err.message);
  }
}

async function getActivity(db, jobId, limit = 50) {
  try {
    return await db.getActivities(jobId, limit);
  } catch (err) {
    console.warn('[activityService] getActivity failed:', err.message);
    return [];
  }
}

module.exports = { logActivity, getActivity };
