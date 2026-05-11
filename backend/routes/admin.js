// Admin routes
// All routes require admin role verification
// Phase B.7, Phase F (feature flags and overrides)

const { Router } = require('express');
const { requireAdmin } = require('../middleware/requireAdmin');
const { supabaseServiceClient } = require('../db/client');
const logger = require('../lib/logger');
const featureFlagService = require('../services/featureFlagService');
const usageService = require('../services/usageService');

const router = Router();

// All admin routes require admin role
router.use(requireAdmin);

// GET /admin/companies — List all organizations with usage this month
router.get('/companies', async (req, res) => {
  try {
    const currentMonth = new Date();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    // Query organizations with their plan info and AI usage this month
    const { data: companies, error: companiesError } = await supabaseServiceClient
      .from('organizations')
      .select(`
        id,
        name,
        owner_user_id,
        status,
        created_at,
        updated_at,
        organization_plans (
          plan_id,
          started_at,
          override_limits,
          plans (
            name,
            price_monthly
          )
        )
      `)
      .eq('organizations.status', 'active')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (companiesError) {
      logger.error({ error: companiesError }, 'Failed to fetch companies');
      return res.status(500).json({ error: 'Failed to fetch companies' });
    }

    // Get owner emails and AI usage for each company
    const companiesWithUsage = await Promise.all(
      (companies || []).map(async (company) => {
        // Get owner email
        const { data: ownerData } = await supabaseServiceClient
          .from('auth.users')
          .select('email')
          .eq('id', company.owner_user_id)
          .single();

        // Get AI usage this month
        const { data: usageData } = await supabaseServiceClient
          .from('usage_monthly_rollups')
          .select('total_count')
          .eq('organization_id', company.id)
          .eq('year', year)
          .eq('month', month)
          .eq('metric_key', 'ai_generations')
          .single();

        return {
          id: company.id,
          name: company.name,
          ownerEmail: ownerData?.email,
          plan: company.organization_plans?.[0]?.plans?.name || 'Unknown',
          status: company.status,
          createdAt: company.created_at,
          lastActive: company.updated_at,
          aiCallsThisMonth: usageData?.total_count || 0,
        };
      })
    );

    res.json({ companies: companiesWithUsage });
  } catch (err) {
    logger.error({ error: err }, 'Unexpected error in /admin/companies');
    res.status(500).json({ error: 'Unexpected error' });
  }
});

// GET /admin/companies/:id — Single organization deep-dive
router.get('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch organization with full details
    const { data: company, error: companyError } = await supabaseServiceClient
      .from('organizations')
      .select(`
        id,
        name,
        owner_user_id,
        status,
        created_at,
        updated_at,
        metadata,
        organization_plans (
          id,
          plan_id,
          started_at,
          override_limits,
          plans (
            id,
            name,
            price_monthly
          )
        )
      `)
      .eq('id', id)
      .single();

    if (companyError || !company) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get owner email and settings
    const { data: ownerData } = await supabaseServiceClient
      .from('auth.users')
      .select('email')
      .eq('id', company.owner_user_id)
      .single();

    const { data: settingsData } = await supabaseServiceClient
      .from('user_settings')
      .select('base_prompt,business_context,extra')
      .eq('user_id', company.owner_user_id)
      .single();

    // Get team members
    const { data: teamData } = await supabaseServiceClient
      .from('team_members')
      .select('id,email,role,status,created_at')
      .eq('organization_id', id);

    // Get this month's usage
    const currentMonth = new Date();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    const { data: usageData } = await supabaseServiceClient
      .from('usage_monthly_rollups')
      .select('metric_key,total_count,estimated_cost_usd')
      .eq('organization_id', id)
      .eq('year', year)
      .eq('month', month);

    res.json({
      company: {
        id: company.id,
        name: company.name,
        ownerEmail: ownerData?.email,
        status: company.status,
        createdAt: company.created_at,
        settings: {
          businessName: settingsData?.extra?.business_name,
          serviceArea: settingsData?.extra?.service_area,
          basePrompt: settingsData?.base_prompt,
          businessContext: settingsData?.business_context,
        },
        plan: company.organization_plans?.[0],
        teamCount: teamData?.length || 0,
        teamMembers: teamData || [],
        usage: usageData || [],
      },
    });
  } catch (err) {
    logger.error({ error: err }, 'Unexpected error in /admin/companies/:id');
    res.status(500).json({ error: 'Unexpected error' });
  }
});

