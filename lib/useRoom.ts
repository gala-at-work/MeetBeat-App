import { useMemo } from 'react';

import { cohortForEvent } from '@/lib/attendees';
import { buildEventQuestions, focusFromAnswers, type EventQuestion } from '@/lib/eventQuestions';
import { rankRoom } from '@/lib/matching';
import { useEventAnswers, useProfileStore } from '@/lib/store';
import type { EventInfo, Match, Person } from '@/lib/types';

export interface RankedRoom {
  cohort: Person[];
  questions: EventQuestion[];
  matches: Match[];
  answeredCount: number;
  focusActive: boolean;
}

/** Attendees in a room plus the follow-up questions derived from that cohort. */
export function useRoomCohort(event: EventInfo): { cohort: Person[]; questions: EventQuestion[] } {
  const cohort = useMemo(() => cohortForEvent(event), [event]);
  const questions = useMemo(() => buildEventQuestions(cohort), [cohort]);
  return { cohort, questions };
}

export function useRankedRoom(event: EventInfo): RankedRoom {
  const profile = useProfileStore((state) => state.profile);
  const answers = useEventAnswers(event.id);
  const { cohort, questions } = useRoomCohort(event);

  const focus = useMemo(() => focusFromAnswers(questions, answers), [questions, answers]);
  const matches = useMemo(
    () => (profile ? rankRoom(profile, cohort, focus) : []),
    [profile, cohort, focus],
  );

  return {
    cohort,
    questions,
    matches,
    answeredCount: Object.keys(answers).length,
    focusActive: focus.industries.length > 0 || focus.goals.length > 0,
  };
}
