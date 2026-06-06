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
    if (res.rows.length === 0) {
      console.log("No quirkyhome main schema found");
      return;
    }
    const schema = res.rows[0].schema_json;
    if (!schema.pages || !schema.pages.home) {
      console.log("No home page schema found");
      return;
    }
    
    const sections = schema.pages.home.sections || [];
    const hasCategoryGrid = sections.some(s => s.type === 'CategoryGrid');
    
    if (hasCategoryGrid) {
      console.log("CategoryGrid is already in the home page schema");
    } else {
      console.log("CategoryGrid is missing. Adding it to the homepage sections...");
      
      const newSection = {
        id: `home-catgrid-${Math.random().toString(36).substring(2, 9)}`,
        type: "CategoryGrid",
        visible: true,
        settings: {
          eyebrow: "Shop by category",
          heading: "Home decor, furnishing and essentials",
          subheading: "Find bedding, wall decor, lighting, kitchen, dining, bath, garden, gifts, storage and showpieces in one place.",
          categoryCount: 5,
          sectionPaddingTop: 24,
          sectionPaddingBottom: 24,
          sectionBgColor: "",
          sectionFullWidth: false
        }
      };
      
      // Insert right after BannerStrip, or at index 1, or at index 0 if no BannerStrip
      const bannerIndex = sections.findIndex(s => s.type === 'BannerStrip');
      const insertIndex = bannerIndex >= 0 ? bannerIndex + 1 : 0;
      
      sections.splice(insertIndex, 0, newSection);
      schema.pages.home.sections = sections;
      
      await client.query(
        "update builder_pages set schema_json = $1, updated_at = now() where id = 'main' and site_id = 'quirkyhome'",
        [JSON.stringify(schema)]
      );
      console.log("Successfully added CategoryGrid to database schema for quirkyhome homepage!");
    }
  } catch (err) {
    console.error("Database query failed:", err);
  } finally {
    await client.end();
  }
}
main();
