import { GOAL_FIT, goalShort, STAGE_LABEL, stageAffinity } from '@/lib/taxonomy';
import type { ComponentId, GoalId, Match, MatchReason, Person, Signals } from '@/lib/types';

/** Event answers translate into a ranking focus that reweights the score. */
export interface RankingFocus {
  industries: string[];
  goals: GoalId[];
  weightMultipliers: Partial<Record<ComponentId, number>>;
}

export const EMPTY_FOCUS: RankingFocus = {
  industries: [],
  goals: [],
  weightMultipliers: {},
};

const BASE_WEIGHTS: Record<ComponentId, number> = {
  goals: 30,
  skills: 18,
  industry: 15,
  interests: 13,
  stage: 12,
  location: 8,
  focus: 0,
};

/** Canonical component order, used to iterate `ComponentId` keys without an unsafe cast. */
export const COMPONENT_IDS: ComponentId[] = [
  'goals',
  'skills',
  'industry',
  'stage',
  'interests',
  'location',
  'focus',
];

export const COMPONENT_LABEL: Record<ComponentId, string> = {
  goals: 'Goal fit',
  skills: 'Complementary skills',
  industry: 'Shared industry',
  interests: 'Common ground',
  stage: 'Stage fit',
  location: 'Same city',
  focus: 'Your event focus',
};

function intersect(a: string[], b: string[]): string[] {
  const right = new Set(b);
  return a.filter((item) => right.has(item));
}

