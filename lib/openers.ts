import { goalShort } from '@/lib/taxonomy';
import type { Match, Signals } from '@/lib/types';

export interface Opener {
  id: string;
  kind: string;
  text: string;
}

export interface OpenerContext {
  name: string;
  startupIdea: string;
  signals: Signals;
}

function firstName(full: string): string {
  return full.split(' ')[0] ?? full;
}

/** Turns a standalone sentence into a clause that can be embedded mid-sentence. */
function soften(sentence: string): string {
  const trimmed = sentence.trim().replace(/[.!]$/, '');
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

function shared(a: string[], b: string[]): string[] {
  const right = new Set(b);
  return a.filter((item) => right.has(item));
}

export function buildOpeners(me: OpenerContext, match: Match): Opener[] {
  const person = match.person;
  const first = firstName(person.name);
  const idea =
    me.startupIdea.trim().length > 0
      ? soften(me.startupIdea)
      : 'something early that I am still shaping';

  const sharedInterests = shared(me.signals.interests, person.signals.interests);
  const sharedIndustries = shared(me.signals.industries, person.signals.industries);
  const topGoal = me.signals.seeking[0];

  const direct: Opener = {
    id: 'direct',
    kind: 'Direct',
    text: `${first} — someone told me you ${person.hook}. I'm working on ${idea}, and ${soften(
      person.signals.give,
    )} is exactly the gap I'm in. Can I borrow ten minutes of that?`,
  };

  const warmText =
    sharedInterests.length > 0
      ? `${first}, before we get to work talk — you're into ${sharedInterests[0]?.toLowerCase()} too. I'll admit that's the reason I came over. What are you actually hoping to get out of tonight?`
      : sharedIndustries.length > 0
        ? `${first}, we're both stuck in ${sharedIndustries[0]?.toLowerCase()}. I'm curious what's breaking for you at ${person.company} right now — I've got my own version of that problem.`
        : `${first}, you're the first ${person.role} I've met tonight. I'm here mainly for ${
            topGoal ? goalShort(topGoal).toLowerCase() : 'good conversations'
          } — what brought you?`;

  const warm: Opener = { id: 'warm', kind: 'Common ground', text: warmText };

  const valueFirst: Opener = {
    id: 'value',
    kind: 'Value first',
    text: `${first}, you said you're after ${soften(person.signals.ask)}. I may be able to help there — ${soften(
      me.signals.give.length > 0 ? me.signals.give : 'happy to share what I have learned',
    )}. Want to swap notes before this room fills up?`,
  };

  return [direct, warm, valueFirst];
}

/**
 * Short, question-shaped ice-breakers for the chat dropdown. Every line ends in
 * a question so sending one hands the conversation over.
 */
export function buildIceBreakers(me: OpenerContext, match: Match): Opener[] {
  const person = match.person;
  const first = firstName(person.name);
  const sharedInterest = shared(me.signals.interests, person.signals.interests)[0];
  const sharedIndustry = shared(me.signals.industries, person.signals.industries)[0];
  const topGoal = me.signals.seeking[0];

  const items: Opener[] = [
    {
      id: 'ice-tonight',
      kind: 'Their goal',
      text: `${first}, what would make tonight worth it for you?`,
    },
    {
      id: 'ice-ask',
      kind: 'Their ask',
      text: `You are after ${soften(
        person.signals.ask,
      )} — what does the right version of that look like?`,
    },
    {
      id: 'ice-hook',
      kind: 'Their work',
      text: `I heard you ${person.hook}. How did that actually happen?`,
    },
  ];

  if (sharedInterest) {
    items.push({
      id: 'ice-interest',
      kind: 'Common ground',
      text: `We both listed ${sharedInterest.toLowerCase()}. How did you get into it?`,
    });
  }

  if (sharedIndustry) {
    items.push({
      id: 'ice-industry',
      kind: 'Same industry',
      text: `What is breaking for you in ${sharedIndustry.toLowerCase()} right now?`,
    });
  }

  items.push({
    id: 'ice-value',
    kind: 'Value first',
    text: `I can probably help with ${soften(
      me.signals.give.length > 0 ? me.signals.give : 'what I have learned so far',
    )}. Where would that be useful to you?`,
  });

  if (topGoal) {
    items.push({
      id: 'ice-goal',
      kind: 'Your goal',
      text: `I am here mainly for ${goalShort(
        topGoal,
      ).toLowerCase()}. Who else should I be talking to?`,
    });
  }

  return items;
}
