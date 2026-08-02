/** Core MeetBeat domain types. */

export type GoalId =
  | 'cofounder'
  | 'funding'
  | 'invest'
  | 'mentor'
  | 'mentee'
  | 'customers'
  | 'collaborate'
  | 'hiring'
  | 'job'
  | 'learn';

export type Role =
  | 'founder'
  | 'investor'
  | 'engineer'
  | 'designer'
  | 'product'
  | 'growth'
  | 'operator'
  | 'researcher'
  | 'advisor'
  | 'student';

export type Stage = 'idea' | 'prototype' | 'pre-seed' | 'seed' | 'series-a' | 'growth' | 'none';

/** Structured networking signals — the unit MeetBeat actually matches on. */
export interface Signals {
  /** What this person wants out of the room. */
  seeking: GoalId[];
  /** What this person can give to the room. */
  offering: GoalId[];
  skills: string[];
  industries: string[];
  interests: string[];
  stage: Stage;
  /** One line ask, shown verbatim in match detail. */
  ask: string;
  /** One line offer, shown verbatim in match detail. */
  give: string;
}

export interface Person {
  id: string;
  name: string;
  headline: string;
  role: Role;
  company: string;
  location: string;
  bio: string;
  /** Concrete hook used to build conversation starters. */
  hook: string;
  signals: Signals;
}

export interface UserProfile {
  id: string;
  name: string;
  headline: string;
  role: Role;
  company: string;
  location: string;
  startupIdea: string;
  signals: Signals;
  /** Free-text interview answers, kept so the extraction trail stays visible. */
  interviewAnswers: Record<string, string>;
  linkedinImported: boolean;
  onboardedAt: number | null;
}

export interface EventInfo {
  id: string;
  name: string;
  tagline: string;
  venue: string;
  city: string;
  dateLabel: string;
  /** Six-character code attendees type to join the room. */
  joinCode: string;
  /** Industry focus of the room; empty means the whole demo cohort. */
  cohortIndustries: string[];
  cohortSize: number;
  isDemo: boolean;
  createdBy: string | null;
}

export type ComponentId =
  | 'goals'
  | 'skills'
  | 'industry'
  | 'stage'
  | 'interests'
  | 'location'
  | 'focus';

export interface MatchReason {
  component: ComponentId;
  label: string;
  detail: string;
  /** Points this reason contributed to the final opportunity score. */
  contribution: number;
}

export interface Match {
  person: Person;
  score: number;
  reasons: MatchReason[];
  /** True when both sides can serve each other's stated goal. */
  mutual: boolean;
}

export interface Connection {
  eventId: string;
  personId: string;
  personName: string;
  score: number;
  method: 'qr' | 'simulated';
  note: string;
  connectedAt: number;
}

/** One line in a thread with an attendee. Threads live on this device. */
export interface ChatMessage {
  id: string;
  eventId: string;
  personId: string;
  from: 'me' | 'them';
  text: string;
  at: number;
}

/** Mutable shape used while building a profile during onboarding. */
export interface ProfileDraft {
  name: string;
  headline: string;
  company: string;
  role: Role;
  location: string;
  answers: Record<string, string>;
  skills: string[];
  industries: string[];
  interests: string[];
  seeking: GoalId[];
  offering: GoalId[];
  stage: Stage;
  ask: string;
  give: string;
  linkedinImported: boolean;
}
