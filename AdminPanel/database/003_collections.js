const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_SFK9nH2uTaIi@ep-falling-unit-aocdzkhh-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log("Creating collections tables...");
  
  await pool.query(`
    create table if not exists collections (
      id uuid primary key default gen_random_uuid(),
      name varchar(120) not null,
      slug varchar(140) not null unique,
      description text,
      image_url text,
      is_active boolean not null default true,
      sort_order int not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists collection_products (
      collection_id uuid not null references collections(id) on delete cascade,
      product_slug varchar(260) not null,
      sort_order int not null default 0,
      created_at timestamptz not null default now(),
      primary key (collection_id, product_slug)
    );
    create index if not exists idx_collection_products_slug on collection_products(product_slug);
  `);

  console.log("✅ Collections tables created");
  
  // Verify
  const result = await pool.query(
    "select table_name from information_schema.tables where table_schema='public' and table_name like 'collection%' order by table_name"
  );
  console.log("Tables:", result.rows.map(r => r.table_name).join(", "));
  
  await pool.end();
}

run().catch(console.error);
