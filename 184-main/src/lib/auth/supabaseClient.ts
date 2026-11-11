import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://xlbdypsxinbyqthszmvi.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYmR5cHN4aW5ieXF0aHN6bXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNTksImV4cCI6MjEwNDM0MTA1OX0.W0vaJznsbAKAHIvr0d1yFaIP70rjVH8FKEPig1FP0gE';

const supabaseUrl = (
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
).trim();
const supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY
).trim();

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
