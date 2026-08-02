import { GOALS, STAGES, goalShort } from '@/lib/taxonomy';
import type { GoalId, Stage } from '@/lib/types';

const GOAL_ID_SET = new Set<string>(GOALS.map((goal) => goal.id));
/** Narrows a raw string to `GoalId` without an unsafe cast. */
function isGoalId(value: string): value is GoalId {
  return GOAL_ID_SET.has(value);
}

const STAGE_SET = new Set<string>(STAGES);
/** Narrows a raw string to `Stage` without an unsafe cast. */
function isStage(value: string): value is Stage {
  return STAGE_SET.has(value);
}

export interface InterviewQuestion {
  id: string;
  prompt: string;
  helper: string;
  placeholder: string;
  /** Tappable phrases so answering stays fast without a keyboard marathon. */
  chips: string[];
}

/**
 * The MeetBeat interview. Typed rather than spoken: every answer runs through
 * the same extraction pass, so the structured signals are identical either way.
 */
export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'background',
    prompt: 'What have you actually built or run?',
    helper: 'Roles, systems, teams, numbers. Specifics extract better than adjectives.',
    placeholder: 'e.g. I led backend and infrastructure at a fintech, then ran a 12-person team…',
    chips: [
      'I write backend and infrastructure code',
      'I led product management for a SaaS team',
      'I do machine learning day to day',
      'I run operations and hiring',
      'I design products end to end',
      'I sell to enterprise buyers',
    ],
  },
  {
    id: 'idea',
    prompt: 'What are you building, or want to build?',
    helper: 'One or two lines. Include the industry and how far along you are.',
    placeholder: 'e.g. A pre-seed climate tool for factories. We have a working prototype…',
    chips: [
      'A developer tool for platform teams',
      'A fintech product for small businesses',
      'A climate product for industrial customers',
      'A health tech product for clinicians',
      'Still an idea, no code yet',
      'We have a prototype with early users',
      'We are at seed stage with revenue',
    ],
  },
  {
    id: 'seeking',
    prompt: 'What would make this event worth it?',
    helper: 'Be greedy. MeetBeat ranks the room around this.',
    placeholder: 'e.g. A technical co-founder, and two investors who understand hardware…',
    chips: [
      'I need a co-founder',
      'I am raising funding',
      'I want early adopters and customers',
      'I want a mentor',
      'I am hiring',
      'I am looking for a new role',
      'I want collaborators',
    ],
  },
  {
    id: 'offer',
    prompt: 'What can you help someone else with tonight?',
    helper: 'The reason people will want to meet you back.',
    placeholder: 'e.g. I can review your infrastructure, and I know most seed funds in Berlin…',
    chips: [
      'I can invest',
      'I can mentor someone',
      'I have open roles',
      'I am open to co-founding',
      'I am open to new roles',
      'I can share hard lessons from my own build',
      'I am open to collaborating',
    ],
  },
  {
    id: 'human',
    prompt: 'What is something you can talk about for 30 minutes without preparation?',
    helper:
      'The subject you never run out of. This is what turns a match into a real conversation.',
    placeholder: 'e.g. Marathon pacing strategy, chess openings, and why espresso ratios matter…',
    chips: [
      'Long-distance running',
      'Chess',
      'Open source',
      'Live music',
      'Cooking',
      'Cycling',
      'Bouldering',
      'Photography',
      'Coffee',
      'Sci-fi',
    ],
  },
];

export type SignalKind = 'skill' | 'industry' | 'goal' | 'interest' | 'stage';

export interface ExtractedSignal {
  kind: SignalKind;
  value: string;
  /** The phrase in the answer that triggered it — keeps extraction auditable. */
  evidence: string;
  questionId: string;
}

