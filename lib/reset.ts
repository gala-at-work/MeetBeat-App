import { signOut } from '@/lib/auth';
import { useEventStore, useProfileStore } from '@/lib/store';

/**
 * Wipes everything this device remembers: the local session, the profile, the
 * room check-ins and the connections, including what was written to storage.
 * The signed-out state sends the app back to the launch screen on its own.
 * The session itself is memory-only, so signing out is all it takes there.
 */
export function resetAppData(): void {
  useProfileStore.getState().resetProfile();
  useEventStore.getState().resetEvent();
  signOut();

  useProfileStore.persist.clearStorage();
  useEventStore.persist.clearStorage();
}
