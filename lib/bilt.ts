import AsyncStorage from '@react-native-async-storage/async-storage';
import { asyncStorage, createClient } from '@biltme/backend';

/** Single shared backend client. Session lives in AsyncStorage on every platform. */
export const bilt = createClient(
  process.env.EXPO_PUBLIC_BILT_URL ?? '',
  process.env.EXPO_PUBLIC_BILT_ANON_KEY ?? '',
  {
    auth: {
      storage: asyncStorage(AsyncStorage),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);
