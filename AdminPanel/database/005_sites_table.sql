-- Dynamic Sites Table: stores are no longer hardcoded
-- Run this against NeonDB

CREATE TABLE IF NOT EXISTS sites (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  domain VARCHAR(200) DEFAULT '',
  logo_text VARCHAR(10) NOT NULL DEFAULT 'ST',
  brand_color VARCHAR(20) NOT NULL DEFAULT '#008060',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default site
INSERT INTO sites (id, name, domain, logo_text, brand_color)
VALUES ('quirkyhome', 'QuirkyHome', 'quirkyhome.in', 'QH', '#008060')
ON CONFLICT (id) DO NOTHING;
