import { useCallback, useEffect, useState } from 'react';

import { CURRENT_EVENT } from '@/lib/attendees';
import { useAuthStore } from '@/lib/auth';
import { hasBiltConfig } from '@/lib/bilt';
import {
  fetchCheckins,
  fetchConnections,
  fetchEvents,
  fetchProfile,
  saveCheckin,
  saveConnection,
  saveLanguage,
  saveProfile as saveCloudProfile,
} from '@/lib/cloud';
import { LANGUAGES, useLanguageStore, type LanguageCode } from '@/lib/i18n';
import { useEventStore, useProfileStore } from '@/lib/store';
import type { Connection, UserProfile } from '@/lib/types';

const LANGUAGE_CODES = new Set<string>(LANGUAGES.map((entry) => entry.code));

function isLanguage(value: string): value is LanguageCode {
  return LANGUAGE_CODES.has(value);
}

function asLanguage(value: string): LanguageCode | null {
  return isLanguage(value) ? value : null;
}

interface CloudSync {
  eventsLoading: boolean;
  eventsError: string | null;
  reloadEvents: () => void;
}

/**
 * Keeps the local stores and the cloud in step.
 *
 * The event directory is public, so it loads immediately. Profile, check-ins and
 * connections load once a session exists and are cleared on sign-out so two
 * accounts never share a device cache.
 */
export function useCloudSync(): CloudSync {
  const status = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const setEvents = useEventStore((state) => state.setEvents);
  const setConnections = useEventStore((state) => state.setConnections);
  const setAnswers = useEventStore((state) => state.setAnswers);
  const checkIn = useEventStore((state) => state.checkIn);
  const resetEvent = useEventStore((state) => state.resetEvent);
  const saveProfile = useProfileStore((state) => state.saveProfile);
  const resetProfile = useProfileStore((state) => state.resetProfile);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reloadEvents = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    // A cloned Bilt project has no hosted credentials. In local-demo mode the
    // seeded event is the complete event directory and no network call is made.
    if (!hasBiltConfig) {
      setEvents([CURRENT_EVENT]);
      setEventsError(null);
      setEventsLoading(false);
      return undefined;
    }

    let cancelled = false;
    setEventsLoading(true);

    void fetchEvents()
      .then((events) => {
        if (cancelled) return;
        setEvents(events);
        setEventsError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setEventsError(error instanceof Error ? error.message : 'Could not load events.');
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [setEvents, reloadToken]);

  useEffect(() => {
    if (!hasBiltConfig || status !== 'signedIn' || !userId) return undefined;
    let cancelled = false;

    void (async () => {
      try {
        const [cloudProfile, checkins, connections] = await Promise.all([
          fetchProfile(userId),
          fetchCheckins(userId),
          fetchConnections(userId),
        ]);
        if (cancelled) return;

        if (cloudProfile) {
          saveProfile(cloudProfile.profile);
          const language = asLanguage(cloudProfile.language);
          if (language) setLanguage(language);
        }
        for (const checkin of checkins) {
          setAnswers(checkin.eventId, checkin.answers);
          checkIn(checkin.eventId);
        }
        if (connections.length > 0) setConnections(connections);
      } catch {
        // Offline or first run: the local cache stays authoritative.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, userId, saveProfile, setAnswers, checkIn, setConnections, setLanguage]);

  useEffect(() => {
    if (status === 'signedOut') {
      resetProfile();
      resetEvent();
    }
  }, [status, resetProfile, resetEvent]);

  return { eventsLoading, eventsError, reloadEvents };
}

/* -------------------------------------------------------------------------- */
/* Write-through helpers. Failures never block the UI: the local store already  */
/* holds the value and the next sign-in refetch reconciles.                     */
/* -------------------------------------------------------------------------- */

export function pushProfile(
  userId: string | null,
  profile: UserProfile,
  language: LanguageCode,
): void {
  if (!hasBiltConfig || !userId) return;
  void saveCloudProfile(userId, profile, language).catch(() => undefined);
}

export function pushLanguage(userId: string | null, language: LanguageCode): void {
  if (!hasBiltConfig || !userId) return;
  void saveLanguage(userId, language).catch(() => undefined);
}

export function pushCheckin(
  userId: string | null,
  eventId: string,
  answers: Record<string, string>,
): void {
  if (!hasBiltConfig || !userId) return;
  void saveCheckin(userId, eventId, answers).catch(() => undefined);
}

export function pushConnection(userId: string | null, connection: Connection): void {
  if (!hasBiltConfig || !userId) return;
  void saveConnection(userId, connection).catch(() => undefined);
}
