import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, Spinner, Typography } from 'heroui-native';
import { CheckCircle2, MapPin, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { ChipToggle } from '@/components/ChipToggle';
import { QuestionHeading } from '@/components/QuestionHeading';
import { GradientPanel } from '@/components/GradientPanel';
import { Reveal } from '@/components/Reveal';
import { VoiceButton } from '@/components/VoiceButton';
import { useAuthStore } from '@/lib/auth';
import type { EventQuestion } from '@/lib/eventQuestions';
import { useT } from '@/lib/i18n';
import { useEventAnswers, useEventStore, useIsCheckedIn } from '@/lib/store';
import { pushCheckin } from '@/lib/sync';
import { ROLE_LABEL } from '@/lib/taxonomy';
import { onHero, tierColor } from '@/lib/theme';
import type { EventInfo, Person, Role } from '@/lib/types';
import { useRoomCohort } from '@/lib/useRoom';

/** Picks the option whose wording overlaps a spoken answer the most. */
function matchOption(question: EventQuestion, spoken: string): string | null {
  const words = new Set(
    spoken
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => word.length > 3),
  );
  if (words.size === 0) return null;

  let bestId: string | null = null;
  let bestScore = 0;
  for (const option of question.options) {
    const optionWords = option.label
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => word.length > 3);
    const score = optionWords.filter((word) => words.has(word)).length;
    if (score > bestScore) {
      bestScore = score;
      bestId = option.id;
    }
  }
  return bestScore > 0 ? bestId : null;
}

function countRoles(cohort: Person[]): { role: Role; count: number }[] {
  const counts = new Map<Role, number>();
  for (const person of cohort) counts.set(person.role, (counts.get(person.role) ?? 0) + 1);
  return [...counts.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count);
}

