import { useEffect, useMemo, useRef, useState } from 'react';

import { bilt, hasBiltConfig } from '@/lib/bilt';
import type { EventQuestion } from '@/lib/eventQuestions';
import { INTERVIEW_QUESTIONS } from '@/lib/extract';
import { buildOpeners, type Opener } from '@/lib/openers';
import {
  GOALS,
  goalMeta,
  INDUSTRIES,
  INTERESTS,
  ROLE_LABEL,
  SKILLS,
  STAGE_LABEL,
  STAGES,
} from '@/lib/taxonomy';
import type { GoalId, Match, Person, Stage, UserProfile } from '@/lib/types';

/**
 * Client for the `ai-generate` edge function.
 *
 * Every entry point returns a usable value even when OpenAI is unreachable: the
 * deterministic demo intelligence is computed first and the AI result replaces
 * it only once it arrives and validates. `source` tells the UI which one it is
 * looking at.
 */

export type AiSource = 'ai' | 'demo';

/** Enum vocabulary the model is allowed to answer with. */
const VOCAB = {
  skills: [...SKILLS],
  industries: [...INDUSTRIES],
  interests: [...INTERESTS],
  goals: GOALS.map((goal) => goal.id),
  stages: [...STAGES],
};

const SKILL_SET = new Set<string>(VOCAB.skills);
const INDUSTRY_SET = new Set<string>(VOCAB.industries);
const INTEREST_SET = new Set<string>(VOCAB.interests);
const GOAL_SET = new Set<string>(VOCAB.goals);
const STAGE_SET = new Set<string>(VOCAB.stages);

function isStage(value: string): value is Stage {
  return STAGE_SET.has(value);
}

/** Results are stable for a given input, so one call per key per session. */
const cache = new Map<string, unknown>();

