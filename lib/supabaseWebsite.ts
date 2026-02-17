
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_WEBSITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_WEBSITE_SUPABASE_ANON_KEY || '';

// This client is intentionally anonymous-only (no auth persistence needed).
// It reads public data from the website's Supabase project (devis_auto table).
export const supabaseWebsite = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
