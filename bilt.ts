import AsyncStorage from '@react-native-async-storage/async-storage';
import { asyncStorage, createClient } from '@biltme/backend';

/**
 * Bilt injects these values inside its hosted preview. A cloned repository does
 * not receive them automatically, so the app must be able to run without them.
 */
const biltUrl = process.env.EXPO_PUBLIC_BILT_URL?.trim();
const biltAnonKey = process.env.EXPO_PUBLIC_BILT_ANON_KEY?.trim();

/** True only when a real Bilt/Supabase backend has been configured. */
export const hasBiltConfig = Boolean(biltUrl && biltAnonKey);

/**
 * Keep a valid client object for typing, but local-demo code never calls it when
 * configuration is missing. This avoids the "supabaseUrl is required" crash.
 */
export const bilt = createClient(
  biltUrl || 'https://meetbeat-local-demo.supabase.co',
  biltAnonKey || 'meetbeat-local-demo-anon-key',
  {
    auth: {
      storage: asyncStorage(AsyncStorage),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);
