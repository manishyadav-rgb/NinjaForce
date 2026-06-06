const { Pool } = require("pg");
const crypto = require("crypto");

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_SFK9nH2uTaIi@ep-falling-unit-aocdzkhh-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  // Generate proper password hash for admin123
  const salt = "qh_admin_salt";
  const hash = crypto.createHash("sha256").update(`${salt}:admin123`).digest("hex");
  const passwordHash = `${salt}:${hash}`;
  console.log("Password hash:", passwordHash);

  // Update admin user
  await pool.query(
    "update team_users set password_hash = $1 where email = $2",
    [passwordHash, "admin@quirkyhome.in"]
  );

  // Verify
  const result = await pool.query("select id, email, role, password_hash from team_users");
  console.log("Team users:", JSON.stringify(result.rows, null, 2));

  // Check tables exist
  const tables = await pool.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name"
  );
  console.log("\nAll tables:", tables.rows.map(r => r.table_name).join(", "));

  await pool.end();
}

run().catch(console.error);