// PUT /admin/companies/:id/limits — Update org limit overrides
router.put('/companies/:id/limits', async (req, res) => {
  try {
    const { id } = req.params;
    const { override_limits, notes } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Get current plan to update with override
    const { data: currentPlan, error: planError } = await supabaseServiceClient
      .from('organization_plans')
      .select('id')
      .eq('organization_id', id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (planError || !currentPlan) {
      return res.status(404).json({ error: 'Organization or plan not found' });
    }

    // Update organization_plans with override
    const { error: updateError } = await supabaseServiceClient
      .from('organization_plans')
      .update({
        override_limits: override_limits || null,
        notes: notes || null,
        overridden_by_admin_id: req.user.id,
        overridden_at: new Date().toISOString(),
      })
      .eq('id', currentPlan.id);

    if (updateError) {
      logger.error({ error: updateError }, 'Failed to update limit overrides');
      return res.status(500).json({ error: 'Failed to update overrides' });
    }

    // Log admin action
    usageService.log(id, req.user.id, 'admin_override_changed', {
      field: 'limits',
      override_limits,
      notes,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error({ error: err }, 'Unexpected error in PUT /admin/companies/:id/limits');
    res.status(500).json({ error: 'Unexpected error' });
  }
});

// PUT /admin/companies/:id/features — Toggle features per org
router.put('/companies/:id/features', async (req, res) => {
  try {
    const { id } = req.params;
    const { feature_key, enabled, reason, expires_at } = req.body;

    if (!id || !feature_key) {
      return res.status(400).json({ error: 'Organization ID and feature key required' });
    }

    // Use featureFlagService to set feature override
    const result = await featureFlagService.setFeatureFlag(
      id,
      feature_key,
      enabled,
      reason,
      expires_at
    );

    // Log admin action
    usageService.log(id, req.user.id, 'admin_override_changed', {
      field: 'features',
      feature_key,
      enabled,
      reason,
      expires_at,
    });

    res.json({ success: true, override: result });
  } catch (err) {
    logger.error({ error: err }, 'Unexpected error in PUT /admin/companies/:id/features');
    res.status(500).json({ error: 'Failed to update feature flag' });
  }
});

// POST /admin/impersonate/:userId — Start impersonation session
router.post('/impersonate/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Verify user exists
    const { data: user, error: userError } = await supabaseServiceClient
      .from('auth.users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log impersonation start
    usageService.log(userId, req.user.id, 'admin_impersonation_started', {
      admin_id: req.user.id,
      target_user_email: user.email,
      timestamp: new Date().toISOString(),
    });

    // Return success with user info (real JWT generation would happen on frontend)
    res.json({
      success: true,
      impersonatingUser: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    logger.error({ error: err }, 'Unexpected error in POST /admin/impersonate/:userId');
    res.status(500).json({ error: 'Unexpected error' });
  }
});

// GET /admin — Overview dashboard
router.get('/', async (req, res) => {
  try {
    const currentMonth = new Date();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    // Count active companies
    const { count: activeCompaniesCount } = await supabaseServiceClient
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get total AI calls this month
    const { data: aiUsageData } = await supabaseServiceClient
      .from('usage_monthly_rollups')
      .select('total_count,estimated_cost_usd')
      .eq('year', year)
      .eq('month', month)
      .eq('metric_key', 'ai_generations');

    const totalAICalls = aiUsageData?.reduce((sum, row) => sum + (row.total_count || 0), 0) || 0;
    const estimatedCost = aiUsageData?.reduce((sum, row) => sum + (row.estimated_cost_usd || 0), 0) || 0;

    res.json({
      kpis: {
        activeCompanies: activeCompaniesCount || 0,
        aiCallsThisMonth: totalAICalls,
        estimatedVariableCost: Number(estimatedCost).toFixed(2),
      },
    });
  } catch (err) {
    logger.error({ error: err }, 'Unexpected error in /admin');
    res.status(500).json({ error: 'Unexpected error' });
  }
});

module.exports = router;
