import type { GoalId, Role, Stage } from '@/lib/types';

export interface GoalMeta {
  id: GoalId;
  /** Phrased from the seeker's point of view. */
  seekLabel: string;
  /** Phrased from the giver's point of view. */
  giveLabel: string;
  short: string;
}

export const GOALS: GoalMeta[] = [
  {
    id: 'cofounder',
    seekLabel: 'Find a co-founder',
    giveLabel: 'Open to co-founding',
    short: 'Co-founder',
  },
  { id: 'funding', seekLabel: 'Raise funding', giveLabel: 'Fundraising now', short: 'Funding' },
  {
    id: 'invest',
    seekLabel: 'Find companies to back',
    giveLabel: 'Writes cheques',
    short: 'Investing',
  },
  {
    id: 'mentor',
    seekLabel: 'Find a mentor',
    giveLabel: 'Looking for guidance',
    short: 'Mentorship',
  },
  { id: 'mentee', seekLabel: 'Mentor someone', giveLabel: 'Offers mentorship', short: 'Mentoring' },
  {
    id: 'customers',
    seekLabel: 'Find early adopters',
    giveLabel: 'Selling to this room',
    short: 'Early adopters',
  },
  {
    id: 'collaborate',
    seekLabel: 'Find collaborators',
    giveLabel: 'Open to collaborating',
    short: 'Collaboration',
  },
  { id: 'hiring', seekLabel: 'Hire talent', giveLabel: 'Has open roles', short: 'Hiring' },
  { id: 'job', seekLabel: 'Find a role', giveLabel: 'Open to new roles', short: 'Job search' },
  {
    id: 'learn',
    seekLabel: 'Learn a new domain',
    giveLabel: 'Shares hard-won lessons',
    short: 'Learning',
  },
];

const GOAL_BY_ID = new Map(GOALS.map((goal) => [goal.id, goal]));

export function goalMeta(id: GoalId): GoalMeta {
  return GOAL_BY_ID.get(id) ?? { id, seekLabel: id, giveLabel: id, short: id };
}

export function goalShort(id: GoalId): string {
  return goalMeta(id).short;
}

/**
 * How well one person's `seeking` goal is served by another person's
 * `offering` goal. 1 means a textbook fit.
 */
export const GOAL_FIT: Record<GoalId, Partial<Record<GoalId, number>>> = {
  cofounder: { cofounder: 1, collaborate: 0.5, job: 0.35 },
  funding: { invest: 1, mentee: 0.35, collaborate: 0.2 },
  invest: { funding: 1, cofounder: 0.4 },
  mentor: { mentee: 1, invest: 0.4, collaborate: 0.2 },
  mentee: { mentor: 1, learn: 0.6, job: 0.3 },
  customers: { learn: 0.7, collaborate: 0.5, customers: 0.15, hiring: 0.3 },
  collaborate: { collaborate: 0.9, cofounder: 0.5, customers: 0.4 },
  hiring: { job: 1, learn: 0.3 },
  job: { hiring: 1, cofounder: 0.45, invest: 0.2 },
  learn: { mentee: 0.9, customers: 0.5, collaborate: 0.3 },
};

export const ROLE_LABEL: Record<Role, string> = {
  founder: 'Founder',
  investor: 'Investor',
  engineer: 'Engineer',
  designer: 'Designer',
  product: 'Product',
  growth: 'Growth',
  operator: 'Operator',
  researcher: 'Researcher',
  advisor: 'Advisor',
  student: 'Student',
};

/** Canonical role order, kept in sync with `ROLE_LABEL` without an unsafe cast. */
export const ROLES: Role[] = [
  'founder',
  'investor',
  'engineer',
  'designer',
  'product',
  'growth',
  'operator',
  'researcher',
  'advisor',
  'student',
];

export const STAGE_LABEL: Record<Stage, string> = {
  idea: 'Idea',
  prototype: 'Prototype',
  'pre-seed': 'Pre-seed',
  seed: 'Seed',
  'series-a': 'Series A',
  growth: 'Growth',
  none: 'Not building',
};

/** Canonical stage order, kept in sync with `STAGE_LABEL` without an unsafe cast. */
export const STAGES: Stage[] = [
  'idea',
  'prototype',
  'pre-seed',
  'seed',
  'series-a',
  'growth',
  'none',
];

const STAGE_ORDER: Stage[] = ['idea', 'prototype', 'pre-seed', 'seed', 'series-a', 'growth'];

/** 1 when stages are adjacent enough that advice and capital transfer well. */
export function stageAffinity(a: Stage, b: Stage): number {
  if (a === 'none' || b === 'none') return 0;
  const left = STAGE_ORDER.indexOf(a);
  const right = STAGE_ORDER.indexOf(b);
  if (left < 0 || right < 0) return 0;
  const distance = Math.abs(left - right);
  if (distance === 0) return 1;
  if (distance === 1) return 0.75;
  if (distance === 2) return 0.4;
  return 0.15;
}

export const SKILLS = [
  'Machine learning',
  'Backend engineering',
  'Mobile engineering',
  'Frontend engineering',
  'Data engineering',
  'Infrastructure',
  'Security',
  'Hardware',
  'Product design',
  'Brand design',
  'Product management',
  'Growth marketing',
  'Content',
  'Enterprise sales',
  'Community building',
  'Fundraising',
  'Finance',
  'Legal & compliance',
  'Operations',
  'Recruiting',
  'Clinical research',
  'Supply chain',
] as const;

export const INDUSTRIES = [
  'AI infrastructure',
  'Developer tools',
  'Fintech',
  'Health tech',
  'Climate',
  'Education',
  'Consumer social',
  'Marketplaces',
  'Robotics',
  'Cybersecurity',
  'Logistics',
  'Creator economy',
  'Gaming',
  'Enterprise SaaS',
] as const;

export const INTERESTS = [
  'Long-distance running',
  'Open source',
  'Chess',
  'Live music',
  'Cooking',
  'Sci-fi',
  'Cycling',
  'Photography',
  'Board games',
  'Surfing',
  'Writing',
  'Bouldering',
  'Coffee',
  'Language learning',
  'Ultramarathons',
  'Woodworking',
] as const;

export const CITIES = [
  'Berlin',
  'Lisbon',
  'London',
  'Amsterdam',
  'Paris',
  'New York',
  'San Francisco',
  'Bangalore',
  'Singapore',
  'Toronto',
] as const;
