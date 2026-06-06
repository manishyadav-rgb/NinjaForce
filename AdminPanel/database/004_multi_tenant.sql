-- Multi-Tenant Migration: Add site_id to core tables
-- Run this against NeonDB

-- 1. Collections
ALTER TABLE collections ADD COLUMN IF NOT EXISTS site_id VARCHAR(50) DEFAULT 'quirkyhome';
CREATE INDEX IF NOT EXISTS idx_collections_site ON collections (site_id);

-- 2. Collection Products (inherits from collections, no direct site_id needed)

-- 3. Builder Pages  
CREATE TABLE IF NOT EXISTS builder_pages (
  id VARCHAR(50) PRIMARY KEY,
  schema_json JSONB NOT NULL,
  site_id VARCHAR(50) NOT NULL DEFAULT 'quirkyhome',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_builder_site ON builder_pages (site_id);

-- 4. Products (if your products table exists)
ALTER TABLE products ADD COLUMN IF NOT EXISTS site_id VARCHAR(50) DEFAULT 'quirkyhome';
CREATE INDEX IF NOT EXISTS idx_products_site ON products (site_id);

-- 5. Customer carts
DO $$ BEGIN
  ALTER TABLE customer_carts ADD COLUMN IF NOT EXISTS site_id VARCHAR(50) DEFAULT 'quirkyhome';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 6. Customer orders
DO $$ BEGIN
  ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS site_id VARCHAR(50) DEFAULT 'quirkyhome';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 7. Update builder_pages primary key to include site_id
-- Change the id to be site-specific
ALTER TABLE builder_pages DROP CONSTRAINT IF EXISTS builder_pages_pkey;
ALTER TABLE builder_pages ADD PRIMARY KEY (id, site_id);
