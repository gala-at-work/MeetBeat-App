import { signIn } from '@/lib/auth';
import { useLanguageStore } from '@/lib/i18n';
import { useProfileStore } from '@/lib/store';
import { pushProfile } from '@/lib/sync';
import type { UserProfile } from '@/lib/types';

export const DEMO_ACCOUNTS = {
  attendee: 'demo+aarav@meetbeat.local',
  organizer: 'demo+organizer@meetbeat.local',
} as const;

/**
 * The primary demo attendee. Signing in as guest lands on a fully formed
 * profile so the judge demo can start at the room instead of at onboarding,
 * while every screen downstream still reads normal profile state.
 */
const DEMO_INTERVIEW_ANSWERS: Record<string, string> = {
  background:
    'I write backend and infrastructure code. I led platform and payments engineering at a fintech, then ran a small ML team building model serving.',
  idea: 'A developer tool for platform teams plus an AI networking product for live events. We have a prototype with early users.',
  seeking:
    'I need a co-founder who is strong on product, and I am raising a pre-seed round. I also want early adopters who run real events.',
  offer:
    'I am open to co-founding, I can share hard lessons from my own build, and I can review your infrastructure or model serving setup.',
  human: 'Long-distance running, chess, open source and far too much coffee.',
};

export function demoProfile(userId: string): UserProfile {
  return {
    id: userId,
    name: 'Aarav Shah',
    headline: 'Backend and AI engineer building event intelligence',
    role: 'engineer',
    company: 'Independent',
    location: 'Bangalore',
    startupIdea: 'An AI networking copilot that ranks the room at live events.',
    signals: {
      seeking: ['cofounder', 'funding', 'customers'],
      offering: ['cofounder', 'collaborate', 'learn'],
      skills: ['Backend engineering', 'Machine learning', 'Infrastructure', 'Product management'],
      industries: ['AI infrastructure', 'Developer tools', 'Fintech'],
      interests: ['Long-distance running', 'Chess', 'Open source', 'Coffee'],
      stage: 'prototype',
      ask: 'A product-minded co-founder and investors who understand AI tooling.',
      give: 'Backend and AI prototyping, plus payments domain knowledge.',
    },
    interviewAnswers: DEMO_INTERVIEW_ANSWERS,
    linkedinImported: true,
    onboardedAt: Date.now(),
  };
}

/**
 * Fills the demo profile in only when this device holds nothing for the demo
 * account, so a guest who edits their signals keeps those edits.
 */
export function ensureDemoProfile(userId: string): void {
  const existing = useProfileStore.getState().profile;
  if (existing && existing.id === userId) return;

  const profile = demoProfile(userId);
  useProfileStore.getState().saveProfile(profile);
  pushProfile(userId, profile, useLanguageStore.getState().language);
}

/**
 * Guest entry point. Opens the seeded demo attendee straight away: no account,
 * no password, no email round trip.
 */
export function signInAsDemo(): void {
  const user = signIn(DEMO_ACCOUNTS.attendee);
  ensureDemoProfile(user.id);
}
