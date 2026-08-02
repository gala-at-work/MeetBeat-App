import { COMPONENT_IDS, EMPTY_FOCUS, type RankingFocus } from '@/lib/matching';
import type { ComponentId, GoalId, Person } from '@/lib/types';

export interface EventQuestionOption {
  id: string;
  label: string;
  focus: {
    industries?: string[];
    goals?: GoalId[];
    weightMultipliers?: Partial<Record<ComponentId, number>>;
  };
}

export interface EventQuestion {
  id: string;
  prompt: string;
  /** Derived from the real cohort, so the question feels event-specific. */
  context: string;
  /** Which matching signal the answer improves. */
  reason?: string;
  options: EventQuestionOption[];
}

function countBy<T extends string>(values: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function topIndustries(cohort: Person[], count: number): string[] {
  const counts = countBy(cohort.flatMap((person) => person.signals.industries));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, count)
    .map(([industry]) => industry);
}

/**
 * Builds the follow-up questions MeetBeat asks after check-in. Every number in
 * the prompts is computed from the actual attendee list.
 */
export function buildEventQuestions(cohort: Person[]): EventQuestion[] {
  const investors = cohort.filter((person) => person.signals.offering.includes('invest')).length;
  const raising = cohort.filter((person) => person.signals.seeking.includes('funding')).length;
  const openToCofound = cohort.filter((person) =>
    person.signals.offering.includes('cofounder'),
  ).length;
  const hiring = cohort.filter((person) => person.signals.seeking.includes('hiring')).length;
  const openToRoles = cohort.filter((person) => person.signals.offering.includes('job')).length;
  const clusters = topIndustries(cohort, 3);

  return [
    {
      id: 'capital-or-build',
      prompt: 'What would make tonight a win?',
      context: `${investors} people here can write cheques, ${openToCofound} are open to co-founding, and ${raising} are actively raising.`,
      reason: 'Sets which goal MeetBeat weights hardest when ranking the room.',
      options: [
        {
          id: 'capital',
          label: 'Capital and investor conversations',
          focus: { goals: ['invest'], weightMultipliers: { goals: 1.35, stage: 1.3 } },
        },
        {
          id: 'build',
          label: 'Someone to build with',
          focus: { goals: ['cofounder', 'collaborate'], weightMultipliers: { skills: 1.5 } },
        },
        {
          id: 'customers',
          label: 'People who might actually buy',
          focus: { goals: ['customers', 'learn'], weightMultipliers: { industry: 1.5 } },
        },
      ],
    },
    {
      id: 'cluster',
      prompt: 'Which cluster is your lane tonight?',
      context: `The three biggest clusters in this room are ${clusters.join(', ')}.`,
      reason: 'Narrows shared-industry scoring to the cluster you actually care about.',
      options: clusters.map((industry) => ({
        id: industry,
        label: industry,
        focus: { industries: [industry], weightMultipliers: { industry: 1.4 } },
      })),
    },
    {
      id: 'mirror-or-complete',
      prompt: 'Do you want people who mirror you, or people who complete you?',
      context: `${hiring} attendees are hiring and ${openToRoles} are open to new roles — the room has both sides.`,
      reason: 'Decides whether complementary skills or shared ground carries more weight.',
      options: [
        {
          id: 'mirror',
          label: 'Mirror me — same problems, same lane',
          focus: { weightMultipliers: { industry: 1.5, interests: 1.6, skills: 0.6 } },
        },
        {
          id: 'complete',
          label: 'Complete me — fill the gaps I have',
          focus: { weightMultipliers: { skills: 1.7, goals: 1.25, interests: 0.6 } },
        },
      ],
    },
  ];
}

/** Folds the selected answers into a single ranking focus. */
export function focusFromAnswers(
  questions: EventQuestion[],
  answers: Record<string, string>,
): RankingFocus {
  const industries = new Set<string>();
  const goals = new Set<GoalId>();
  const multipliers: Partial<Record<ComponentId, number>> = {};

  for (const question of questions) {
    const answerId = answers[question.id];
    if (!answerId) continue;
    const option = question.options.find((candidate) => candidate.id === answerId);
    if (!option) continue;

    for (const industry of option.focus.industries ?? []) industries.add(industry);
    for (const goal of option.focus.goals ?? []) goals.add(goal);
    for (const id of COMPONENT_IDS) {
      const value = option.focus.weightMultipliers?.[id];
      if (value === undefined) continue;
      multipliers[id] = (multipliers[id] ?? 1) * value;
    }
  }

  if (industries.size === 0 && goals.size === 0 && Object.keys(multipliers).length === 0) {
    return EMPTY_FOCUS;
  }

  return {
    industries: [...industries],
    goals: [...goals],
    weightMultipliers: multipliers,
  };
}
