# Little Drops Old Age Home Management Website

Centralized branch and elder life-cycle management system built with React + TypeScript + Supabase.

## What this solves

- Single master elder record across all branches
- Current branch tracking (elder appears in only one active branch)
- Permanent transfer history
- Admission branch/date preserved permanently
- Death recording with branch/date history
- Branch dashboards with live auto-calculated counts
- Founder/Trustee/Staff role-based access

## Tech stack

- Frontend: React, TypeScript, Vite, Tailwind, shadcn/ui
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Deployment: Vercel

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` with Supabase credentials:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Apply DB schema in Supabase SQL editor:

- [supabase/schema.sql](supabase/schema.sql)

4. Run locally:

```bash
npm run dev
```

5. Production build:

```bash
npm run build
```

## Authentication and users

- No public signup.
- Only Founder should create users.
- Passwords are managed only in Supabase Auth, never in custom tables.
- `profiles` table stores role and metadata.

## Role permissions

- Founder: full access including user management
- Trustee: read-only branch/elder/report views
- Staff: elder operations (add, edit, transfer, record death)

## Core lifecycle rules enforced

- One elder master profile (`elders`)
- Transfers are append-only records (`transfers`)
- Deaths are permanent records (`deaths`)
- Active branch list is derived from `elders.current_branch_id` and `elders.status = 'active'`
- Branch statistics are query-derived, not manually entered

## Current routes

- `/login`
- `/dashboard`
- `/branches`
- `/branches/:id`
- `/elders`
- `/elders/new`
- `/elders/:id`
- `/elders/:id/edit`
- `/transfers` (Founder, Staff)
- `/reports`
- `/audit`
- `/users` (Founder)

## Notes

- For secure Founder account creation, implement a Supabase Edge Function using service role key to create auth users and corresponding profile rows atomically.
- The UI already logs key actions into `audit_logs`.
