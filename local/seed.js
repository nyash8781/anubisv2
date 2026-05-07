/**
 * seed.js — Insert sample opportunities into Supabase for yashnaik94@gmail.com
 *
 * Usage:
 *   node local/seed.js
 *
 * Requirements:
 *   - local/.env must have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY filled in
 *   - The opportunities table must exist (run backend/migrations/001_opportunities.sql first)
 *   - @supabase/supabase-js must be installed: npm install --prefix backend
 */

const path = require('path');
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));
dotenv.config({ path: path.join(__dirname, '.env') });

const { createClient } = require(
  path.join(__dirname, '../backend/node_modules/@supabase/supabase-js')
);

const SUPABASE_URL             = (process.env.SUPABASE_URL             || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[seed] ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in local/.env');
  process.exit(1);
}

// Supabase user ID for yashnaik94@gmail.com
// The value from the original SQL — update if this changes
const USER_ID = '7b64caaa-b8bf-48bd-82fa-9e299dfb02d4';

// Corrections from original SQL:
//   - Table name: jobs → opportunities
//   - status 'Active' → 'Contacted'  (not in the allowed enum)
//   - status 'Completed' → 'Closed'  (Sarah is paid and done)
const records = [
  {
    opportunity_id:      '2604100001',
    first_name:          'Marcus',
    last_name:           'Thompson',
    customer_name:       'Marcus Thompson',
    email:               'Nyash8781@gmail.com',
    mobile_number_1:     '9739145795',
    address_1:           '4821 W Camelback Rd',
    city:                'Phoenix',
    state:               'AZ',
    zip_code:            '85031',
    service:             'Panel Upgrade',
    scope_of_work:       '200A panel upgrade, replace main breaker, install surge protector, bring service entrance up to current NEC code.',
    bid:                 '4800',
    payments_received:   '2400',
    balance_due:         '2400',
    due_date:            '2026-05-15',
    milestone:           'Construction',
    status:              'Contacted',
    contact_status:      'Contacted',
    last_contacted_date: '2026-04-18',
    last_contact_method: 'call',
    notes:               'Customer prefers calls after 4pm. Has a dog.',
    user_id:             USER_ID,
  },
  {
    opportunity_id:      '2604100002',
    first_name:          'Diana',
    last_name:           'Reyes',
    customer_name:       'Diana Reyes',
    email:               'Nyash8781@gmail.com',
    mobile_number_1:     '9739145795',
    address_1:           '112 S Dobson Rd',
    city:                'Mesa',
    state:               'AZ',
    zip_code:            '85202',
    service:             'EV Charger Install',
    scope_of_work:       'Install Level 2 EV charger in garage, run 60A circuit from panel, mount NEMA 14-50 outlet. Panel has capacity.',
    bid:                 '1200',
    payments_received:   '0',
    balance_due:         '1200',
    due_date:            '2026-05-01',
    milestone:           'Proposal',
    status:              'New',
    contact_status:      'New',
    last_contacted_date: '',
    last_contact_method: '',
    notes:               'Referred by Marcus Thompson. Tesla Model Y.',
    user_id:             USER_ID,
  },
  {
    opportunity_id:      '2604100003',
    first_name:          'Kevin',
    last_name:           'Okafor',
    customer_name:       'Kevin Okafor',
    email:               'Nyash8781@gmail.com',
    mobile_number_1:     '9739145795',
    address_1:           '7703 N 35th Ave',
    city:                'Glendale',
    state:               'AZ',
    zip_code:            '85301',
    service:             'Whole Home Rewire',
    scope_of_work:       'Full rewire on 1962 build. Replace knob-and-tube, upgrade to 200A service, install AFCI breakers throughout, add 4 new circuits for kitchen remodel.',
    bid:                 '18500',
    payments_received:   '9250',
    balance_due:         '9250',
    due_date:            '2026-06-30',
    milestone:           'Construction',
    status:              'Contacted',
    contact_status:      'Contacted',
    last_contacted_date: '2026-04-20',
    last_contact_method: 'text',
    notes:               'Homeowner is on site daily. Permit pulled 04/10.',
    user_id:             USER_ID,
  },
  {
    opportunity_id:      '2604100004',
    first_name:          'Sarah',
    last_name:           'Whitfield',
    customer_name:       'Sarah Whitfield',
    email:               'Nyash8781@gmail.com',
    mobile_number_1:     '9739145795',
    address_1:           '3390 E Baseline Rd',
    city:                'Gilbert',
    state:               'AZ',
    zip_code:            '85234',
    service:             'Lighting Retrofit',
    scope_of_work:       'Replace 42 recessed cans with LED trims, install 3 dimmer switches, add under-cabinet lighting in kitchen.',
    bid:                 '3200',
    payments_received:   '3200',
    balance_due:         '0',
    due_date:            '2026-04-10',
    milestone:           'Completed',
    status:              'Closed',
    contact_status:      'Contacted',
    last_contacted_date: '2026-04-09',
    last_contact_method: 'email',
    notes:               'Left a great Google review. Ask for referrals.',
    user_id:             USER_ID,
  },
  {
    opportunity_id:      '2604100005',
    first_name:          'James',
    last_name:           'Nguyen',
    customer_name:       'James Nguyen',
    email:               'Nyash8781@gmail.com',
    mobile_number_1:     '9739145795',
    address_1:           '910 E McDowell Rd',
    city:                'Phoenix',
    state:               'AZ',
    zip_code:            '85006',
    service:             'Generator Hookup',
    scope_of_work:       'Install 22kW standby generator, transfer switch, gas line tie-in coordination with SWG. HOA approval pending.',
    bid:                 '6400',
    payments_received:   '0',
    balance_due:         '6400',
    due_date:            '2026-05-20',
    milestone:           'Site Visit',
    status:              'New',
    contact_status:      'New',
    last_contacted_date: '',
    last_contact_method: '',
    notes:               'HOA approval expected mid-April. Do not start until confirmed.',
    user_id:             USER_ID,
  },
  {
    opportunity_id:      '2604100006',
    first_name:          'Brenda',
    last_name:           'Castro',
    customer_name:       'Brenda Castro',
    email:               'Nyash8781@gmail.com',
    mobile_number_1:     '9739145795',
    address_1:           '2201 W University Dr',
    city:                'Tempe',
    state:               'AZ',
    zip_code:            '85281',
    service:             'Commercial Tenant Buildout',
    scope_of_work:       'New 1200 sqft salon tenant space. 100A sub-panel, 8 circuits for styling stations, 2 shampoo bowl circuits, exhaust fan wiring, emergency lighting.',
    bid:                 '9800',
    payments_received:   '0',
    balance_due:         '9800',
    due_date:            '2026-06-15',
    milestone:           'Lead',
    status:              'Draft',
    contact_status:      'New',
    last_contacted_date: '',
    last_contact_method: '',
    notes:               'First contact 04/21. Awaiting signed proposal.',
    user_id:             USER_ID,
  },
];

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Verify the table exists
  console.log('[seed] Connecting to Supabase:', SUPABASE_URL);
  const { error: pingError } = await supabase
    .from('opportunities')
    .select('id')
    .limit(1);

  if (pingError) {
    if (pingError.message.includes('does not exist') || pingError.code === '42P01') {
      console.error('[seed] ERROR: The "opportunities" table does not exist.');
      console.error('        Run backend/migrations/001_opportunities.sql in the Supabase SQL Editor first.');
      console.error('        Dashboard → SQL Editor → paste the file → Run');
    } else {
      console.error('[seed] ERROR connecting to Supabase:', pingError.message);
    }
    process.exit(1);
  }

  console.log('[seed] Table found. Inserting', records.length, 'records for user', USER_ID, '...\n');

  let passed = 0;
  let failed = 0;

  for (const rec of records) {
    const { data, error } = await supabase
      .from('opportunities')
      .insert(rec)
      .select('id, opportunity_id, first_name, last_name')
      .single();

    if (error) {
      console.error(`  [FAIL] ${rec.opportunity_id} ${rec.customer_name} — ${error.message}`);
      failed++;
    } else {
      console.log(`  [OK]   ${data.opportunity_id}  ${data.first_name} ${data.last_name}  (id: ${data.id})`);
      passed++;
    }
  }

  console.log(`\n[seed] Done. ${passed} inserted, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('[seed] Unexpected error:', err.message);
  process.exit(1);
});
