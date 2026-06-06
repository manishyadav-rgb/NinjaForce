$env:DATABASE_URL = ((Get-Content .env.local | Where-Object { $_ -like 'DATABASE_URL=*' }) -replace '^DATABASE_URL=', '').Trim()

@'
const { Client } = require("pg");
const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete("sslmode");

const client = new Client({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false }
});

(async () => {
  await client.connect();

  const users = await client.query(`
    select id, phone_e164, full_name, email, last_login_at, created_at
    from users
    order by created_at desc
    limit 10
  `);

  console.table(users.rows);
  await client.end();
})();
'@ | node
