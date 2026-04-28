const fs = require('fs');
const path = require('path');

const jobsFilePath = path.join(__dirname, '..', 'data', 'jobs.json');

function ensureFile() {
  const dir = path.dirname(jobsFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(jobsFilePath)) fs.writeFileSync(jobsFilePath, '[]', 'utf8');
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
      jobs.unshift(data);
      _write(jobs);
      return data;
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
  };
}

module.exports = { forUser };
