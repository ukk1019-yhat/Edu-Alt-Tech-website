import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env');
  console.error('Get it from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const ADMIN_EMAIL = 'admin@edualttech.com';
const ADMIN_PASSWORD = 'Admin@123456';
const ADMIN_NAME = 'Platform Admin';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedAdmin() {
  console.log(`Creating admin: ${ADMIN_EMAIL}`);

  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) { console.error('List users failed:', listError.message); process.exit(1); }

  const existing = existingUsers.users.find(u => u.email === ADMIN_EMAIL);
  let userId: string;

  if (existing) {
    console.log('Admin already exists, updating password…');
    const { error } = await supabase.auth.admin.updateUserById(existing.id, { password: ADMIN_PASSWORD });
    if (error) { console.error('Update failed:', error.message); process.exit(1); }
    userId = existing.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: ADMIN_NAME, full_name: ADMIN_NAME },
    });
    if (error) { console.error('Create failed:', error.message); process.exit(1); }
    userId = data.user.id;
    console.log('Admin created');
  }

  const { error: upsertError } = await supabase.from('users').upsert({
    id: userId,
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    role: 'admin',
    created_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (upsertError) { console.error('Upsert failed:', upsertError.message); process.exit(1); }

  console.log(`\n✓ Admin ready`);
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`\nAdd to .env:\n  SUPABASE_SERVICE_ROLE_KEY=<your_key>`);
}

seedAdmin();
