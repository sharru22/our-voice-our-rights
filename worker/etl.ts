import fetch from 'node-fetch';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const key = process.env.DATA_GOV_API_KEY;
  if (!key) {
    console.error('DATA_GOV_API_KEY missing');
    process.exit(1);
  }
  const client = await pool.connect();
  try {
    await client.query("insert into etl_log(status, message) values($1,$2)", ['ok', 'bootstrap']);
  } finally {
    client.release();
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
