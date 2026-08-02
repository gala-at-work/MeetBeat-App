import { Redirect, router } from 'expo-router';
import { Button, Chip, PressableFeedback, Spinner, Surface, Typography } from 'heroui-native';
import { ArrowLeft, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { LogoRow } from '@/components/Logo';
import { Avatar } from '@/components/Avatar';
import { GradientPanel } from '@/components/GradientPanel';
import { Reveal } from '@/components/Reveal';
import { StepIdentity } from '@/components/onboarding/StepIdentity';
import { StepInterview } from '@/components/onboarding/StepInterview';
import { StepLinkedIn } from '@/components/onboarding/StepLinkedIn';
import { StepSignals } from '@/components/onboarding/StepSignals';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { aiExtractProfile } from '@/lib/ai';
import { ATTENDEES, cohortForEvent } from '@/lib/attendees';
import { signOut, useAuthStore } from '@/lib/auth';
import { extractSignals } from '@/lib/extract';
import { useLanguageStore, useT, type TranslationKey } from '@/lib/i18n';
import { useActiveEvent, useProfileStore } from '@/lib/store';
import { pushProfile } from '@/lib/sync';
import { ui } from '@/lib/theme';
import type { ProfileDraft, UserProfile } from '@/lib/types';

/** Step order mirrors the product flow: identity, LinkedIn, interview, review. */
const STEP_KEYS: TranslationKey[] = [
  'onboarding.step.welcome',
  'onboarding.step.you',
  'onboarding.step.linkedin',
  'onboarding.step.interview',
  'onboarding.step.signals',
  'onboarding.step.checkin',
];

const INITIAL_DRAFT: ProfileDraft = {
  name: '',
  headline: '',
  company: '',
  role: 'founder',
  location: 'Bangalore',
  answers: {},
  skills: [],
  industries: [],
  interests: [],
  seeking: [],
  offering: [],
  stage: 'idea',
  ask: '',
  give: '',
  linkedinImported: false,
};

function union<T>(a: T[], b: T[]): T[] {
  return [...new Set([...a, ...b])];
}

export default function Onboarding() {
  const t = useT();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ProfileDraft>(() => {
    // A name given at sign-up carries into the identity step instead of asking twice.
    const given = useAuthStore.getState().user?.name ?? '';
    return given.length > 0 ? { ...INITIAL_DRAFT, name: given } : INITIAL_DRAFT;
  });
  const [aiState, setAiState] = useState<'idle' | 'working' | 'done' | 'failed'>('idle');
  const saveProfile = useProfileStore((state) => state.saveProfile);
  const authStatus = useAuthStore((state) => state.status);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const language = useLanguageStore((state) => state.language);
  const event = useActiveEvent();

  const patch = useCallback((update: Partial<ProfileDraft>) => {
    setDraft((current) => ({ ...current, ...update }));
  }, []);

  const setAnswer = useCallback((questionId: string, text: string) => {
    setDraft((current) => ({
      ...current,
      answers: { ...current.answers, [questionId]: text },
    }));
  }, []);

  const answeredCount = useMemo(
    () => Object.values(draft.answers).filter((value) => value.trim().length > 0).length,
    [draft.answers],
  );

  const applyExtraction = useCallback(() => {
    setDraft((current) => {
      const extracted = extractSignals(current.answers);
      return {
        ...current,
        skills: union(current.skills, extracted.skills),
        industries: union(current.industries, extracted.industries),
        interests: union(current.interests, extracted.interests),
        seeking: union(current.seeking, extracted.seeking),
        offering: union(current.offering, extracted.offering),
        stage: extracted.stage ?? current.stage,
        ask: current.ask.trim().length > 0 ? current.ask : (current.answers.seeking ?? '').trim(),
        give: current.give.trim().length > 0 ? current.give : (current.answers.offer ?? '').trim(),
      };
    });
  }, []);

  /**
   * The model reads the same answers as the keyword extractor and its findings
   * are unioned in. Keyword extraction has already run, so a failure here is
   * invisible apart from the status line.
   */
  const runAiExtraction = useCallback((answers: Record<string, string>) => {
    setAiState('working');
    void aiExtractProfile(answers).then((result) => {
      if (!result) {
        setAiState('failed');
        return;
      }
      setDraft((current) => ({
        ...current,
        headline: current.headline.trim().length > 0 ? current.headline : result.headline,
        skills: union(current.skills, result.skills),
        industries: union(current.industries, result.industries),
        interests: union(current.interests, result.interests),
        seeking: union(current.seeking, result.seeking),
        offering: union(current.offering, result.offering),
        stage: result.stage ?? current.stage,
        ask: result.ask.length > 0 ? result.ask : current.ask,
        give: result.give.length > 0 ? result.give : current.give,
      }));
      setAiState('done');
    });
  }, []);

  if (authStatus === 'signedOut') return <Redirect href="/welcome" />;

  const canAdvance =
    step === 1
      ? draft.name.trim().length > 1
      : step === 3
        ? answeredCount >= 2
        : step === 4
          ? draft.seeking.length > 0
          : true;

  const blockedHint =
    step === 1
      ? t('onboarding.hint.name')
      : step === 3
        ? t('onboarding.hint.interview')
        : step === 4
          ? t('onboarding.hint.signals')
          : '';

  const finish = () => {
    const profile: UserProfile = {
      id: userId ?? 'me',
      name: draft.name.trim(),
      headline: draft.headline.trim().length > 0 ? draft.headline.trim() : t('common.you'),
      role: draft.role,
      company: draft.company.trim().length > 0 ? draft.company.trim() : '—',
      location: draft.location,
      startupIdea: (draft.answers.idea ?? '').trim(),
      signals: {
        seeking: draft.seeking,
        offering: draft.offering,
        skills: draft.skills,
        industries: draft.industries,
        interests: draft.interests,
        stage: draft.stage,
        ask: draft.ask.trim(),
        give: draft.give.trim(),
      },
      interviewAnswers: draft.answers,
      linkedinImported: draft.linkedinImported,
      onboardedAt: Date.now(),
    };

    saveProfile(profile);
    pushProfile(userId, profile, language);
    router.replace('/dna');
  };

  const goNext = () => {
    if (step === 3) {
      applyExtraction();
      runAiExtraction(draft.answers);
    }
    if (step === STEP_KEYS.length - 1) {
      finish();
      return;
    }
    setStep((current) => current + 1);
  };

  const stepKey = STEP_KEYS[step] ?? STEP_KEYS[0];

  /**
   * Header back. Inside the flow it steps backwards; on the first step the only
   * honest destination is the launch screen, which means dropping the session —
   * otherwise the signed-in-without-a-profile guard would bounce straight back.
   */
  const headerBack = () => {
    if (step > 0) {
      setStep((current) => current - 1);
      return;
    }
    signOut();
    router.replace('/welcome');
  };

  return (
    <SafeAreaView className="bg-canvas flex-1">
      <View className="gap-3 px-5 pt-2">
        <View className="flex-row items-center gap-2">
          <PressableFeedback
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={headerBack}
            className="-ml-1 h-8 w-8 items-center justify-center rounded-full"
          >
            <ChevronLeft size={20} color={ui.text} />
          </PressableFeedback>
          <LogoRow />
          <View className="flex-1" />
          <Typography.Paragraph type="body-sm" color="muted">
            {t(stepKey)} · {step + 1}/{STEP_KEYS.length}
          </Typography.Paragraph>
        </View>
        <View className="bg-default h-1 overflow-hidden rounded-full">
          <View
            className="bg-accent h-1 rounded-full"
            style={{ width: `${((step + 1) / STEP_KEYS.length) * 100}%` }}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-8 pt-6 gap-6"
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 ? (
            <WelcomeStep
              eventName={event.name}
              eventMeta={eventMeta(event)}
              roomSize={cohortForEvent(event).length}
            />
          ) : null}
          {step === 1 ? <StepIdentity draft={draft} onChange={patch} /> : null}
          {step === 2 ? <StepLinkedIn draft={draft} onChange={patch} /> : null}
          {step === 3 ? <StepInterview draft={draft} onAnswer={setAnswer} /> : null}
          {step === 4 ? (
            <View className="gap-4">
              {aiState !== 'idle' ? <AiNote state={aiState} /> : null}
              <StepSignals draft={draft} onChange={patch} />
            </View>
          ) : null}
          {step === 5 ? <ReadyStep draft={draft} eventName={event.name} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="border-border pb-safe-offset-3 gap-2 border-t px-5 pt-3">
        {!canAdvance && blockedHint.length > 0 ? (
          <Typography.Paragraph type="body-sm" color="muted">
            {blockedHint}
          </Typography.Paragraph>
        ) : null}
        <View className="flex-row items-center gap-3">
          {step > 0 ? (
            <Button variant="ghost" onPress={() => setStep((current) => Math.max(0, current - 1))}>
              <ArrowLeft size={16} />
              <Button.Label>{t('common.back')}</Button.Label>
            </Button>
          ) : null}
          <View className="flex-1" />
          {step === 2 ? (
            <Button variant="ghost" onPress={() => setStep(3)}>
              <Button.Label>{t('common.skip')}</Button.Label>
            </Button>
          ) : null}
          <Button isDisabled={!canAdvance} onPress={goNext}>
            <Button.Label>
              {step === STEP_KEYS.length - 1
                ? t('onboarding.finishDna')
                : step === 0
                  ? t('common.start')
                  : t('common.continue')}
            </Button.Label>
            <ArrowRight size={16} />
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

function eventMeta(event: { venue: string; city: string; dateLabel: string }): string {
  return `${event.venue}, ${event.city} · ${event.dateLabel}`;
}

/** Status of the model pass over the interview answers. */
function AiNote({ state }: { state: 'working' | 'done' | 'failed' }) {
  const t = useT();
  const message =
    state === 'working' ? t('ai.reading') : state === 'done' ? t('ai.merged') : t('ai.fallback');

  return (
    <Surface variant="secondary" className="flex-row items-center gap-3 rounded-2xl p-3">
      {state === 'working' ? <Spinner size="sm" /> : null}
      <Typography.Paragraph type="body-sm" color="muted" className="flex-1">
        {message}
      </Typography.Paragraph>
    </Surface>
  );
}

function WelcomeStep({
  eventName,
  eventMeta: meta,
  roomSize,
}: {
  eventName: string;
  eventMeta: string;
  roomSize: number;
}) {
  const t = useT();
  const questions: TranslationKey[] = [
    'onboarding.welcome.q1',
    'onboarding.welcome.q2',
    'onboarding.welcome.q3',
    'onboarding.welcome.q4',
  ];
  const faces = ATTENDEES.slice(0, 5);

  return (
    <View className="gap-5">
      <Reveal>
        <GradientPanel className="gap-5 rounded-3xl p-5">
          <Typography.Heading type="h2" className="text-3xl leading-9 text-white">
            {t('onboarding.welcome.title')}
          </Typography.Heading>
          <Typography.Paragraph className="text-hero-ink-muted leading-6">
            {t('onboarding.welcome.body')}
          </Typography.Paragraph>

          <View className="flex-row items-center gap-3">
            <View className="flex-row">
              {faces.map((person, index) => (
                <View key={person.id} style={{ marginLeft: index === 0 ? 0 : -12 }}>
                  <Avatar name={person.name} seed={person.id} size={34} ring="light" />
                </View>
              ))}
            </View>
            <Typography.Paragraph type="body-sm" className="text-hero-ink-muted flex-1">
              {t('events.inRoom', { count: roomSize })}
            </Typography.Paragraph>
          </View>
        </GradientPanel>
      </Reveal>

      <Reveal delay={80}>
        <Surface variant="secondary" className="gap-3 rounded-3xl p-4">
          <Typography.Paragraph className="font-semibold">
            {t('onboarding.welcome.questionsTitle')}
          </Typography.Paragraph>
          {questions.map((key, index) => (
            <View key={key} className="flex-row gap-3">
              <Typography.Paragraph className="text-accent font-semibold">
                {index + 1}
              </Typography.Paragraph>
              <Typography.Paragraph className="flex-1 leading-6">{t(key)}</Typography.Paragraph>
            </View>
          ))}
        </Surface>
      </Reveal>

      <Reveal delay={140}>
        <Surface variant="secondary" className="gap-1 rounded-3xl p-4">
          <Typography.Paragraph type="body-sm" color="muted">
            {t('onboarding.welcome.tonight')}
          </Typography.Paragraph>
          <Typography.Paragraph className="font-semibold">{eventName}</Typography.Paragraph>
          <Typography.Paragraph type="body-sm" color="muted">
            {meta}
          </Typography.Paragraph>
        </Surface>
      </Reveal>
    </View>
  );
}

function ReadyStep({ draft, eventName }: { draft: ProfileDraft; eventName: string }) {
  const t = useT();

  return (
    <View className="gap-6">
      <View className="gap-1">
        <Typography.Heading type="h2">{t('checkin.title')}</Typography.Heading>
        <Typography.Paragraph color="muted">
          {t('checkin.subtitle', { event: eventName })}
        </Typography.Paragraph>
      </View>

      <Surface variant="secondary" className="gap-3 rounded-3xl p-4">
        <Typography.Paragraph className="font-semibold">
          {draft.name.trim().length > 0 ? draft.name : t('common.you')}
        </Typography.Paragraph>
        <Typography.Paragraph type="body-sm" color="muted">
          {draft.headline.trim().length > 0 ? draft.headline : '—'} · {draft.location}
        </Typography.Paragraph>

        <View className="flex-row flex-wrap gap-2">
          <Chip size="sm" variant="soft" color="accent">
            {t('checkin.wants', { count: draft.seeking.length })}
          </Chip>
          <Chip size="sm" variant="soft" color="accent">
            {t('checkin.offers', { count: draft.offering.length })}
          </Chip>
          <Chip size="sm" variant="soft" color="default">
            {t('checkin.skills', { count: draft.skills.length })}
          </Chip>
          <Chip size="sm" variant="soft" color="default">
            {t('checkin.industries', { count: draft.industries.length })}
          </Chip>
          <Chip size="sm" variant="soft" color="default">
            {t('checkin.interests', { count: draft.interests.length })}
          </Chip>
          {draft.linkedinImported ? (
            <Chip size="sm" variant="soft" color="success">
              {t('checkin.linkedin')}
            </Chip>
          ) : null}
        </View>
      </Surface>

      <Surface variant="secondary" className="gap-2 rounded-3xl p-4">
        <Typography.Paragraph type="body-sm" color="muted">
          {t('checkin.next')}
        </Typography.Paragraph>
        <Typography.Paragraph className="leading-6">{t('checkin.nextBody')}</Typography.Paragraph>
      </Surface>
    </View>
  );
}
