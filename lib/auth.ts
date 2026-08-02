import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type AuthStatus = 'signedOut' | 'signedIn';

/** Key used by earlier builds that persisted the session. Dropped on load. */
const LEGACY_SESSION_KEY = 'meetbeat.session';

void AsyncStorage.removeItem(LEGACY_SESSION_KEY).catch(() => undefined);

export interface LocalUser {
  id: string;
  email: string;
  /** Given at sign-up, used to pre-fill the onboarding identity step. */
  name?: string;
}

/**
 * MeetBeat runs its demo on a local session instead of a verified account.
 * Any email and password are accepted, nothing is emailed and nothing is
 * verified, so a judge demo never stalls on a code that cannot arrive.
 *
 * The session deliberately lives in memory only: every cold start (or web
 * reload) begins signed out, so the app always opens on the splash and launch
 * screens rather than resuming a previous run. The user id is still derived from
 * the email, so signing back in with the same address restores the same badge id.
 */
function hash32(input: string, seed: number): number {
  let hash = seed >>> 0;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

function hex8(value: number): string {
  return value.toString(16).padStart(8, '0');
}

/** Stable UUID-shaped id for an email, so QR badges and stores stay consistent. */
export function userIdForEmail(email: string): string {
  const key = email.trim().toLowerCase();
  const raw = [
    hex8(hash32(key, 0x811c9dc5)),
    hex8(hash32(key, 0x01000193)),
    hex8(hash32(`meetbeat:${key}`, 0x9e3779b9)),
    hex8(hash32(`${key}:meetbeat`, 0x85ebca6b)),
  ].join('');

  return [
    raw.slice(0, 8),
    raw.slice(8, 12),
    `4${raw.slice(13, 16)}`,
    `8${raw.slice(17, 20)}`,
    raw.slice(20, 32),
  ].join('-');
}

interface AuthState {
  status: AuthStatus;
  user: LocalUser | null;
  /**
   * Terms and data-protection acceptance. Required before any way into the app
   * (sign in, sign up or guest) and cleared on sign out, so a fresh run always
   * asks again — the session is memory-only for the same reason.
   */
  consented: boolean;
  setConsented: (value: boolean) => void;
  signIn: (email: string, name?: string) => LocalUser;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'signedOut',
  user: null,
  consented: false,
  setConsented: (value) => set({ consented: value }),
  signIn: (email, name) => {
    const address = email.trim().toLowerCase();
    const given = name?.trim();
    const user: LocalUser = {
      id: userIdForEmail(address),
      email: address,
      ...(given && given.length > 0 ? { name: given } : {}),
    };
    set({ user, status: 'signedIn' });
    return user;
  },
  signOut: () => set({ user: null, status: 'signedOut', consented: false }),
}));

/** True when the user has ticked the terms / data-protection box. */
export function hasConsented(): boolean {
  return useAuthStore.getState().consented;
}

export function setConsented(value: boolean): void {
  useAuthStore.getState().setConsented(value);
}

export function useUserId(): string | null {
  return useAuthStore((state) => state.user?.id ?? null);
}

/** Signs the given address in immediately. No password check, by design. */
export function signIn(email: string, name?: string): LocalUser {
  return useAuthStore.getState().signIn(email, name);
}

export function signOut(): void {
  useAuthStore.getState().signOut();
}
