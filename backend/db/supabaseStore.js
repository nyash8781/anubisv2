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
      const { data, error } = await _client
        .from(TABLE)
        .insert({ ...jobData, user_id: userId })
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
  };
}

module.exports = { forUser };
