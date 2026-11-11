/**
 * CyberCast - Demo User Provisioning Script
 * Provisions the 5 authoritative law enforcement demo accounts into Supabase Auth.
 *
 * Requirements:
 * - Uses Supabase Admin API via createClient with SUPABASE_SERVICE_ROLE_KEY
 * - Idempotent: Updates user metadata and credentials if user already exists
 * - Sets email_confirm: true (no confirmation emails needed)
 * - Sets user_metadata: { badgeId, name, role, persona }
 * - Uses @next/env to automatically load .env.local
 * - Gracefully exits with code 0 and instructions if SUPABASE_SERVICE_ROLE_KEY is missing
 */

import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local and .env
loadEnvConfig(process.cwd());

export interface DemoUserDefinition {
  email: string;
  password: string;
  badgeId: string;
  name: string;
  role: string;
  persona: string;
  phone?: string;
}

export const DEMO_USERS: DemoUserDefinition[] = [
  {
    email: 'i4c.dir01@cybercast.demo',
    password: 'CyberCast@I4C2024',
    badgeId: 'I4C-DIR-01',
    name: 'Dr. A. K. Saxena',
    role: 'i4c_central',
    persona: 'I4C Central Directorate',
    phone: '+91 11 2343 8000',
  },
  {
    email: 'state.nodal.rj@cybercast.demo',
    password: 'CyberCast@State2024',
    badgeId: 'RJ-SP-Z04',
    name: 'Supt. R. Sharma',
    role: 'state_nodal',
    persona: 'State Cyber Nodal',
    phone: '+91 141 274 0123',
  },
  {
    email: 'district.jpr@cybercast.demo',
    password: 'CyberCast@District2024',
    badgeId: 'JPR-CI-889',
    name: 'Insp. P. Verma',
    role: 'district_cyber',
    persona: 'District Cyber Cell',
    phone: '+91 141 220 4455',
  },
  {
    email: 'field.si.jpr@cybercast.demo',
    password: 'CyberCast@Field2024',
    badgeId: 'JPR-SI-412',
    name: 'SI K. Mehta',
    role: 'field_investigator',
    persona: 'Field Investigator',
    phone: '+91 98290 12345',
  },
  {
    email: 'bank.sbi.cfc@cybercast.demo',
    password: 'CyberCast@Bank2024',
    badgeId: 'SBI-CFC-91',
    name: 'M. Agarwal (SBI Fraud)',
    role: 'bank_fi',
    persona: 'Bank Fraud Investigator',
    phone: '+91 22 2274 0000',
  },
];

export async function provisionDemoUsers(): Promise<{
  created: number;
  updated: number;
  skipped: boolean;
}> {
  const supabaseUrl =
    (process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://xlbdypsxinbyqthszmvi.supabase.co').trim();

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const isPlaceholderKey =
    !serviceRoleKey ||
    serviceRoleKey.includes('your_service_role') ||
    serviceRoleKey.includes('placeholder') ||
    serviceRoleKey.startsWith('your_');

  if (isPlaceholderKey) {
    console.warn('\n================================================================================');
    console.warn('⚠️  [WARN] SUPABASE_SERVICE_ROLE_KEY is not configured or contains placeholder.');
    console.warn('--------------------------------------------------------------------------------');
    console.warn('To provision demo accounts into your Supabase project:');
    console.warn('  1. Open your Supabase Dashboard:');
    console.warn(`     https://supabase.com/dashboard/project/xlbdypsxinbyqthszmvi`);
    console.warn('  2. Go to Project Settings -> API');
    console.warn('  3. Reveal and copy the "service_role" secret key (keep confidential)');
    console.warn('  4. Set it in .env.local:');
    console.warn('     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
    console.warn('  5. Re-run: npm run create-demo-users');
    console.warn('--------------------------------------------------------------------------------');
    console.warn('Skipping demo user provisioning (exit code 0).\n');
    return { created: 0, updated: 0, skipped: true };
  }

  console.log('\n🔒 Initializing Supabase Admin client...');
  console.log(`   Target URL: ${supabaseUrl}`);

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`📋 Provisioning ${DEMO_USERS.length} Law Enforcement Demo Accounts...\n`);

  try {
    // Query existing users to support idempotent update/create
    const { data: listData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.warn(`⚠️  Unable to list users (${listError.message}). Attempting individual creation.`);
    }

    const existingUsers = listData?.users || [];
    const existingByEmail = new Map(
      existingUsers.map((u) => [u.email?.toLowerCase() ?? '', u])
    );

    let createdCount = 0;
    let updatedCount = 0;

    for (const user of DEMO_USERS) {
      const emailKey = user.email.toLowerCase();
      const existing = existingByEmail.get(emailKey);

      const userMetadata = {
        badgeId: user.badgeId,
        name: user.name,
        role: user.role,
        persona: user.persona,
      };

      if (existing) {
        // User already exists -> Update password, confirm email, update metadata
        const { error: updateError } =
          await supabaseAdmin.auth.admin.updateUserById(existing.id, {
            password: user.password,
            email_confirm: true,
            user_metadata: userMetadata,
          });

        if (updateError) {
          console.error(
            `❌ [UPDATE FAILED] ${user.email} (${user.badgeId}): ${updateError.message}`
          );
        } else {
          console.log(
            `🔄 [UPDATED] ${user.email.padEnd(32)} | Badge: ${user.badgeId.padEnd(12)} | Officer: ${user.name}`
          );
          updatedCount++;
        }
      } else {
        // User does not exist -> Create with confirmed email
        const { error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: userMetadata,
          });

        if (createError) {
          if (
            createError.message?.toLowerCase().includes('already') ||
            createError.status === 422
          ) {
            console.log(
              `ℹ️ [EXISTS]  ${user.email.padEnd(32)} | Badge: ${user.badgeId.padEnd(12)} | Already registered`
            );
            updatedCount++;
          } else {
            console.error(
              `❌ [CREATE FAILED] ${user.email} (${user.badgeId}): ${createError.message}`
            );
          }
        } else {
          console.log(
            `✅ [CREATED] ${user.email.padEnd(32)} | Badge: ${user.badgeId.padEnd(12)} | Officer: ${user.name}`
          );
          createdCount++;
        }
      }
    }

    console.log(
      '\n--------------------------------------------------------------------------------'
    );
    console.log(
      `🎉 Demo Provisioning Complete: ${createdCount} created, ${updatedCount} updated/verified.`
    );
    console.log(
      '--------------------------------------------------------------------------------\n'
    );

    return { created: createdCount, updated: updatedCount, skipped: false };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Error during demo user provisioning:', message);
    return { created: 0, updated: 0, skipped: true };
  }
}

// Execute when run directly via CLI (tsx scripts/createDemoUsers.ts)
const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('createDemoUsers.ts') ||
    process.argv[1].endsWith('createDemoUsers.js') ||
    process.argv[1].includes('createDemoUsers')) &&
  !process.argv.includes('-e');

if (isDirectRun) {
  provisionDemoUsers().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Fatal error during provisioning:', message);
    process.exit(1);
  });
}
