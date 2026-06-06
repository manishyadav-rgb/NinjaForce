# Quirky Home Database Setup (Aurora PostgreSQL)

This folder contains a production-grade initial schema for:
- Phone + OTP login
- User/session/address management
- Products/variants/categories
- Cart/wishlist/orders/payments
- Selective DynamoDB inventory sync mapping

## 1) Run schema

Use your PostgreSQL/Aurora connection string:

```bash
psql "postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require" -f database/001_init_schema.sql
```

## 2) Verify tables quickly

```sql
\dt
select count(*) from users;
select count(*) from products;
select count(*) from inventory_source_mapping;
```

## 3) OTP login flow (backend expectation)

1. `send-otp` API:
- Validate phone in E.164
- Generate OTP, hash it, save in `auth_otp_requests` with expiry
- Send SMS via provider

2. `verify-otp` API:
- Fetch latest unexpired OTP row
- Increment attempts
- On success set `is_verified=true`, `consumed_at=now()`
- Find/create row in `users`
- Create `user_sessions` row and issue tokens

## 4) DynamoDB -> Aurora selective inventory sync

Only selected SKUs should sync:
- Keep include list in `inventory_source_mapping.include_in_sync = true`
- Sync job reads only included rows
- Upsert available qty into `inventory_items`
- Log every run into `inventory_sync_runs`

Suggested sync pattern:
- Initial manual backfill for selected SKUs
- Scheduled incremental sync every 2-5 min
- On failure mark `sync_status='error'` and store reason in `sync_error`

## 5) Will future updates be safe?

Yes, if you follow migrations:
- Never edit old migration file after production
- Add new SQL migration files like:
  - `database/002_add_coupon_tables.sql`
  - `database/003_add_reviews.sql`
- Run in order on staging -> production

This approach works cleanly with PostgreSQL/Aurora and scales well.
