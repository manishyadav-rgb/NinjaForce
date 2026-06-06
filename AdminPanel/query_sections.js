const fs = require('fs');
const { Client } = require('pg');

// Manually parse .env.local
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.substring(0, idx).trim();
      let value = trimmed.substring(idx + 1).trim();
      // Remove surrounding quotes if any
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  }
} catch (e) {
  console.log('No .env.local found or error reading it:', e.message);
}

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  try {
    const res = await client.query("select site_id, id, schema_json from builder_pages");
    for (const row of res.rows) {
      console.log(`Site: ${row.site_id}, Page: ${row.id}`);
      const schema = row.schema_json;
      if (schema && schema.pages) {
        for (const [pageKey, page] of Object.entries(schema.pages)) {
          console.log(`  Page: ${pageKey} (${page.name})`);
          console.log(`    Sections:`, page.sections?.map(s => `${s.type} (visible: ${s.visible})`));
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
main();
