# Supabase schema & seed setup for Little Drops Old Age Home

Follow these steps to initialize the Supabase database schema and seed initial data.

1. Sign in to your Supabase project and open the SQL Editor.
2. Run the schema file at `supabase/schema.sql` to create tables, functions, triggers and RLS.
3. Run the seed script `supabase/seed.sql` to insert initial branches.
4. Create the Founder auth user via Supabase Auth. After creating the user, insert a corresponding
   `public.profiles` row referencing the `auth.users.id` and set `role = 'founder'`.

Example `profiles` insert (replace `<founder-uuid>` with the auth.users.id):

```sql
insert into public.profiles (id, name, email, role, is_active, is_higher_authority)
values ('<founder-uuid>', 'Founder', 'founder@example.com', 'founder', true, true);
```

5. Update your local `.env` file with the Supabase URL and publishable key. Don't commit `.env`.

6. Frontend: `npm run dev` will use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Security notes:
- Change the bootstrap password immediately after first login.
- Use secure server-side endpoints for user creation and sensitive operations.

If you want, I can also add SQL to create a bootstrap Founder user and instructions to run it.

Bootstrap Founder (script)

1. Set environment variables locally (do NOT commit service role key):

On Windows (PowerShell):

```powershell
setx SUPABASE_SERVICE_ROLE_KEY "<your-service-role-key>"
setx SUPABASE_URL "https://your-project.supabase.co"
setx FOUNDER_EMAIL "founder@example.com"
setx FOUNDER_PASSWORD "little"
```

Or place them in a local `.env` file and load them before running the script.

2. Run the bootstrap script (creates auth user + `profiles` row):

```bash
npm run supabase:bootstrap-founder
```

Notes:
- The script uses the Supabase Admin API and requires the Service Role key. Keep this secret.
- After bootstrap, sign in as the Founder and change the password immediately.