async function callAi(action: string, payload: unknown, cacheKey?: string): Promise<unknown> {
  // The standalone demo intentionally uses deterministic local intelligence.
  if (!hasBiltConfig) return null;

  if (cacheKey) {
    const hit = cache.get(cacheKey);
    if (hit !== undefined) return hit;
  }

  try {
    const { data, error } = await bilt.functions.invoke('ai-generate', {
      body: { action, vocab: VOCAB, payload },
    });
    if (error) return null;

    const envelope = record(data);
    if (envelope.ok !== true || envelope.data === undefined) return null;

    if (cacheKey) cache.set(cacheKey, envelope.data);
    return envelope.data;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Narrowing                                                                   */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function record(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function list(value: unknown, allowed?: Set<string>): string[] {
  if (!Array.isArray(value)) return [];
  const items = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim());
  const filtered = allowed
    ? items.filter((item) => allowed.has(item))
    : items.filter((item) => item.length > 0);
  return [...new Set(filtered)];
}

function goals(value: unknown): GoalId[] {
  return list(value, GOAL_SET).filter((item): item is GoalId => GOAL_SET.has(item));
}

/* -------------------------------------------------------------------------- */
/* Compact payload summaries                                                   */
/* -------------------------------------------------------------------------- */

function profileSummary(profile: UserProfile) {
  return {
    name: profile.name,
    headline: profile.headline,
    role: ROLE_LABEL[profile.role],
    company: profile.company,
    city: profile.location,
    startupIdea: profile.startupIdea,
    stage: STAGE_LABEL[profile.signals.stage],
    wants: profile.signals.seeking.map((goal) => goalMeta(goal).seekLabel),
    gives: profile.signals.offering.map((goal) => goalMeta(goal).giveLabel),
    skills: profile.signals.skills,
    industries: profile.signals.industries,
    interests: profile.signals.interests,
    ask: profile.signals.ask,
    give: profile.signals.give,
  };
}

function personSummary(person: Person) {
  return {
    name: person.name,
    headline: person.headline,
    role: ROLE_LABEL[person.role],
    company: person.company,
    city: person.location,
    bio: person.bio,
    hook: person.hook,
    stage: STAGE_LABEL[person.signals.stage],
    wants: person.signals.seeking.map((goal) => goalMeta(goal).seekLabel),
    gives: person.signals.offering.map((goal) => goalMeta(goal).giveLabel),
    skills: person.signals.skills,
    industries: person.signals.industries,
    interests: person.signals.interests,
    ask: person.signals.ask,
    give: person.signals.give,
  };
}

/* -------------------------------------------------------------------------- */
/* 1. Profile extraction                                                       */
/* -------------------------------------------------------------------------- */

export interface AiExtraction {
  headline: string;
  ask: string;
  give: string;
  stage: Stage | null;
  seeking: GoalId[];
  offering: GoalId[];
  skills: string[];
  industries: string[];
  interests: string[];
}

/** Reads the interview answers with the model, on top of keyword extraction. */
export async function aiExtractProfile(
  answers: Record<string, string>,
): Promise<AiExtraction | null> {
  const transcript = INTERVIEW_QUESTIONS.map((question) => ({
    question: question.prompt,
    answer: (answers[question.id] ?? '').trim(),
  })).filter((entry) => entry.answer.length > 0);

  if (transcript.length === 0) return null;

  const raw = await callAi('extract_profile', { transcript });
  if (!raw) return null;

  const data = record(raw);
  const stage = text(data.stage);

  return {
    headline: text(data.headline),
    ask: text(data.ask),
    give: text(data.give),
    stage: isStage(stage) ? stage : null,
    seeking: goals(data.seeking),
    offering: goals(data.offering),
    skills: list(data.skills, SKILL_SET),
    industries: list(data.industries, INDUSTRY_SET),
    interests: list(data.interests, INTEREST_SET),
  };
}

/* -------------------------------------------------------------------------- */
/* 2. Networking DNA                                                           */
/* -------------------------------------------------------------------------- */

export interface NetworkingDna {
  archetype: string;
  summary: string;
  traits: string[];
  needs: string[];
  offers: string[];
  confidence: number;
}

/** Deterministic DNA, used before the model answers and whenever it cannot. */
export function fallbackDna(profile: UserProfile): NetworkingDna {
  const { signals } = profile;

  const archetype = signals.offering.includes('invest')
    ? 'Backer'
    : signals.offering.includes('mentee')
      ? 'Guide'
      : signals.seeking.includes('job')
        ? 'Seeker'
        : signals.seeking.includes('cofounder') || signals.seeking.includes('funding')
          ? 'Builder'
          : signals.offering.includes('collaborate')
            ? 'Collaborator'
            : 'Connector';

  const wants = signals.seeking.map((goal) => goalMeta(goal).seekLabel);
  const gives = signals.offering.map((goal) => goalMeta(goal).giveLabel);
  const domain = signals.industries[0] ?? signals.skills[0] ?? 'your field';

  const summary = [
    `You read as a ${archetype.toLowerCase()} working in ${domain.toLowerCase()} at ${STAGE_LABEL[signals.stage].toLowerCase()} stage.`,
    wants.length > 0
      ? `The room is useful to you when it contains people who can help you ${wants[0]?.toLowerCase() ?? 'move forward'}.`
      : 'Answer a few more questions so MeetBeat knows who is useful to you.',
  ].join(' ');

  const evidence =
    signals.skills.length +
    signals.industries.length +
    signals.interests.length +
    signals.seeking.length +
    signals.offering.length;

  return {
    archetype,
    summary,
    traits: [...signals.skills.slice(0, 3), ...signals.industries.slice(0, 2)],
    needs: wants.slice(0, 4),
    offers: gives.slice(0, 4),
    confidence: Math.min(1, evidence / 12),
  };
}

function parseDna(raw: unknown, fallback: NetworkingDna): NetworkingDna {
  const data = record(raw);
  const confidence = typeof data.confidence === 'number' ? data.confidence : fallback.confidence;
  const summary = text(data.summary);

  return {
    archetype: text(data.archetype) || fallback.archetype,
    summary: summary.length > 0 ? summary : fallback.summary,
    traits: list(data.traits).slice(0, 5),
    needs: list(data.needs).slice(0, 4),
    offers: list(data.offers).slice(0, 4),
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}

export interface AiResult<T> {
  value: T;
  source: AiSource;
  loading: boolean;
}

export function useNetworkingDna(profile: UserProfile | null): AiResult<NetworkingDna> | null {
  const fallback = useMemo(() => (profile ? fallbackDna(profile) : null), [profile]);
  const [state, setState] = useState<{ value: NetworkingDna; source: AiSource } | null>(null);
  const [loading, setLoading] = useState(false);

  const key = profile ? `dna:${profile.id}:${JSON.stringify(profile.signals)}` : null;

  useEffect(() => {
    if (!profile || !fallback || !key) return undefined;
    let cancelled = false;
    setLoading(true);

    void callAi('networking_dna', { profile: profileSummary(profile) }, key).then((raw) => {
      if (cancelled) return;
      setState(
        raw
          ? { value: parseDna(raw, fallback), source: 'ai' }
          : { value: fallback, source: 'demo' },
      );
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [profile, fallback, key]);

  if (!fallback) return null;
  return { value: state?.value ?? fallback, source: state?.source ?? 'demo', loading };
}

/* -------------------------------------------------------------------------- */
/* 3. Match explanation and openers                                            */
/* -------------------------------------------------------------------------- */

export interface MatchBrief {
  summary: string;
  potentialOutcome: string;
  unknowns: string[];
}

/** Names the likely outcome from the strongest goal overlap. */
function fallbackOutcome(profile: UserProfile, person: Person): string {
  const overlap = profile.signals.seeking.find((goal) => person.signals.offering.includes(goal));
  if (overlap) return `Possible ${goalMeta(overlap).short.toLowerCase()} conversation`;
  const reverse = person.signals.seeking.find((goal) => profile.signals.offering.includes(goal));
  if (reverse) return `You can help with ${goalMeta(reverse).short.toLowerCase()}`;
  return 'Worth a short conversation';
}

export function fallbackBrief(profile: UserProfile, match: Match): MatchBrief {
  const top = match.reasons.filter((reason) => reason.contribution > 0).slice(0, 2);
  const summary =
    top.length > 0
      ? top.map((reason) => reason.detail).join(' ')
      : 'A few details are still unknown, so treat this as an exploratory conversation.';

  return {
    summary,
    potentialOutcome: fallbackOutcome(profile, match.person),
    unknowns: match.mutual ? [] : ['Whether their timing matches yours.'],
  };
}

function parseBrief(raw: unknown, fallback: MatchBrief): MatchBrief {
  const data = record(raw);
  const summary = text(data.summary);
  const outcome = text(data.potentialOutcome);
  return {
    summary: summary.length > 0 ? summary : fallback.summary,
    potentialOutcome: outcome.length > 0 ? outcome : fallback.potentialOutcome,
    unknowns: list(data.unknowns).slice(0, 3),
  };
}

function parseOpeners(raw: unknown, fallback: Opener[]): Opener[] {
  const data = record(raw);
  if (!Array.isArray(data.openers)) return fallback;

  const parsed = data.openers
    .map((item, index) => {
      const entry = record(item);
      const body = text(entry.text);
      return { id: `ai-${index}`, kind: text(entry.kind) || 'Opener', text: body };
    })
    .filter((opener) => opener.text.length > 0);

  return parsed.length > 0 ? parsed : fallback;
}

export interface MatchIntelligence {
  brief: MatchBrief;
  openers: Opener[];
  source: AiSource;
  loading: boolean;
}

/** Match explanation plus openers, fetched together so the card fills in once. */
export function useMatchIntelligence(
  profile: UserProfile | null,
  match: Match | null,
): MatchIntelligence | null {
  const fallback = useMemo(
    () =>
      profile && match
        ? {
            brief: fallbackBrief(profile, match),
            openers: buildOpeners(
              { name: profile.name, startupIdea: profile.startupIdea, signals: profile.signals },
              match,
            ),
          }
        : null,
    [profile, match],
  );

  const [state, setState] = useState<{
    brief: MatchBrief;
    openers: Opener[];
    source: AiSource;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const key = profile && match ? `match:${profile.id}:${match.person.id}:${match.score}` : null;

  useEffect(() => {
    if (!profile || !match || !fallback || !key) return undefined;
    let cancelled = false;
    setLoading(true);
    setState(null);

    const payload = {
      you: profileSummary(profile),
      them: personSummary(match.person),
      score: match.score,
      scoredReasons: match.reasons
        .filter((reason) => reason.contribution > 0)
        .map((reason) => ({
          label: reason.label,
          detail: reason.detail,
          points: reason.contribution,
        })),
      mutual: match.mutual,
    };

    void Promise.all([
      callAi('match_explanation', payload, `${key}:brief`),
      callAi('openers', payload, `${key}:openers`),
    ]).then(([briefRaw, openersRaw]) => {
      if (cancelled) return;
      const gotAi = briefRaw !== null || openersRaw !== null;
      setState({
        brief: briefRaw ? parseBrief(briefRaw, fallback.brief) : fallback.brief,
        openers: openersRaw ? parseOpeners(openersRaw, fallback.openers) : fallback.openers,
        source: gotAi ? 'ai' : 'demo',
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [profile, match, fallback, key]);

  if (!fallback) return null;
  return {
    brief: state?.brief ?? fallback.brief,
    openers: state?.openers ?? fallback.openers,
    source: state?.source ?? 'demo',
    loading,
  };
}

/* -------------------------------------------------------------------------- */
/* 4. Event-specific question wording                                          */
/* -------------------------------------------------------------------------- */

export interface CohortStats {
  size: number;
  investors: number;
  raising: number;
  openToCofound: number;
  hiring: number;
  openToRoles: number;
  clusters: string[];
  roles: string[];
}

export function cohortStats(cohort: Person[]): CohortStats {
  const counts = new Map<string, number>();
  for (const person of cohort) {
    for (const industry of person.signals.industries) {
      counts.set(industry, (counts.get(industry) ?? 0) + 1);
    }
  }

  return {
    size: cohort.length,
    investors: cohort.filter((person) => person.signals.offering.includes('invest')).length,
    raising: cohort.filter((person) => person.signals.seeking.includes('funding')).length,
    openToCofound: cohort.filter((person) => person.signals.offering.includes('cofounder')).length,
    hiring: cohort.filter((person) => person.signals.seeking.includes('hiring')).length,
    openToRoles: cohort.filter((person) => person.signals.offering.includes('job')).length,
    clusters: [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 3)
      .map(([industry]) => industry),
    roles: [...new Set(cohort.map((person) => ROLE_LABEL[person.role]))],
  };
}

/**
 * Rewrites the cohort-derived check-in questions in the model's words while
 * keeping every id, option and ranking weight untouched — the scoring focus
 * still comes from the deterministic engine.
 */
export function useEventQuestionCopy(
  eventName: string,
  eventId: string,
  questions: EventQuestion[],
  cohort: Person[],
  profile: UserProfile | null,
): AiResult<EventQuestion[]> {
  const stats = useMemo(() => cohortStats(cohort), [cohort]);
  const [state, setState] = useState<{ value: EventQuestion[]; source: AiSource } | null>(null);
  const [loading, setLoading] = useState(false);
  const baseRef = useRef(questions);
  baseRef.current = questions;

  const key = profile && questions.length > 0 ? `questions:${eventId}:${profile.id}` : null;

  useEffect(() => {
    if (!profile || !key) return undefined;
    let cancelled = false;
    setLoading(true);

    const base = baseRef.current;
    const payload = {
      event: { name: eventName, ...stats },
      attendee: profileSummary(profile),
      questions: base.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        context: question.context,
        options: question.options.map((option) => ({ id: option.id, label: option.label })),
      })),
    };

    void callAi('event_questions', payload, key).then((raw) => {
      if (cancelled) return;
      setState(
        raw ? { value: mergeQuestions(base, raw), source: 'ai' } : { value: base, source: 'demo' },
      );
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [profile, key, eventName, stats]);

  return { value: state?.value ?? questions, source: state?.source ?? 'demo', loading };
}

function mergeQuestions(base: EventQuestion[], raw: unknown): EventQuestion[] {
  const data = record(raw);
  if (!Array.isArray(data.questions)) return base;

  const byId = new Map<string, Record<string, unknown>>();
  for (const item of data.questions) {
    const entry = record(item);
    const id = text(entry.id);
    if (id.length > 0) byId.set(id, entry);
  }

  return base.map((question) => {
    const entry = byId.get(question.id);
    if (!entry) return question;

    const labels = new Map<string, string>();
    if (Array.isArray(entry.options)) {
      for (const item of entry.options) {
        const option = record(item);
        const id = text(option.id);
        const label = text(option.label);
        if (id.length > 0 && label.length > 0) labels.set(id, label);
      }
    }

    return {
      ...question,
      prompt: text(entry.prompt) || question.prompt,
      context: text(entry.context) || question.context,
      reason: text(entry.reason) || question.reason,
      // Option ids stay authoritative: they carry the ranking weights.
      options: question.options.map((option) => ({
        ...option,
        label: labels.get(option.id) ?? option.label,
      })),
    };
  });
}
