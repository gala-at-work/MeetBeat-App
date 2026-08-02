import { bilt } from '@/lib/bilt';
import { GOALS, ROLES, STAGES } from '@/lib/taxonomy';
import type { Connection, EventInfo, GoalId, Role, Signals, Stage, UserProfile } from '@/lib/types';

/* -------------------------------------------------------------------------- */
/* Row shapes                                                                  */
/* -------------------------------------------------------------------------- */

interface EventRow {
  id: string;
  name: string;
  tagline: string;
  venue: string;
  city: string;
  date_label: string;
  join_code: string;
  cohort_industries: string[] | null;
  cohort_size: number;
  is_demo: boolean;
  created_by: string | null;
}

interface ProfileRow {
  user_id: string;
  name: string;
  headline: string;
  role: string;
  company: string;
  location: string;
  startup_idea: string;
  signals: unknown;
  interview_answers: unknown;
  linkedin_imported: boolean;
  language: string;
  onboarded_at: string | null;
}

interface ConnectionRow {
  event_id: string;
  attendee_id: string;
  attendee_name: string;
  score: number;
  method: string;
  note: string;
  created_at: string;
}

interface CheckinRow {
  event_id: string;
  answers: unknown;
  checked_in_at: string;
}

const EVENT_COLUMNS =
  'id, name, tagline, venue, city, date_label, join_code, cohort_industries, cohort_size, is_demo, created_by';

/* -------------------------------------------------------------------------- */
/* Narrowing helpers — jsonb and text columns arrive untyped                    */
/* -------------------------------------------------------------------------- */

const GOAL_IDS = new Set<string>(GOALS.map((goal) => goal.id));
const ROLE_IDS = new Set<string>(ROLES);
const STAGE_IDS = new Set<string>(STAGES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function asGoalList(value: unknown): GoalId[] {
  return asStringList(value).filter((item): item is GoalId => GOAL_IDS.has(item));
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isRole(value: string): value is Role {
  return ROLE_IDS.has(value);
}

function asRole(value: string): Role {
  return isRole(value) ? value : 'founder';
}

function isStage(value: string): value is Stage {
  return STAGE_IDS.has(value);
}

function asStage(value: unknown): Stage {
  const text = asText(value);
  return isStage(text) ? text : 'none';
}

function asAnswers(value: unknown): Record<string, string> {
  const record = asRecord(value);
  const answers: Record<string, string> = {};
  for (const [key, item] of Object.entries(record)) {
    if (typeof item === 'string') answers[key] = item;
  }
  return answers;
}

function parseSignals(value: unknown): Signals {
  const record = asRecord(value);
  return {
    seeking: asGoalList(record.seeking),
    offering: asGoalList(record.offering),
    skills: asStringList(record.skills),
    industries: asStringList(record.industries),
    interests: asStringList(record.interests),
    stage: asStage(record.stage),
    ask: asText(record.ask),
    give: asText(record.give),
  };
}

function toEvent(row: EventRow): EventInfo {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    venue: row.venue,
    city: row.city,
    dateLabel: row.date_label,
    joinCode: row.join_code,
    cohortIndustries: row.cohort_industries ?? [],
    cohortSize: row.cohort_size,
    isDemo: row.is_demo,
    createdBy: row.created_by,
  };
}

function toConnection(row: ConnectionRow): Connection {
  const method = row.method === 'simulated' ? 'simulated' : 'qr';
  return {
    eventId: row.event_id,
    personId: row.attendee_id,
    personName: row.attendee_name,
    score: row.score,
    method,
    note: row.note,
    connectedAt: new Date(row.created_at).getTime(),
  };
}

/** Turns a PostgREST/auth error into a message safe to show a user. */
export function cloudMessage(error: { message: string } | null): string | null {
  return error ? error.message : null;
}

/* -------------------------------------------------------------------------- */
/* Events                                                                      */
/* -------------------------------------------------------------------------- */

export async function fetchEvents(): Promise<EventInfo[]> {
  const { data, error } = await bilt
    .from('events')
    .select(EVENT_COLUMNS)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as EventRow[]).map(toEvent);
}

