import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { CURRENT_EVENT } from '@/lib/attendees';
import type { ChatMessage, Connection, EventInfo, Signals, UserProfile } from '@/lib/types';

export const EMPTY_SIGNALS: Signals = {
  seeking: [],
  offering: [],
  skills: [],
  industries: [],
  interests: [],
  stage: 'none',
  ask: '',
  give: '',
};

interface ProfileState {
  profile: UserProfile | null;
  hydrated: boolean;
  setHydrated: () => void;
  saveProfile: (profile: UserProfile) => void;
  updateSignals: (signals: Signals) => void;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      saveProfile: (profile) => set({ profile }),
      updateSignals: (signals) => {
        const current = get().profile;
        if (!current) return;
        set({ profile: { ...current, signals } });
      },
      resetProfile: () => set({ profile: null }),
    }),
    {
      name: 'meetbeat.profile',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ profile: state.profile }),
      // Matches the session bump: an old profile without a session would leave
      // the app half-restored.
      version: 2,
      migrate: () => ({ profile: null }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

interface EventState {
  /** Rooms loaded from the cloud directory. */
  events: EventInfo[];
  activeEventId: string | null;
  checkedInEventIds: string[];
  /** Check-in answers kept per room, because each room asks its own questions. */
  answersByEvent: Record<string, Record<string, string>>;
  connections: Connection[];
  /** Chat threads with attendees, newest last. */
  messages: ChatMessage[];
  viewedIds: string[];
  hydrated: boolean;
  setHydrated: () => void;
  setEvents: (events: EventInfo[]) => void;
  addEvent: (event: EventInfo) => void;
  setActiveEvent: (eventId: string) => void;
  checkIn: (eventId: string) => void;
  answerQuestion: (eventId: string, questionId: string, optionId: string) => void;
  setAnswers: (eventId: string, answers: Record<string, string>) => void;
  markViewed: (personId: string) => void;
  addConnection: (connection: Connection) => void;
  setConnections: (connections: Connection[]) => void;
  appendMessage: (message: ChatMessage) => void;
  resetEvent: () => void;
}

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      events: [],
      activeEventId: null,
      checkedInEventIds: [],
      answersByEvent: {},
      connections: [],
      messages: [],
      viewedIds: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setEvents: (events) => set({ events }),
      addEvent: (event) => {
        const existing = get().events.filter((item) => item.id !== event.id);
        set({ events: [...existing, event] });
      },
      setActiveEvent: (eventId) => set({ activeEventId: eventId }),
      checkIn: (eventId) => {
        const checked = get().checkedInEventIds;
        set({
          activeEventId: eventId,
          checkedInEventIds: checked.includes(eventId) ? checked : [...checked, eventId],
        });
      },
      answerQuestion: (eventId, questionId, optionId) => {
        const byEvent = get().answersByEvent;
        const current = byEvent[eventId] ?? {};
        const next = { ...current };
        if (next[questionId] === optionId) {
          delete next[questionId];
        } else {
          next[questionId] = optionId;
        }
        set({ answersByEvent: { ...byEvent, [eventId]: next } });
      },
      setAnswers: (eventId, answers) => {
        const byEvent = get().answersByEvent;
        set({ answersByEvent: { ...byEvent, [eventId]: answers } });
      },
      markViewed: (personId) => {
        const viewed = get().viewedIds;
        if (viewed.includes(personId)) return;
        set({ viewedIds: [...viewed, personId] });
      },
      addConnection: (connection) => {
        const existing = get().connections;
        if (
          existing.some(
            (item) => item.personId === connection.personId && item.eventId === connection.eventId,
          )
        ) {
          return;
        }
        set({ connections: [connection, ...existing] });
      },
      setConnections: (connections) => set({ connections }),
      appendMessage: (message) => set({ messages: [...get().messages, message] }),
      resetEvent: () =>
        set({
          activeEventId: null,
          checkedInEventIds: [],
          answersByEvent: {},
          connections: [],
          messages: [],
          viewedIds: [],
        }),
    }),
    {
      name: 'meetbeat.event',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        events: state.events,
        activeEventId: state.activeEventId,
        checkedInEventIds: state.checkedInEventIds,
        answersByEvent: state.answersByEvent,
        connections: state.connections,
        messages: state.messages,
        viewedIds: state.viewedIds,
      }),
      // Matches the session bump: check-ins and connections belong to the
      // session that made them.
      version: 3,
      migrate: () => ({
        events: [],
        activeEventId: null,
        checkedInEventIds: [],
        answersByEvent: {},
        connections: [],
        messages: [],
        viewedIds: [],
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

/** True once both persisted stores have read from AsyncStorage. */
export function useStoresHydrated(): boolean {
  const profileHydrated = useProfileStore((state) => state.hydrated);
  const eventHydrated = useEventStore((state) => state.hydrated);
  return profileHydrated && eventHydrated;
}

/** The room the app is currently working in, falling back to the demo summit. */
export function useActiveEvent(): EventInfo {
  const events = useEventStore((state) => state.events);
  const activeEventId = useEventStore((state) => state.activeEventId);

  return useMemo(() => {
    const found = events.find((event) => event.id === activeEventId);
    if (found) return found;
    const fallback = events.find((event) => event.id === CURRENT_EVENT.id);
    return fallback ?? CURRENT_EVENT;
  }, [events, activeEventId]);
}

export function useIsCheckedIn(eventId: string): boolean {
  const checkedInEventIds = useEventStore((state) => state.checkedInEventIds);
  return checkedInEventIds.includes(eventId);
}

/** Check-in answers for one room. */
export function useEventAnswers(eventId: string): Record<string, string> {
  const answersByEvent = useEventStore((state) => state.answersByEvent);
  return useMemo(() => answersByEvent[eventId] ?? {}, [answersByEvent, eventId]);
}

export function useEventConnections(eventId: string): Connection[] {
  const connections = useEventStore((state) => state.connections);
  return useMemo(
    () => connections.filter((connection) => connection.eventId === eventId),
    [connections, eventId],
  );
}

/** One thread, oldest first. */
export function useChatThread(eventId: string, personId: string): ChatMessage[] {
  const messages = useEventStore((state) => state.messages);
  return useMemo(
    () =>
      messages.filter((message) => message.eventId === eventId && message.personId === personId),
    [messages, eventId, personId],
  );
}
