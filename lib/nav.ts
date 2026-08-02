import { router, type Href } from 'expo-router';

/**
 * Back that always goes somewhere.
 *
 * `router.back()` is a no-op when the current screen is the first entry in the
 * navigation history — a deep link, a reload in the web preview or a redirect
 * that replaced the stack all produce that state, which reads to the user as a
 * dead back button. Falling back to the parent route keeps it working.
 *
 * Returns true when a real pop was requested, false when the fallback was used.
 */
export function goBack(fallback: Href = '/'): boolean {
  try {
    if (router.canGoBack()) {
      router.back();
      return true;
    }
  } catch {
    // Navigation not mounted yet: fall through to the replace below.
  }
  router.replace(fallback);
  return false;
}

/**
 * Open an attendee profile.
 *
 * `navigate` rather than `push` on purpose. A double tap on a card, or opening
 * the same person again from a chat that was itself opened from their profile,
 * would push a second identical screen with `push` — back then looks broken,
 * because the screen underneath is the same profile. `navigate` pops to the
 * instance already in the stack and only pushes for a different person.
 */
export function openMatch(id: string): void {
  router.navigate({ pathname: '/match/[id]', params: { id } });
}

/** Profile, opened from a modal sheet: the sheet is dismissed on the way. */
export function openMatchFromModal(id: string): void {
  router.dismissTo({ pathname: '/match/[id]', params: { id } });
}

/** Chat thread, reusing the thread already in the stack when there is one. */
export function openChat(id: string): void {
  router.navigate({ pathname: '/chat/[id]', params: { id } });
}

/** Chat thread, opened from a modal sheet. */
export function openChatFromModal(id: string): void {
  router.dismissTo({ pathname: '/chat/[id]', params: { id } });
}
