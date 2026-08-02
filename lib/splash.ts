/**
 * The splash plays once per app launch, ahead of a new sign-in. Kept in a module
 * flag rather than persisted storage: it should reappear on a cold start but not
 * every time the signed-out guard bounces someone back to the launch screen.
 */
let consumed = false;

export function splashPending(): boolean {
  return !consumed;
}

export function consumeSplash(): void {
  consumed = true;
}
