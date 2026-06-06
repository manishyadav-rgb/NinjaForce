const fs = require('fs');
const { Client } = require('pg');

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.substring(0, idx).trim();
      let value = trimmed.substring(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  }
} catch (e) {
  console.log('No .env.local found or error:', e.message);
}

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  try {
    const res = await client.query("select schema_json from builder_pages where id = 'main' and site_id = 'quirkyhome' limit 1");
    if (res.rows.length > 0) {
      const schema = res.rows[0].schema_json;
      if (schema && schema.pages && schema.pages.home) {
        console.log("HOMEPAGE SECTIONS:");
        console.log(JSON.stringify(schema.pages.home.sections, null, 2));
      } else {
        console.log("No home page sections found in schema");
      }
    } else {
      console.log("No page found");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
main();