const SKILL_TRIGGERS: Record<string, string[]> = {
  'Machine learning': ['machine learning', 'ml ', 'deep learning', 'model', 'ai research', 'llm'],
  'Backend engineering': ['backend', 'back-end', 'api', 'server'],
  'Mobile engineering': ['mobile', 'ios', 'android', 'react native', 'app store'],
  'Frontend engineering': ['frontend', 'front-end', 'react', 'web ui'],
  'Data engineering': ['data engineering', 'data pipeline', 'warehouse', 'etl', 'analytics'],
  Infrastructure: ['infrastructure', 'infra', 'devops', 'kubernetes', 'platform team', 'platform'],
  Security: ['security', 'appsec', 'compliance review', 'pentest'],
  Hardware: ['hardware', 'device', 'manufactur', 'robot', 'mechanical'],
  'Product design': ['product design', 'ux', 'design products', 'figma', 'interface'],
  'Brand design': ['brand', 'identity design', 'visual design'],
  'Product management': ['product management', 'product manager', 'roadmap', 'led product'],
  'Growth marketing': ['growth', 'acquisition', 'marketing', 'paid ads', 'seo'],
  Content: ['content', 'newsletter', 'writing', 'editorial'],
  'Enterprise sales': ['enterprise sales', 'sell to enterprise', 'sales', 'b2b sales', 'closing'],
  'Community building': ['community', 'meetup', 'discord', 'ambassador'],
  Fundraising: ['fundraising', 'raised a round', 'term sheet', 'investor relations'],
  Finance: ['finance', 'cfo', 'accounting', 'treasury', 'unit economics'],
  'Legal & compliance': ['legal', 'compliance', 'regulat', 'licen'],
  Operations: ['operations', 'ops', 'coo', 'process'],
  Recruiting: ['recruit', 'hiring pipeline', 'talent', 'people team'],
  'Clinical research': ['clinical', 'patient', 'trial', 'physician', 'clinician'],
  'Supply chain': ['supply chain', 'sourcing', 'logistics ops', 'procurement', 'factory'],
};

const INDUSTRY_TRIGGERS: Record<string, string[]> = {
  'AI infrastructure': ['ai infra', 'inference', 'gpu', 'model serving', 'ai platform', 'llm'],
  'Developer tools': ['developer tool', 'devtool', 'dev tool', 'platform team', 'sdk', 'ci/cd'],
  Fintech: ['fintech', 'payment', 'banking', 'lending', 'ledger', 'financial'],
  'Health tech': ['health', 'clinic', 'medical', 'patient', 'care', 'diagnos'],
  Climate: ['climate', 'carbon', 'energy', 'grid', 'sustainab', 'emission'],
  Education: ['education', 'learning', 'teacher', 'student', 'course', 'edtech'],
  'Consumer social': ['consumer social', 'social app', 'consumer app', 'community app'],
  Marketplaces: ['marketplace', 'two-sided', 'supply and demand', 'gmv'],
  Robotics: ['robot', 'autonom', 'picking arm', 'drone'],
  Cybersecurity: ['cybersecurity', 'security product', 'threat', 'soc2'],
  Logistics: ['logistics', 'freight', 'shipping', 'warehouse', 'fleet'],
  'Creator economy': ['creator', 'influencer', 'monetis', 'monetiz', 'audience'],
  Gaming: ['gaming', 'game studio', 'players'],
  'Enterprise SaaS': ['enterprise saas', 'b2b saas', 'saas', 'enterprise software'],
};

const INTEREST_TRIGGERS: Record<string, string[]> = {
  'Long-distance running': ['running', 'marathon', 'half marathon', '10k'],
  Ultramarathons: ['ultra', 'ultramarathon', '100k'],
  'Open source': ['open source', 'oss', 'github maintainer'],
  Chess: ['chess'],
  'Live music': ['live music', 'concert', 'gig', 'band', 'dj'],
  Cooking: ['cooking', 'cook', 'baking', 'food'],
  'Sci-fi': ['sci-fi', 'science fiction', 'scifi'],
  Cycling: ['cycling', 'bike', 'gravel'],
  Photography: ['photography', 'photo', 'camera'],
  'Board games': ['board game', 'catan', 'tabletop'],
  Surfing: ['surf'],
  Writing: ['writing', 'write', 'blog', 'essay'],
  Bouldering: ['bouldering', 'climbing'],
  Coffee: ['coffee', 'espresso', 'filter brew'],
  'Language learning': ['language learning', 'learning german', 'duolingo', 'languages'],
  Woodworking: ['woodwork', 'carpentry', 'workshop'],
};

const GOAL_TRIGGERS: Record<GoalId, string[]> = {
  cofounder: ['co-founder', 'cofounder', 'co founder', 'someone to build with', 'founding partner'],
  funding: [
    'raising',
    'raise funding',
    'fundrais',
    'looking for investment',
    'seed round',
    'pre-seed round',
  ],
  invest: [
    'i can invest',
    'i invest',
    'write cheques',
    'write checks',
    'angel invest',
    'deploy capital',
  ],
  mentor: [
    'want a mentor',
    'need a mentor',
    'looking for a mentor',
    'want guidance',
    'need advice',
  ],
  mentee: ['can mentor', 'mentor someone', 'happy to mentor', 'coach someone', 'advise founders'],
  customers: ['early adopter', 'customers', 'design partner', 'pilot', 'buyers', 'users to test'],
  collaborate: ['collaborat', 'partner with', 'build together', 'work together'],
  hiring: ['hiring', 'open roles', 'need to hire', 'growing the team', 'recruiting for'],
  job: [
    'new role',
    'looking for a job',
    'looking for a role',
    'open to roles',
    'open to work',
    'find a job',
  ],
  learn: ['learn', 'understand better', 'get up to speed', 'curious about'],
};

