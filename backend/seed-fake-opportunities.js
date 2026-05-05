#!/usr/bin/env node
/**
 * Seed script — inserts fake opportunities for a given user email.
 * Usage: node backend/seed-fake-opportunities.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_EMAIL = 'yashnaik94@gmail.com';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function pad(n, width) {
  return String(n).padStart(width, '0');
}

function buildId(date, seq) {
  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(2);
  const mm = pad(d.getMonth() + 1, 2);
  const dd = pad(d.getDate(), 2);
  return `P${yy}${mm}${dd}${pad(seq, 4)}`;
}

const opportunities = [
  {
    first_name: 'Marcus', last_name: 'Rivera',
    customer_name: 'Marcus Rivera',
    email: 'marcus.rivera@email.com', phone: '(702) 555-0182',
    address: '4821 Desert Palm Dr', city: 'Las Vegas', state: 'NV', zip_code: '89101',
    service: 'Roof Replacement',
    scope_of_work: 'Full tear-off and replacement of 2,400 sq ft asphalt shingle roof. Install new underlayment, flashing, and ridge vents.',
    price: '18500', bid: '17200', payments_received: '5000', balance_due: '13500',
    milestone: 'Construction', status: 'Contacted',
    notes: 'Customer wants to start before summer heat. Has HOA approval.',
    due_date: '2026-05-15',
    created_at: '2026-04-01T10:00:00Z',
  },
  {
    first_name: 'Jennifer', last_name: 'Walsh',
    customer_name: 'Jennifer Walsh',
    email: 'jwalsh@gmail.com', phone: '(702) 555-0341',
    address: '1103 Sunset Blvd', city: 'Henderson', state: 'NV', zip_code: '89002',
    service: 'Kitchen Remodel',
    scope_of_work: 'Demo existing cabinets and countertops. Install new shaker cabinets, quartz countertops, tile backsplash, and under-cabinet lighting.',
    price: '32000', bid: '29500', payments_received: '29500', balance_due: '0',
    milestone: 'Completed', status: 'Closed',
    notes: 'Great customer — asked for referral card. Left 5-star review.',
    due_date: '2026-03-20',
    created_at: '2026-02-10T09:00:00Z',
  },
  {
    first_name: 'David', last_name: 'Chen',
    customer_name: 'David Chen',
    email: 'd.chen@outlook.com', phone: '(702) 555-0529',
    address: '776 Pebble Creek Ln', city: 'North Las Vegas', state: 'NV', zip_code: '89031',
    service: 'Bathroom Remodel',
    scope_of_work: 'Convert tub to walk-in shower, retile floor and walls, replace vanity and fixtures.',
    price: '14800', bid: '13500', payments_received: '0', balance_due: '14800',
    milestone: 'Proposal', status: 'New',
    notes: 'Sent proposal on Apr 22. Following up this week.',
    due_date: '2026-05-30',
    created_at: '2026-04-18T14:00:00Z',
  },
  {
    first_name: 'Sandra', last_name: 'Okonkwo',
    customer_name: 'Sandra Okonkwo',
    email: 'sokonkwo@icloud.com', phone: '(702) 555-0774',
    address: '2289 Flamingo Rd', city: 'Las Vegas', state: 'NV', zip_code: '89119',
    service: 'Painting (Interior)',
    scope_of_work: 'Paint entire interior — 4 bed, 2.5 bath, living/dining/kitchen. Two coats, patch all holes, trim included.',
    price: '7200', bid: '6800', payments_received: '3400', balance_due: '3800',
    milestone: 'Construction', status: 'Contacted',
    notes: 'In progress. Expected to finish Friday.',
    due_date: '2026-05-02',
    created_at: '2026-04-20T11:00:00Z',
  },
  {
    first_name: 'Tom', last_name: 'Harrington',
    customer_name: 'Tom Harrington',
    email: 'tharrington@hotmail.com', phone: '(702) 555-0913',
    address: '5510 Rancho Dr', city: 'Las Vegas', state: 'NV', zip_code: '89130',
    service: 'AC & HVAC',
    scope_of_work: 'Replace 5-ton central HVAC unit. Install new air handler and condenser. Update thermostat to smart device.',
    price: '11200', bid: '10400', payments_received: '0', balance_due: '11200',
    milestone: 'Site Visit', status: 'New',
    notes: 'Site visit scheduled May 1st at 10am.',
    due_date: '2026-05-10',
    created_at: '2026-04-25T08:00:00Z',
  },
  {
    first_name: 'Priya', last_name: 'Sharma',
    customer_name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com', phone: '(702) 555-0268',
    address: '890 Warm Springs Rd', city: 'Henderson', state: 'NV', zip_code: '89014',
    service: 'Flooring',
    scope_of_work: 'Remove carpet in 3 bedrooms and hallway. Install luxury vinyl plank throughout (~1,100 sq ft).',
    price: '9800', bid: '8950', payments_received: '0', balance_due: '9800',
    milestone: 'Lead', status: 'New',
    notes: 'Found us on Yelp. Interested, has budget. Needs to confirm timeline.',
    due_date: '',
    created_at: '2026-04-27T15:00:00Z',
  },
  {
    first_name: 'Carlos', last_name: 'Mendes',
    customer_name: 'Carlos Mendes',
    email: 'cmendes@yahoo.com', phone: '(702) 555-0447',
    address: '341 Boulder Hwy', city: 'Las Vegas', state: 'NV', zip_code: '89121',
    service: 'Landscaping',
    scope_of_work: 'Remove grass and install drought-resistant xeriscape. Decomposed granite, rock, native plants, drip irrigation.',
    price: '6500', bid: '6000', payments_received: '6000', balance_due: '0',
    milestone: 'Completed', status: 'Closed',
    notes: 'Done. Customer very happy. Want to do backyard next spring.',
    due_date: '2026-04-10',
    created_at: '2026-03-15T10:00:00Z',
  },
  {
    first_name: 'Ashley', last_name: 'Brooks',
    customer_name: 'Ashley Brooks',
    email: 'ashley.b@gmail.com', phone: '(702) 555-0632',
    address: '2047 E Sahara Ave', city: 'Las Vegas', state: 'NV', zip_code: '89104',
    service: 'Window Replacement',
    scope_of_work: 'Replace 12 single-pane windows with double-pane energy efficient. Includes installation and haul-away.',
    price: '13400', bid: '12200', payments_received: '0', balance_due: '13400',
    milestone: 'Proposal', status: 'Contacted',
    notes: 'Sent updated quote. Waiting on HOA approval before signing.',
    due_date: '2026-06-01',
    created_at: '2026-04-22T13:00:00Z',
  },
  {
    first_name: 'Robert', last_name: 'Nguyen',
    customer_name: 'Robert Nguyen',
    email: 'rnguyen@gmail.com', phone: '(702) 555-0815',
    address: '678 S Decatur Blvd', city: 'Las Vegas', state: 'NV', zip_code: '89107',
    service: 'Drywall & Plastering',
    scope_of_work: 'Repair water-damaged drywall in master bedroom and hallway. Texture match and prime.',
    price: '2800', bid: '2500', payments_received: '2500', balance_due: '0',
    milestone: 'Completed', status: 'Closed',
    notes: 'Quick job. Paid cash.',
    due_date: '2026-04-05',
    created_at: '2026-03-28T09:00:00Z',
  },
  {
    first_name: 'Michelle', last_name: 'Torres',
    customer_name: 'Michelle Torres',
    email: 'm.torres@outlook.com', phone: '(702) 555-0361',
    address: '1599 N Rainbow Blvd', city: 'Las Vegas', state: 'NV', zip_code: '89108',
    service: 'Garage Conversion',
    scope_of_work: 'Convert 2-car garage to livable ADU. Insulate walls, drywall, flooring, mini-split HVAC, electrical panel upgrade.',
    price: '48000', bid: '44500', payments_received: '15000', balance_due: '33000',
    milestone: 'Construction', status: 'Contacted',
    notes: 'Permits pulled. Framing starts next week.',
    due_date: '2026-07-01',
    created_at: '2026-03-01T10:00:00Z',
  },
];

async function main() {
  // Look up user by email via auth admin API
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Failed to list users:', usersError.message);
    process.exit(1);
  }

  const user = usersData.users.find((u) => u.email === TARGET_EMAIL);
  if (!user) {
    console.error(`No user found with email ${TARGET_EMAIL}`);
    console.error('Make sure the user has signed up first.');
    process.exit(1);
  }

  console.log(`Found user: ${user.email} (${user.id})`);

  const rows = opportunities.map((opp, i) => ({
    user_id: user.id,
    opportunity_id: buildId(opp.created_at, i + 1),
    ...opp,
  }));

  const { data, error } = await supabase.from('opportunities').insert(rows).select('opportunity_id, customer_name, milestone');

  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }

  console.log(`\nInserted ${data.length} opportunities:\n`);
  data.forEach((r) => console.log(`  ${r.opportunity_id}  ${r.customer_name.padEnd(20)}  ${r.milestone}`));
  console.log('\nDone. Refresh the app to see them.');
}

main();
