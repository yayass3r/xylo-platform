import { Pool } from 'pg';

async function main() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres.bzpgmovnjiqihvzkctlr:%40Yasser1412%40@aws-0-me-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('Connected to database!');
    
    // Test query
    const result = await client.query('SELECT NOW() as now');
    console.log('Current time:', result.rows[0].now);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Existing tables:', tablesResult.rows);
    
    client.release();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