export async function findEventByCode(code: string): Promise<EventInfo | null> {
  const { data, error } = await bilt
    .from('events')
    .select(EVENT_COLUMNS)
    .eq('join_code', code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row: EventRow = data;
  return toEvent(row);
}

export interface NewEventInput {
  name: string;
  tagline: string;
  venue: string;
  city: string;
  dateLabel: string;
  cohortIndustries: string[];
  cohortSize: number;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

function randomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

/**
 * Creates a room. The shared directory only accepts writes from a verified
 * account, and MeetBeat runs its demo on a local session, so a rejected write
 * falls back to a room that lives on this device. Either way the organizer
 * lands in a working lobby.
 */
export async function createEvent(input: NewEventInput, userId: string): Promise<EventInfo> {
  const id = `ev-${slugify(input.name) || 'event'}-${randomCode().toLowerCase()}`;
  const local: EventInfo = {
    id,
    name: input.name,
    tagline: input.tagline,
    venue: input.venue,
    city: input.city,
    dateLabel: input.dateLabel,
    joinCode: randomCode(),
    cohortIndustries: input.cohortIndustries,
    cohortSize: input.cohortSize,
    isDemo: false,
    createdBy: userId,
  };

  try {
    const { data, error } = await bilt
      .from('events')
      .insert({
        id: local.id,
        name: local.name,
        tagline: local.tagline,
        venue: local.venue,
        city: local.city,
        date_label: local.dateLabel,
        join_code: local.joinCode,
        cohort_industries: local.cohortIndustries,
        cohort_size: local.cohortSize,
        is_demo: false,
        created_by: userId,
      })
      .select(EVENT_COLUMNS)
      .single();
    if (error || !data) return local;
    const row: EventRow = data;
    return toEvent(row);
  } catch {
    return local;
  }
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                     */
/* -------------------------------------------------------------------------- */

export interface CloudProfile {
  profile: UserProfile;
  language: string;
}

export async function fetchProfile(userId: string): Promise<CloudProfile | null> {
  const { data, error } = await bilt
    .from('profiles')
    .select(
      'user_id, name, headline, role, company, location, startup_idea, signals, interview_answers, linkedin_imported, language, onboarded_at',
    )
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const row: ProfileRow = data;
  return {
    language: row.language,
    profile: {
      id: row.user_id,
      name: row.name,
      headline: row.headline,
      role: asRole(row.role),
      company: row.company,
      location: row.location,
      startupIdea: row.startup_idea,
      signals: parseSignals(row.signals),
      interviewAnswers: asAnswers(row.interview_answers),
      linkedinImported: row.linkedin_imported,
      onboardedAt: row.onboarded_at ? new Date(row.onboarded_at).getTime() : null,
    },
  };
}

export async function saveProfile(
  userId: string,
  profile: UserProfile,
  language: string,
): Promise<void> {
  const { error } = await bilt.from('profiles').upsert({
    user_id: userId,
    name: profile.name,
    headline: profile.headline,
    role: profile.role,
    company: profile.company,
    location: profile.location,
    startup_idea: profile.startupIdea,
    signals: profile.signals,
    interview_answers: profile.interviewAnswers,
    linkedin_imported: profile.linkedinImported,
    language,
    onboarded_at: profile.onboardedAt ? new Date(profile.onboardedAt).toISOString() : null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function saveLanguage(userId: string, language: string): Promise<void> {
  const { error } = await bilt.from('profiles').update({ language }).eq('user_id', userId);
  if (error) throw new Error(error.message);
}

/* -------------------------------------------------------------------------- */
/* Check-ins and connections                                                   */
/* -------------------------------------------------------------------------- */

export interface CloudCheckin {
  eventId: string;
  answers: Record<string, string>;
  checkedInAt: number;
}

export async function fetchCheckins(userId: string): Promise<CloudCheckin[]> {
  const { data, error } = await bilt
    .from('event_checkins')
    .select('event_id, answers, checked_in_at')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return ((data ?? []) as CheckinRow[]).map((row) => ({
    eventId: row.event_id,
    answers: asAnswers(row.answers),
    checkedInAt: new Date(row.checked_in_at).getTime(),
  }));
}

export async function saveCheckin(
  userId: string,
  eventId: string,
  answers: Record<string, string>,
): Promise<void> {
  const { error } = await bilt
    .from('event_checkins')
    .upsert({ user_id: userId, event_id: eventId, answers });
  if (error) throw new Error(error.message);
}

export async function fetchConnections(userId: string): Promise<Connection[]> {
  const { data, error } = await bilt
    .from('connections')
    .select('event_id, attendee_id, attendee_name, score, method, note, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ConnectionRow[]).map(toConnection);
}

export async function saveConnection(userId: string, connection: Connection): Promise<void> {
  const { error } = await bilt.from('connections').upsert(
    {
      user_id: userId,
      event_id: connection.eventId,
      attendee_id: connection.personId,
      attendee_name: connection.personName,
      score: connection.score,
      method: connection.method,
      note: connection.note,
    },
    { onConflict: 'user_id,event_id,attendee_id' },
  );
  if (error) throw new Error(error.message);
}
