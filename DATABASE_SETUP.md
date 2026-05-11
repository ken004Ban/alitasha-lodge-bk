# Alitasha Lodge — Database Setup Guide

## Overview

Alitasha Lodge uses **Supabase** (PostgreSQL) as its database backend. The system has 4 tables:

```
branches ──┬── rooms ──┬── bookings
            │           │
            └── visitor_logs
```

The backend Express server (`backend/src/server.js`) connects to Supabase using `@supabase/supabase-js` and auto-seeds demo data on every restart.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New project**.
3. Fill in:
   - **Name**: `alitasha-lodge`
   - **Database password**: (generate and save this somewhere — you'll need it for the connection string)
   - **Region**: pick one close to you (e.g. `South Africa (af-south-1)` if you're in Zambia)
4. Wait ~2 minutes for the project to provision.

---

## 2. Get Your API Credentials

After the project is created:

1. Go to **Project Settings** → **API** (in the left sidebar).
2. You'll see two items on this page:
   - **Project URL** — looks like `https://xxxxxxxxxxxxxxxxxxxx.supabase.co`
   - **`anon` public key** — starts with `eyJhbGciOiJ...`
   - **`service_role` key** — also starts with `eyJhbGciOiJ...` (keep this secret!)

3. Copy both values into `backend/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

> **Important**: The server needs the **`service_role`** key (not the `anon` key) to be able to insert/update/delete data during seeding. The anon key is for the frontend browser client and has restricted Row Level Security (RLS).

---

## 3. Run the Schema

The full schema is in `backend/schema.sql`. There are two ways to run it:

### Option A: Supabase SQL Editor (easiest)

1. In your Supabase dashboard, go to **SQL Editor**.
2. Open `backend/schema.sql` from this project and copy its contents.
3. Paste into the SQL Editor and click **Run**.
4. You should see each `CREATE TABLE` and `INSERT` execute successfully.

### Option B: `psql` CLI

If you have `psql` installed and the Supabase connection string:

```bash
psql "postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres" -f backend/schema.sql
```

You can find the connection string in **Project Settings** → **Database** → **Connection string**.

### Migration (if upgrading from an older version)

If you already ran the schema before and are upgrading, run the migration in `backend/migrations/001_visitor_logs_branch.sql` to add the `branch_id` column to `visitor_logs`:

```sql
ALTER TABLE visitor_logs
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_visitor_logs_branch_id ON visitor_logs (branch_id);
```

---

## 4. Schema Reference

### `branches`

| Column     | Type      | Description                |
|------------|-----------|----------------------------|
| `id`       | UUID (PK) | Auto-generated             |
| `name`     | TEXT      | Branch name (unique)       |
| `location` | TEXT      | City/region description    |
| `created_at` | TIMESTAMPTZ | Auto-set on insert       |

Demo branches seeded: **Kasama**, **Mansa**, **Mpika**.

### `rooms`

| Column            | Type      | Description                   |
|-------------------|-----------|-------------------------------|
| `id`              | UUID (PK) | Auto-generated                |
| `branch_id`       | UUID (FK) | References `branches.id`      |
| `room_type`       | TEXT      | e.g. "Deluxe Suite"           |
| `price_per_night` | DECIMAL   | Price in USD                  |
| `availability`    | BOOLEAN   | Default `true`                |
| `description`     | TEXT      | Short room description        |
| `created_at`      | TIMESTAMPTZ | Auto-set on insert          |

### `bookings`

| Column           | Type      | Description                        |
|------------------|-----------|------------------------------------|
| `id`             | UUID (PK) | Auto-generated                     |
| `branch_id`      | UUID (FK) | References `branches.id`           |
| `room_id`        | UUID (FK) | References `rooms.id` (SET NULL on delete) |
| `customer_name`  | TEXT      | Guest's full name                  |
| `customer_email` | TEXT      | Guest's email                      |
| `customer_phone` | TEXT      | Contact number                     |
| `check_in_date`  | DATE      | Arrival date                       |
| `check_out_date` | DATE      | Departure date                     |
| `status`         | TEXT      | `confirmed`, `pending`, or `cancelled` |
| `created_at`     | TIMESTAMPTZ | Auto-set on insert               |

### `visitor_logs`

| Column       | Type      | Description                        |
|--------------|-----------|------------------------------------|
| `id`         | UUID (PK) | Auto-generated                     |
| `page_path`  | TEXT      | e.g. `/booking`                    |
| `country`    | TEXT      | Visitor's country                  |
| `city`       | TEXT      | Visitor's city                     |
| `browser`    | TEXT      | User agent string                  |
| `device`     | TEXT      | `desktop`, `mobile`, or `tablet`   |
| `branch_id`  | UUID (FK) | References `branches.id` (nullable)|
| `timestamp`  | TIMESTAMPTZ | When the visit occurred          |

---

## 5. Row Level Security (RLS)

For demo/local use, the simplest setup is to **disable RLS** on all 4 tables:

1. In Supabase dashboard, go to **Authentication** → **Policies**.
2. For each table (`branches`, `rooms`, `bookings`, `visitor_logs`):
   - Click the table name
   - Toggle **Enable RLS** OFF

Alternatively, if you want RLS enabled, create permissive policies:

```sql
-- Allow full access for the service_role key
CREATE POLICY "service_role_all"
  ON branches FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Repeat for rooms, bookings, visitor_logs
```

The frontend uses the **anon key** for tracking (`/api/track`) — with RLS off, the anon key can insert into `visitor_logs`. If you enable RLS, you'll need an insert policy:

```sql
CREATE POLICY "anon_insert_visitor_logs"
  ON visitor_logs FOR INSERT
  TO anon
  WITH CHECK (true);
```

---

## 6. Auto-Seeding (What Happens on Server Start)

When the backend starts, `backend/src/server.js` calls `seedData()` which:

| Step | What it does | Condition |
|------|-------------|-----------|
| 1 | Deletes old branches (Kasama Main, Lusaka Branch, Ndola Branch) if they exist | Always runs |
| 2 | Creates **Kasama**, **Mansa**, **Mpika** branches | Only if no branches exist |
| 3 | Creates 3 room types per branch | Only if rooms table is empty for that branch |
| 4 | Generates **~180 visitor logs** with real country/city distribution | Only if fewer than 100 logs exist |
| 5 | Generates **~75 bookings** with 25 real Zambian customer names | Only if fewer than 50 bookings exist |

The seed is **idempotent** — re-running the server won't duplicate data. It checks counts before inserting.

---

## 7. Reset All Data (Factory Reset)

To wipe everything and start fresh, run these SQL commands in the Supabase SQL Editor:

```sql
-- Delete in correct order to respect foreign keys
DELETE FROM visitor_logs;
DELETE FROM bookings;
DELETE FROM rooms;
DELETE FROM branches;

-- Re-seed branches (the backend will re-seed everything on restart)
INSERT INTO branches (name, location) VALUES
('Kasama', 'Kasama, Zambia'),
('Mansa', 'Mansa, Zambia'),
('Mpika', 'Mpika, Zambia');
```

Then restart the backend:

```bash
cd backend && node src/server.js
```

The seed will fill in rooms, visitor logs, and bookings automatically.

---

## 8. Table Relationships Diagram

```
branches
  ├── id (PK)
  │
  ├── rooms
  │   ├── id (PK)
  │   ├── branch_id (FK → branches.id)  [CASCADE DELETE]
  │   │
  │   └── bookings
  │       ├── id (PK)
  │       ├── branch_id (FK → branches.id)  [CASCADE DELETE]
  │       ├── room_id (FK → rooms.id)       [SET NULL on delete]
  │       └── ...
  │
  └── visitor_logs
      ├── id (PK)
      ├── branch_id (FK → branches.id)  [SET NULL on delete]
      └── ...
```

---

## 9. Troubleshooting

### `"Could not load branches"` in the frontend

- Make sure the backend is running: `cd backend && node src/server.js`
- Verify the backend logs show: `🚀 Alitasha Backend running on port 5000`
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` are correct
- Confirm the API URL `http://localhost:5000` matches the frontend's axios calls

### `"relation 'branches' does not exist"` SQL error

The schema hasn't been run yet. Go to Supabase SQL Editor and run `backend/schema.sql`.

### Seed fails with `"permission denied"`

Your `.env` likely has the **anon key** instead of the **service_role key**.
- The service_role key has `"role": "service_role"` in its JWT payload (decode at https://jwt.io)
- The anon key has `"role": "anon"` — it cannot write to tables without RLS policies
- Regenerate the service_role key from **Project Settings** → **API** if you lost it

### Visitor tracking errors (500) in browser console

The visitor tracker silently stops after the first failure. Common causes:
- `visitor_logs` table doesn't exist — run `schema.sql`
- RLS blocks insert — disable RLS or add an insert policy (see section 5)
- Backend is not running — start it with `node backend/src/server.js`
