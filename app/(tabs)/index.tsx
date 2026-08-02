import { router } from 'expo-router';
import { Button, Chip, Spinner, Surface, Typography } from 'heroui-native';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { ChipToggle } from '@/components/ChipToggle';
import { GradientPanel } from '@/components/GradientPanel';
import { LogoRow } from '@/components/Logo';
import { MatchCard } from '@/components/MatchCard';
import { QuestionHeading } from '@/components/QuestionHeading';
import type { RadarBlip } from '@/components/OpportunityRadar';
import { OpportunityRadar } from '@/components/OpportunityRadar';
import { Reveal } from '@/components/Reveal';
import { useEventQuestionCopy } from '@/lib/ai';
import { useAuthStore } from '@/lib/auth';
import type { EventQuestion } from '@/lib/eventQuestions';
import { useT } from '@/lib/i18n';
import { openMatch } from '@/lib/nav';
import {
  useActiveEvent,
  useEventAnswers,
  useEventConnections,
  useEventStore,
  useIsCheckedIn,
  useProfileStore,
} from '@/lib/store';
import { pushCheckin } from '@/lib/sync';
import { brandColor, onHero } from '@/lib/theme';
import type { EventInfo, Match, Person } from '@/lib/types';
import { useRankedRoom } from '@/lib/useRoom';

export default function RadarScreen() {
  const t = useT();
  const event = useActiveEvent();
  const connections = useEventConnections(event.id);
  const { matches, cohort, questions, answeredCount, focusActive } = useRankedRoom(event);

  const connectedIds = useMemo(
    () => new Set(connections.map((connection) => connection.personId)),
    [connections],
  );

  const strongCount = useMemo(() => matches.filter((match) => match.score >= 72).length, [matches]);

  const renderItem = ({ item, index }: { item: Match; index: number }) => (
    <View className="px-5">
      <MatchCard match={item} rank={index + 1} connected={connectedIds.has(item.person.id)} />
    </View>
  );

  return (
    <View className="bg-background flex-1">
      <FlatList
        data={matches}
        keyExtractor={(item) => item.person.id}
        renderItem={renderItem}
        contentContainerClassName="pb-8"
        ListHeaderComponent={
          <RoomHeader
            event={event}
            cohort={cohort}
            matches={matches}
            strongCount={strongCount}
            connectedCount={connections.length}
            answeredCount={answeredCount}
            questions={questions}
            focusActive={focusActive}
          />
        }
        ListEmptyComponent={
          <View className="px-5 pt-2">
            <Surface variant="secondary" className="rounded-2xl p-4">
              <Typography.Paragraph type="body-sm" color="muted">
                {t('radar.empty')}
              </Typography.Paragraph>
            </Surface>
          </View>
        }
        initialNumToRender={8}
        windowSize={9}
      />
    </View>
  );
}

interface RoomHeaderProps {
  event: EventInfo;
  cohort: Person[];
  matches: Match[];
  strongCount: number;
  connectedCount: number;
  answeredCount: number;
  questions: EventQuestion[];
  focusActive: boolean;
}