const STAGE_TRIGGERS: Record<Stage, string[]> = {
  idea: ['just an idea', 'still an idea', 'no code yet', 'pre-product', 'exploring an idea'],
  prototype: ['prototype', 'mvp', 'early users', 'alpha', 'beta'],
  'pre-seed': ['pre-seed', 'preseed'],
  seed: ['seed stage', 'at seed', 'seed round closed'],
  'series-a': ['series a'],
  growth: ['growth stage', 'series b', 'scaling', 'profitable'],
  none: ['not building', 'no startup', 'not a founder'],
};

function matchTriggers(text: string, triggers: string[]): string | null {
  const haystack = text.toLowerCase();
  for (const trigger of triggers) {
    const index = haystack.indexOf(trigger);
    if (index >= 0) {
      const start = Math.max(0, index - 18);
      const end = Math.min(haystack.length, index + trigger.length + 18);
      const snippet = text.slice(start, end).trim();
      return start > 0 ? `…${snippet}` : snippet;
    }
  }
  return null;
}

export interface ExtractionResult {
  signals: ExtractedSignal[];
  skills: string[];
  industries: string[];
  interests: string[];
  seeking: GoalId[];
  offering: GoalId[];
  stage: Stage | null;
}

/**
 * Turns free-text interview answers into structured signals with the evidence
 * that produced each one.
 */
export function extractSignals(answers: Record<string, string>): ExtractionResult {
  const found: ExtractedSignal[] = [];

  const scan = (
    questionId: string,
    text: string,
    kind: SignalKind,
    table: Record<string, string[]>,
  ) => {
    for (const [value, triggers] of Object.entries(table)) {
      const evidence = matchTriggers(text, triggers);
      if (evidence && !found.some((item) => item.kind === kind && item.value === value)) {
        found.push({ kind, value, evidence, questionId });
      }
    }
  };

  for (const question of INTERVIEW_QUESTIONS) {
    const text = answers[question.id]?.trim() ?? '';
    if (text.length === 0) continue;

    scan(question.id, text, 'skill', SKILL_TRIGGERS);
    scan(question.id, text, 'industry', INDUSTRY_TRIGGERS);
    scan(question.id, text, 'interest', INTEREST_TRIGGERS);
    scan(question.id, text, 'stage', STAGE_TRIGGERS);

    for (const { id: goal } of GOALS) {
      const evidence = matchTriggers(text, GOAL_TRIGGERS[goal]);
      if (!evidence) continue;
      // The "seeking" question produces wants; the "offer" question produces gives.
      const kindKey = question.id === 'offer' ? `offer:${goal}` : `seek:${goal}`;
      if (found.some((item) => item.kind === 'goal' && item.value === kindKey)) continue;
      found.push({ kind: 'goal', value: kindKey, evidence, questionId: question.id });
    }
  }

  const goalValues = found.filter((item) => item.kind === 'goal').map((item) => item.value);
  const stageSignal = found.find((item) => item.kind === 'stage');

  return {
    signals: found,
    skills: found.filter((item) => item.kind === 'skill').map((item) => item.value),
    industries: found.filter((item) => item.kind === 'industry').map((item) => item.value),
    interests: found.filter((item) => item.kind === 'interest').map((item) => item.value),
    seeking: goalValues
      .filter((value) => value.startsWith('seek:'))
      .map((value) => value.slice(5))
      .filter(isGoalId),
    offering: goalValues
      .filter((value) => value.startsWith('offer:'))
      .map((value) => value.slice(6))
      .filter(isGoalId),
    stage: stageSignal && isStage(stageSignal.value) ? stageSignal.value : null,
  };
}

/** Human label for an extracted signal chip. */
export function signalLabel(signal: ExtractedSignal): string {
  if (signal.kind !== 'goal') return signal.value;
  const [prefix, goal] = signal.value.split(':');
  const verb = prefix === 'offer' ? 'Offers' : 'Wants';
  return isGoalId(goal) ? `${verb}: ${goalShort(goal)}` : `${verb}: ${goal}`;
}
