// Admin role authorization middleware
// Checks for is_admin claim in JWT custom claims or env-defined admin user IDs
// Phase B.8

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);

function requireAdmin(req, res, next) {
  // Must be authenticated
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check for admin role via custom JWT claim
  const isAdmin =
    req.user.app_metadata?.is_admin === true ||
    ADMIN_USER_IDS.includes(req.user.id);

  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Continue to next middleware
  next();
}

module.exports = { requireAdmin };