function topClusters(cohort: Person[]): string[] {
  const counts = new Map<string, number>();
  for (const person of cohort) {
    for (const industry of person.signals.industries) {
      counts.set(industry, (counts.get(industry) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([industry, count]) => `${industry} (${count})`);
}

export default function EventLobbyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const events = useEventStore((state) => state.events);
  const event = useMemo(() => events.find((item) => item.id === id), [events, id]);

  if (!event) {
    return (
      <View className="bg-background flex-1 items-center justify-center gap-3 p-6">
        {events.length === 0 ? (
          <Spinner />
        ) : (
          <Typography.Paragraph color="muted">{t('lobby.notFound')}</Typography.Paragraph>
        )}
      </View>
    );
  }

  return <Lobby event={event} />;
}

function Lobby({ event }: { event: EventInfo }) {
  const t = useT();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const checkIn = useEventStore((state) => state.checkIn);
  const setActiveEvent = useEventStore((state) => state.setActiveEvent);
  const answerQuestion = useEventStore((state) => state.answerQuestion);
  const answers = useEventAnswers(event.id);
  const checkedIn = useIsCheckedIn(event.id);

  const { cohort, questions } = useRoomCohort(event);
  const roles = useMemo(() => countRoles(cohort), [cohort]);
  const clusters = useMemo(() => topClusters(cohort), [cohort]);
  const answeredCount = Object.keys(answers).length;

  const select = (questionId: string, optionId: string) => {
    answerQuestion(event.id, questionId, optionId);
    const next = useEventStore.getState().answersByEvent[event.id] ?? {};
    pushCheckin(userId, event.id, next);
  };

  const doCheckIn = () => {
    checkIn(event.id);
    pushCheckin(userId, event.id, answers);
  };

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="px-5 pb-10 pt-4 gap-5">
      <Reveal>
        <GradientPanel className="gap-4 rounded-3xl p-5">
          <View className="gap-1.5">
            <Typography.Heading type="h2" className="text-2xl leading-8 text-white">
              {event.name}
            </Typography.Heading>
            <Typography.Paragraph type="body-sm" className="text-hero-ink-muted leading-5">
              {event.tagline}
            </Typography.Paragraph>
            <View className="flex-row items-center gap-1 pt-0.5">
              <MapPin size={12} color={onHero.faint} />
              <Typography.Paragraph type="body-sm" className="text-hero-ink-muted">
                {event.venue}, {event.city} · {event.dateLabel}
              </Typography.Paragraph>
            </View>
          </View>

          <View
            className="flex-row items-center gap-3 rounded-2xl p-3"
            style={{ backgroundColor: onHero.fill, borderWidth: 1, borderColor: onHero.line }}
          >
            <Users size={18} color={onHero.primary} />
            <Typography.Paragraph className="text-hero-ink flex-1">
              {t('events.inRoom', { count: cohort.length })}
            </Typography.Paragraph>
            {checkedIn ? (
              <View className="flex-row items-center gap-1.5">
                <CheckCircle2 size={16} color="#7ee0bd" />
                <Typography.Paragraph type="body-sm" className="text-hero-ink">
                  {t('events.checkedIn')}
                </Typography.Paragraph>
              </View>
            ) : null}
          </View>
        </GradientPanel>
      </Reveal>

      <Card className="rounded-3xl">
        <Card.Body className="gap-4 p-5">
          <View className="flex-row items-center gap-2">
            <Users size={18} color={tierColor.strong} />
            <Typography.Paragraph className="flex-1 font-semibold">
              {t('lobby.whoIsHere')}
            </Typography.Paragraph>
          </View>

          <View className="gap-2">
            <Typography.Paragraph type="body-sm" color="muted">
              {t('lobby.roles')}
            </Typography.Paragraph>
            <View className="flex-row flex-wrap gap-2">
              {roles.map((entry) => (
                <Chip key={entry.role} size="sm" variant="tertiary" color="default">
                  {ROLE_LABEL[entry.role]} · {entry.count}
                </Chip>
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Typography.Paragraph type="body-sm" color="muted">
              {t('lobby.clusters')}
            </Typography.Paragraph>
            <View className="flex-row flex-wrap gap-2">
              {clusters.map((cluster) => (
                <Chip key={cluster} size="sm" variant="soft" color="accent">
                  {cluster}
                </Chip>
              ))}
            </View>
          </View>
        </Card.Body>
      </Card>

      {checkedIn ? null : (
        <Button size="lg" onPress={doCheckIn}>
          <Button.Label>{t('lobby.checkIn')}</Button.Label>
        </Button>
      )}

      <Card className="rounded-3xl">
        <Card.Body className="gap-4 p-5">
          <View className="flex-row items-center gap-2">
            <Typography.Paragraph className="flex-1 font-semibold">
              {t('lobby.questionsTitle')}
            </Typography.Paragraph>
            <Chip size="sm" variant="soft" color={answeredCount > 0 ? 'accent' : 'default'}>
              {t('lobby.answered', { count: answeredCount, total: questions.length })}
            </Chip>
          </View>
          <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
            {t('lobby.questionsSubtitle')}
          </Typography.Paragraph>

          {questions.map((question) => (
            <View key={question.id} className="gap-2">
              <QuestionHeading question={question.prompt} helper={question.context} />
              <View className="flex-row flex-wrap gap-2">
                {question.options.map((option) => (
                  <ChipToggle
                    key={option.id}
                    label={option.label}
                    selected={answers[question.id] === option.id}
                    onToggle={() => select(question.id, option.id)}
                  />
                ))}
              </View>
              <VoiceButton
                compact
                onTranscript={(text) => {
                  const optionId = matchOption(question, text);
                  if (optionId) select(question.id, optionId);
                }}
              />
            </View>
          ))}
        </Card.Body>
      </Card>

      <Button
        size="lg"
        onPress={() => {
          setActiveEvent(event.id);
          if (!checkedIn) doCheckIn();
          router.replace('/');
        }}
      >
        <Button.Label>{t('lobby.openRadar')}</Button.Label>
      </Button>
    </ScrollView>
  );
}