function RoomHeader({
  event,
  cohort,
  matches,
  strongCount,
  connectedCount,
  answeredCount,
  questions,
  focusActive,
}: RoomHeaderProps) {
  const t = useT();
  const profile = useProfileStore((state) => state.profile);
  const checkedIn = useIsCheckedIn(event.id);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const answers = useEventAnswers(event.id);
  const answerQuestion = useEventStore((state) => state.answerQuestion);
  const refined = useEventQuestionCopy(event.name, event.id, questions, cohort, profile);
  const [tuneOpen, setTuneOpen] = useState(answeredCount < questions.length);
  const cohortSize = cohort.length;

  const blips: RadarBlip[] = useMemo(
    () =>
      matches.slice(0, 6).map((match) => ({
        id: match.person.id,
        name: match.person.name,
        seed: match.person.id,
        score: match.score,
      })),
    [matches],
  );

  const select = (questionId: string, optionId: string) => {
    answerQuestion(event.id, questionId, optionId);
    const next = useEventStore.getState().answersByEvent[event.id] ?? {};
    pushCheckin(userId, event.id, next);
  };

  return (
    <View>
      <GradientPanel className="pt-safe-offset-3 gap-5 rounded-b-3xl px-5 pb-6">
        <View className="flex-row items-center gap-3">
          <LogoRow size={20} tone="light" />
          <View className="flex-1" />
          <HeroPill label={checkedIn ? t('events.checkedIn') : t('radar.live')} />
        </View>

        <View className="gap-1.5">
          <Typography.Heading type="h2" className="text-2xl leading-8 text-white">
            {event.name}
          </Typography.Heading>
          <Typography.Paragraph type="body-sm" className="text-hero-ink-muted leading-5">
            {event.venue}, {event.city} · {event.dateLabel}
          </Typography.Paragraph>
        </View>

        {blips.length > 0 ? (
          <Reveal className="items-center gap-2.5">
            <OpportunityRadar
              blips={blips}
              centerName={profile?.name ?? t('common.you')}
              centerSeed={profile?.name}
              onPressBlip={(id) => openMatch(id)}
            />
            <Typography.Paragraph type="body-sm" className="text-hero-ink-muted">
              {t('radar.orbitHint')}
            </Typography.Paragraph>
          </Reveal>
        ) : null}

        <View
          className="flex-row rounded-2xl p-3"
          style={{ backgroundColor: onHero.fill, borderWidth: 1, borderColor: onHero.line }}
        >
          <HeroStat value={cohortSize} label={t('radar.statRoom')} />
          <HeroDivider />
          <HeroStat value={strongCount} label={t('radar.statStrong')} />
          <HeroDivider />
          <HeroStat value={connectedCount} label={t('radar.statMet')} />
        </View>
      </GradientPanel>

      <View className="gap-4 px-5 pt-5">
        <Surface variant="secondary" className="gap-3 rounded-3xl p-4">
          <View className="flex-row items-center gap-2">
            <SlidersHorizontal size={16} color={brandColor.electric} />
            <Typography.Paragraph className="flex-1 font-semibold">
              {t('radar.refine')}
            </Typography.Paragraph>
            {refined.loading ? <Spinner size="sm" /> : null}
            <Chip size="sm" variant="soft" color={focusActive ? 'accent' : 'default'}>
              {t('lobby.answered', { count: answeredCount, total: questions.length })}
            </Chip>
          </View>

          {tuneOpen ? (
            <Reveal className="gap-4">
              <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
                {t('radar.refineHint')}
              </Typography.Paragraph>

              {refined.value.map((question) => (
                <View key={question.id} className="gap-2">
                  <QuestionHeading question={question.prompt} helper={question.context} />
                  {question.reason ? (
                    <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
                      {t('radar.questionReason', { reason: question.reason })}
                    </Typography.Paragraph>
                  ) : null}
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
                </View>
              ))}

              <Button
                size="sm"
                variant="tertiary"
                className="self-start"
                onPress={() => router.push({ pathname: '/events/[id]', params: { id: event.id } })}
              >
                <Button.Label>{t('lobby.whoIsHere')}</Button.Label>
              </Button>
            </Reveal>
          ) : null}

          <Button
            size="sm"
            variant="ghost"
            className="self-start"
            onPress={() => setTuneOpen((open) => !open)}
          >
            {tuneOpen ? (
              <ChevronUp size={14} color={brandColor.electric} />
            ) : (
              <ChevronDown size={14} color={brandColor.electric} />
            )}
            <Button.Label>{tuneOpen ? t('radar.hide') : t('radar.tune')}</Button.Label>
          </Button>
        </Surface>

        <View className="flex-row items-end gap-2 pt-1">
          <Typography.Heading type="h4" className="flex-1">
            {t('radar.ranked')}
          </Typography.Heading>
          <Typography.Paragraph type="body-sm" color="muted">
            {t('radar.subtitle', { count: cohortSize })}
          </Typography.Paragraph>
        </View>
      </View>
    </View>
  );
}

function HeroPill({ label }: { label: string }) {
  return (
    <View
      className="rounded-full px-3 py-1"
      style={{ backgroundColor: onHero.fill, borderWidth: 1, borderColor: onHero.line }}
    >
      <Typography.Paragraph type="body-sm" className="text-hero-ink-muted">
        {label}
      </Typography.Paragraph>
    </View>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <View className="flex-1 items-center gap-0.5">
      <Typography.Paragraph className="text-xl font-bold text-white">{value}</Typography.Paragraph>
      <Typography.Paragraph type="body-sm" className="text-hero-ink-muted text-center">
        {label}
      </Typography.Paragraph>
    </View>
  );
}

function HeroDivider() {
  return <View className="w-px self-stretch" style={{ backgroundColor: onHero.line }} />;
}
