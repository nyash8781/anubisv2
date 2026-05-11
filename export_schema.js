const pg = require('pg');

const client = new pg.Client({
  host: 'db.eoinbhgqadvtuxapxtnz.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'vz5NQTi7wvIhpcXL',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    await client.connect();
    console.log('Connected to Supabase!');

    // Get all tables
    const tablesRes = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log('\n=== TABLES IN PUBLIC SCHEMA ===\n');
    tablesRes.rows.forEach(row => console.log(`- ${row.tablename}`));

    // Get detailed schema for each table
    console.log('\n\n=== TABLE DEFINITIONS ===\n');

    for (const row of tablesRes.rows) {
      const tableName = row.tablename;
      const defRes = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      console.log(`\n-- TABLE: ${tableName}`);
      console.log(`CREATE TABLE IF NOT EXISTS ${tableName} (`);
      defRes.rows.forEach((col, idx) => {
        const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        const comma = idx < defRes.rows.length - 1 ? ',' : '';
        console.log(`  ${col.column_name} ${col.data_type}${nullable}${defaultVal}${comma}`);
      });
      console.log(`);`);
    }

    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
