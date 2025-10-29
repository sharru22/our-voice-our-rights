const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const dir = path.join(process.cwd(), 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  const client = await pool.connect();
  try {
    for (const f of files) {
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      await client.query(sql);
    }
    console.log('Migrations applied');
  } finally {
    client.release();
  }
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
