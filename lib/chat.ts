import { useEventStore } from '@/lib/store';
import type { Person } from '@/lib/types';

/** How long the other side "types" before answering. */
export const REPLY_DELAY_MS = 1600;

function messageId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1_000_000).toString(36)}`;
}

/** Turns a standalone sentence into a clause that can be embedded mid-sentence. */
function soften(sentence: string): string {
  const trimmed = sentence.trim().replace(/[.!]$/, '');
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

/** Appends one of my lines to the thread. Returns false when there is nothing to send. */
export function sendChatMessage(eventId: string, personId: string, text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;

  useEventStore.getState().appendMessage({
    id: messageId(),
    eventId,
    personId,
    from: 'me',
    text: trimmed,
    at: Date.now(),
  });
  return true;
}

export function receiveChatMessage(eventId: string, personId: string, text: string): void {
  useEventStore.getState().appendMessage({
    id: messageId(),
    eventId,
    personId,
    from: 'them',
    text,
    at: Date.now(),
  });
}

/**
 * What the other side answers on their `turn`-th reply. Built from their own
 * signals so the thread stays specific to the person rather than generic.
 */
export function replyFor(person: Person, turn: number): string {
  const lines = [
    `Good to hear from you. Tonight I am really after one thing: ${soften(person.signals.ask)}.`,
    `That fits what I can bring — ${soften(
      person.signals.give,
    )}. What would be most useful from me?`,
    `For context, I ${person.hook}, so I have opinions here. Happy to walk you through it.`,
    'Let us do this properly instead of typing. I am near the entrance for the next ten minutes.',
    'Noted. Send me two times that suit you and I will make one of them work.',
  ];

  return lines[Math.min(Math.max(turn, 0), lines.length - 1)] ?? lines[0];
}
