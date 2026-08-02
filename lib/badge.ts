const BADGE_PREFIX = 'meetbeat:';

/** Value encoded into an attendee badge QR code. */
export function badgeValue(personId: string): string {
  return `${BADGE_PREFIX}${personId}`;
}

/** Returns the attendee id inside a scanned badge value, or null. */
export function parseBadge(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.toLowerCase().startsWith(BADGE_PREFIX)) return null;
  const id = trimmed.slice(BADGE_PREFIX.length);
  return id.length > 0 ? id : null;
}
