import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FOUNDER_EMAIL = process.env.FOUNDER_EMAIL || process.env.FOUNDER_EMAIL || 'founder@example.com';
const FOUNDER_PASSWORD = process.env.FOUNDER_PASSWORD || 'little';
const FOUNDER_NAME = process.env.FOUNDER_NAME || 'Founder';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  console.error('Set SUPABASE_SERVICE_ROLE_KEY in your environment before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false },
});

async function run() {
  try {
    console.log('Creating founder user via Supabase Admin API...');

    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: FOUNDER_EMAIL,
      password: FOUNDER_PASSWORD,
      email_confirm: true,
      user_metadata: { name: FOUNDER_NAME }
    });

    if (createError) throw createError;

    const userId = createData?.user?.id || createData?.id;
    if (!userId) {
      console.error('Could not determine created user id:', createData);
      process.exit(1);
    }

    console.log('Created auth user id:', userId);

    // Insert profile row
    const profile = {
      id: userId,
      name: FOUNDER_NAME,
      email: FOUNDER_EMAIL,
      role: 'founder',
      is_active: true,
      is_higher_authority: true
    };

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert(profile, { returning: 'representation' });

    if (profileError) throw profileError;

    console.log('Inserted/updated profile:', profileData);
    console.log('Bootstrap founder complete. Please change the bootstrap password on first login.');
  } catch (err) {
    console.error('Error during bootstrap:', err.message || err);
    process.exit(1);
  }
}

run();
