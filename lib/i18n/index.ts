import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { changeLanguage, use as registerI18nextPlugin } from 'i18next';
import { useCallback } from 'react';
import { initReactI18next, useTranslation } from 'react-i18next';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { de } from '@/lib/i18n/de';
import { en, type TranslationKey } from '@/lib/i18n/en';
import { es } from '@/lib/i18n/es';
import { fr } from '@/lib/i18n/fr';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const SUPPORTED = new Set<string>(LANGUAGES.map((entry) => entry.code));

function isLanguageCode(value: string): value is LanguageCode {
  return SUPPORTED.has(value);
}

/** First device locale MeetBeat actually ships, else English. */
function deviceLanguage(): LanguageCode {
  for (const locale of getLocales()) {
    const code = locale.languageCode ?? '';
    if (isLanguageCode(code)) return code;
  }
  return 'en';
}

void registerI18nextPlugin(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
    es: { translation: es },
    fr: { translation: fr },
  },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  // Keys are flat dotted ids, not nested objects.
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
});

interface LanguageState {
  language: LanguageCode;
  hydrated: boolean;
  setHydrated: () => void;
  setLanguage: (language: LanguageCode) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: deviceLanguage(),
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setLanguage: (language) => {
        void changeLanguage(language);
        set({ language });
      },
    }),
    {
      name: 'meetbeat.language',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ language: state.language }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          void changeLanguage(state.language);
          state.setHydrated();
        }
      },
    },
  ),
);

export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/** Typed translation hook: unknown keys fail type-check instead of at runtime. */
export function useT(): Translate {
  const { t } = useTranslation();
  return useCallback<Translate>((key, vars) => t(key, vars ?? {}), [t]);
}

export type { TranslationKey };