function difference(a: string[], b: string[]): string[] {
  const right = new Set(b);
  return a.filter((item) => !right.has(item));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function list(items: string[], max = 2): string {
  const shown = items.slice(0, max);
  if (shown.length === 0) return '';
  if (shown.length === 1) return shown[0];
  return `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`;
}

/** Best fit between one side's `seeking` and the other side's `offering`. */
function bestGoalFit(
  seeking: GoalId[],
  offering: GoalId[],
): { value: number; goal: GoalId | null } {
  let value = 0;
  let goal: GoalId | null = null;
  for (const want of seeking) {
    for (const gives of offering) {
      const fit = GOAL_FIT[want]?.[gives] ?? 0;
      if (fit > value) {
        value = fit;
        goal = want;
      }
    }
  }
  return { value, goal };
}

interface ComponentResult {
  value: number;
  detail: string;
}

function evaluate(
  mine: ScoringSide,
  theirs: ScoringSide,
  sameCity: boolean,
  focus: RankingFocus,
): { results: Record<ComponentId, ComponentResult>; reverseGoalFit: number } {
  const forward = bestGoalFit(mine.seeking, theirs.offering);
  const reverse = bestGoalFit(theirs.seeking, mine.offering);
  const goalValue = clamp01(forward.value * 0.72 + reverse.value * 0.28);

  const goalDetail = forward.goal
    ? reverse.value >= 0.6
      ? `They can help with ${goalShort(forward.goal).toLowerCase()}, and you can help with what they are after.`
      : `They can help with ${goalShort(forward.goal).toLowerCase()}.`
    : 'No direct overlap between what you want and what they offer.';

  const sharedSkills = intersect(mine.skills, theirs.skills);
  const newSkills = difference(theirs.skills, mine.skills);
  const skillValue = clamp01(newSkills.length * 0.26 + sharedSkills.length * 0.12);
  const skillDetail =
    newSkills.length > 0
      ? `They bring ${list(newSkills)} that you do not list.`
      : sharedSkills.length > 0
        ? `You both work in ${list(sharedSkills)}.`
        : 'Little skill overlap either way.';

  const sharedIndustries = intersect(mine.industries, theirs.industries);
  const industryDenominator = Math.max(
    1,
    Math.min(mine.industries.length, theirs.industries.length),
  );
  const industryValue = clamp01(sharedIndustries.length / industryDenominator);
  const industryDetail =
    sharedIndustries.length > 0
      ? `Both working in ${list(sharedIndustries)}.`
      : 'Different industries.';

  const sharedInterests = intersect(mine.interests, theirs.interests);
  const interestDenominator = Math.max(1, Math.min(mine.interests.length, theirs.interests.length));
  const interestValue = clamp01(sharedInterests.length / interestDenominator);
  const interestDetail =
    sharedInterests.length > 0
      ? `Easy opener: you both listed ${list(sharedInterests)}.`
      : 'No shared interests on file.';

  const neutralStage = mine.signals_stage_none || theirs.signals_stage_none;
  const stageValue = neutralStage ? 0.5 : stageAffinity(mine.stage, theirs.stage);
  const stageDetail = neutralStage
    ? 'They are not building, so stage is not a blocker.'
    : stageValue >= 0.75
      ? `Both around the ${STAGE_LABEL[theirs.stage].toLowerCase()} stage, so the advice transfers.`
      : `Different stages — you are at ${STAGE_LABEL[mine.stage].toLowerCase()}, they are at ${STAGE_LABEL[
          theirs.stage
        ].toLowerCase()}.`;

  const focusActive = focus.industries.length > 0 || focus.goals.length > 0;
  const focusIndustryHits = intersect(focus.industries, theirs.industries);
  const focusGoalHits = focus.goals.filter((goal) => theirs.offering.includes(goal));
  const focusValue = focusActive
    ? clamp01((focusIndustryHits.length > 0 ? 0.6 : 0) + (focusGoalHits.length > 0 ? 0.6 : 0))
    : 0;
  const focusHits = [...focusIndustryHits, ...focusGoalHits.map((goal) => goalShort(goal))];
  const focusDetail =
    focusHits.length > 0
      ? `Matches the focus you set for this event: ${list(focusHits)}.`
      : 'Outside the focus you set for this event.';

  return {
    reverseGoalFit: reverse.value,
    results: {
      goals: { value: goalValue, detail: goalDetail },
      skills: { value: skillValue, detail: skillDetail },
      industry: { value: industryValue, detail: industryDetail },
      interests: { value: interestValue, detail: interestDetail },
      stage: { value: stageValue, detail: stageDetail },
      location: {
        value: sameCity ? 1 : 0.2,
        detail: sameCity
          ? `Both based in ${theirs.locationLabel}, so a follow-up is easy.`
          : 'Different home cities — worth planning the follow-up.',
      },
      focus: { value: focusValue, detail: focusDetail },
    },
  };
}

/**
 * Local view of the signals plus the couple of person-level fields the scorer
 * needs. Keeps `evaluate` free of `Person` so both sides look symmetrical.
 */
interface ScoringSide extends Signals {
  signals_stage_none: boolean;
  locationLabel: string;
}

function toSide(signals: Signals, location: string): ScoringSide {
  return { ...signals, signals_stage_none: signals.stage === 'none', locationLabel: location };
}

export interface Scorable {
  signals: Signals;
  location: string;
}

export function scoreMatch(me: Scorable, them: Person, focus: RankingFocus = EMPTY_FOCUS): Match {
  const mine = toSide(me.signals, me.location);
  const theirs = toSide(them.signals, them.location);
  const sameCity = me.location === them.location;

  const { results, reverseGoalFit } = evaluate(mine, theirs, sameCity, focus);

  const focusActive = focus.industries.length > 0 || focus.goals.length > 0;
  const weights: Record<ComponentId, number> = { ...BASE_WEIGHTS };
  if (focusActive) weights.focus = 8;
  for (const id of COMPONENT_IDS) {
    const multiplier = focus.weightMultipliers[id];
    if (multiplier === undefined) continue;
    weights[id] = weights[id] * multiplier;
  }

  let weighted = 0;
  let total = 0;
  let focusBonus = 0;
  const reasons: MatchReason[] = [];

  for (const key of COMPONENT_IDS) {
    const weight = weights[key];
    if (weight <= 0) continue;
    const { value, detail } = results[key];

    // Event focus is a bonus, not a sixth of the score: answering the room
    // questions lifts the people who match that focus instead of pushing
    // everyone else down.
    if (key === 'focus') {
      focusBonus = value * weight;
    } else {
      weighted += value * weight;
      total += weight;
    }

    reasons.push({
      component: key,
      label: COMPONENT_LABEL[key],
      detail,
      contribution: Math.round(value * weight),
    });
  }

  const score = total > 0 ? Math.min(100, Math.round(((weighted + focusBonus) / total) * 100)) : 0;

  reasons.sort((a, b) => b.contribution - a.contribution);

  return {
    person: them,
    score,
    reasons,
    mutual: reverseGoalFit >= 0.6,
  };
}

export function rankRoom(
  me: Scorable,
  cohort: Person[],
  focus: RankingFocus = EMPTY_FOCUS,
): Match[] {
  const ranked = cohort.map((person) => scoreMatch(me, person, focus));
  ranked.sort((a, b) => b.score - a.score || a.person.name.localeCompare(b.person.name));
  return ranked;
}

/** Reasons that actually earned points, for the compact card view. */
export function topReasons(match: Match, count = 2): MatchReason[] {
  return match.reasons.filter((reason) => reason.contribution > 0).slice(0, count);
}
