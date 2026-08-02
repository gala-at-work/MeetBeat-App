import { useCallback, useEffect, useRef, useState } from 'react';

import type { LanguageCode } from '@/lib/i18n';

/**
 * Voice input for the interview and check-in questions.
 *
 * `expo-speech-recognition` is loaded lazily: on the web it maps to the browser
 * Speech API, on a dev build it uses the platform recognizer, and in Expo Go
 * (where the native module is absent) the import fails and the UI falls back to
 * typing instead of crashing.
 *
 * Both recognisers end the session on their own — after a phrase, after a
 * silence, or with a `no-speech` error — which reads to the user as the mic
 * cutting out mid-sentence. So a session here is a loop: while the user still
 * wants to dictate, the recogniser is restarted whenever it ends, and only a
 * real fault (permission, capture, network) surfaces as an error.
 */

interface Subscription {
  remove: () => void;
}

interface SpeechApi {
  isRecognitionAvailable?: () => boolean;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: {
    lang: string;
    interimResults?: boolean;
    continuous?: boolean;
    requiresOnDeviceRecognition?: boolean;
  }) => void;
  stop: () => void;
  abort?: () => void;
  addListener: (event: string, listener: (payload: unknown) => void) => Subscription;
}

function isSpeechApi(value: unknown): value is SpeechApi {
  return (
    typeof value === 'object' &&
    value !== null &&
    'start' in value &&
    typeof value.start === 'function'
  );
}

let cachedApi: SpeechApi | null | undefined;

async function loadSpeech(): Promise<SpeechApi | null> {
  if (cachedApi !== undefined) return cachedApi;
  try {
    const module = await import('expo-speech-recognition');
    const api = module.ExpoSpeechRecognitionModule;
    cachedApi = isSpeechApi(api) ? api : null;
  } catch {
    cachedApi = null;
  }
  return cachedApi;
}

const LOCALE: Record<LanguageCode, string> = {
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
};

export type VoiceStatus = 'idle' | 'listening' | 'unsupported' | 'denied' | 'failed';

interface ResultPayload {
  isFinal: boolean;
  transcript: string;
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readResult(payload: unknown): ResultPayload | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const results = 'results' in payload && Array.isArray(payload.results) ? payload.results : [];
  const first: unknown = results[0];
  const transcript =
    typeof first === 'object' && first !== null && 'transcript' in first
      ? readText(first.transcript)
      : '';
  if (transcript.length === 0) return null;
  return { isFinal: 'isFinal' in payload && payload.isFinal === true, transcript };
}

function readErrorCode(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) return '';
  if ('error' in payload) return readText(payload.error);
  if ('code' in payload) return readText(payload.code);
  return '';
}

/** Faults that mean the microphone is unusable, so retrying is pointless. */
const FATAL_CODES = new Set([
  'not-allowed',
  'service-not-allowed',
  'permissions',
  'audio-capture',
  'language-not-supported',
]);

/** A dictation session restarts on silence, but not forever. */
const MAX_RESTARTS = 40;

interface UseVoiceInput {
  status: VoiceStatus;
  /** Live text while the user is still speaking. */
  partial: string;
  start: () => void;
  stop: () => void;
}

export function useVoiceInput(
  language: LanguageCode,
  onTranscript: (text: string) => void,
): UseVoiceInput {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [partial, setPartial] = useState('');
  const subscriptions = useRef<Subscription[]>([]);
  const apiRef = useRef<SpeechApi | null>(null);
  const wantsToListen = useRef(false);
  const restarts = useRef(0);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(onTranscript);
  callbackRef.current = onTranscript;
  const localeRef = useRef(LOCALE[language]);
  localeRef.current = LOCALE[language];

  const clearSubscriptions = useCallback(() => {
    for (const subscription of subscriptions.current) subscription.remove();
    subscriptions.current = [];
  }, []);

  useEffect(
    () => () => {
      wantsToListen.current = false;
      if (restartTimer.current) clearTimeout(restartTimer.current);
      for (const subscription of subscriptions.current) subscription.remove();
      subscriptions.current = [];
      apiRef.current?.stop();
    },
    [],
  );

  /** Re-opens the recogniser after it closed itself, keeping the session alive. */
  const resume = useCallback(() => {
    if (!wantsToListen.current) return;
    if (restarts.current >= MAX_RESTARTS) {
      wantsToListen.current = false;
      setStatus('idle');
      return;
    }
    restarts.current += 1;
    if (restartTimer.current) clearTimeout(restartTimer.current);
    restartTimer.current = setTimeout(() => {
      if (!wantsToListen.current) return;
      try {
        apiRef.current?.start({
          lang: localeRef.current,
          interimResults: true,
          continuous: true,
        });
      } catch {
        wantsToListen.current = false;
        setStatus('failed');
      }
    }, 180);
  }, []);

  const start = useCallback(() => {
    void (async () => {
      const api = await loadSpeech();
      if (!api || api.isRecognitionAvailable?.() === false) {
        setStatus('unsupported');
        return;
      }

      try {
        const permission = await api.requestPermissionsAsync();
        if (!permission.granted) {
          setStatus('denied');
          return;
        }

        clearSubscriptions();
        apiRef.current = api;
        wantsToListen.current = true;
        restarts.current = 0;

        subscriptions.current.push(
          api.addListener('result', (payload) => {
            const result = readResult(payload);
            if (!result) return;
            if (result.isFinal) {
              setPartial('');
              callbackRef.current(result.transcript);
            } else {
              setPartial(result.transcript);
            }
          }),
          api.addListener('end', () => {
            setPartial('');
            if (wantsToListen.current) {
              resume();
              return;
            }
            setStatus((current) => (current === 'listening' ? 'idle' : current));
          }),
          api.addListener('error', (payload) => {
            const code = readErrorCode(payload);
            setPartial('');
            if (FATAL_CODES.has(code)) {
              wantsToListen.current = false;
              setStatus(code === 'audio-capture' ? 'failed' : 'denied');
              return;
            }
            // `no-speech`, `aborted`, `network` and friends: the recogniser gave
            // up on a silence, not on the microphone. Keep the session going.
            if (wantsToListen.current) {
              resume();
              return;
            }
            setStatus('failed');
          }),
        );

        api.start({ lang: localeRef.current, interimResults: true, continuous: true });
        setStatus('listening');
      } catch {
        wantsToListen.current = false;
        setStatus('failed');
      }
    })();
  }, [clearSubscriptions, resume]);

  const stop = useCallback(() => {
    wantsToListen.current = false;
    if (restartTimer.current) clearTimeout(restartTimer.current);
    apiRef.current?.stop();
    setPartial('');
    setStatus((current) => (current === 'listening' ? 'idle' : current));
  }, []);

  return { status, partial, start, stop };
}
