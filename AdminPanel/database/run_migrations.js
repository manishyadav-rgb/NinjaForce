const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_SFK9nH2uTaIi@ep-falling-unit-aocdzkhh-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const files = [
    "001_init_schema.sql",
    "002_team_cart_orders.sql",
    "004_multi_tenant.sql",
    "005_sites_table.sql",
    "006_team_permissions.sql",
  ];
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`SKIP: ${file} not found`);
      continue;
    }
    const sql = fs.readFileSync(filePath, "utf-8");
    console.log(`Running ${file}...`);
    try {
      await pool.query(sql);
      console.log(`✅ ${file} completed`);
    } catch (err) {
      console.error(`❌ ${file} error:`, err.message);
    }
  }
  await pool.end();
  console.log("Done!");
}

run();
