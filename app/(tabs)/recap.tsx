import { router } from 'expo-router';
import { Button, Card, Chip, PressableFeedback, Surface, Typography } from 'heroui-native';
import { AlertTriangle, ArrowUpRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { GradientPanel } from '@/components/GradientPanel';
import { Reveal } from '@/components/Reveal';
import { ScoreDial } from '@/components/ScoreDial';
import { findAttendee } from '@/lib/attendees';
import { useT } from '@/lib/i18n';
import { topReasons } from '@/lib/matching';
import { openMatch } from '@/lib/nav';
import { useActiveEvent, useEventConnections, useEventStore } from '@/lib/store';
import { onHero, signalColor, tierColor } from '@/lib/theme';
import { useRankedRoom } from '@/lib/useRoom';

export default function RecapScreen() {
  const t = useT();
  const event = useActiveEvent();
  const connections = useEventConnections(event.id);
  const viewedIds = useEventStore((state) => state.viewedIds);
  const { matches, cohort } = useRankedRoom(event);

  const connectedIds = useMemo(
    () => new Set(connections.map((connection) => connection.personId)),
    [connections],
  );

  const captured = connections.reduce((total, connection) => total + connection.score, 0);
  const best = connections.reduce((top, connection) => Math.max(top, connection.score), 0);

  const missed = useMemo(
    () =>
      matches
        .filter((match) => !connectedIds.has(match.person.id) && match.score >= 58)
        .slice(0, 5),
    [matches, connectedIds],
  );

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="px-5 pb-10 pt-3 gap-5">
      <Reveal>
        <GradientPanel className="gap-5 rounded-3xl p-5">
          <View className="gap-1.5">
            <Typography.Heading type="h2" className="text-2xl text-white">
              {t('recap.title')}
            </Typography.Heading>
            <Typography.Paragraph type="body-sm" className="text-hero-ink-muted leading-5">
              {event.name} · {t('events.inRoom', { count: cohort.length })}
            </Typography.Paragraph>
          </View>

          <View
            className="flex-row rounded-2xl p-3"
            style={{ backgroundColor: onHero.fill, borderWidth: 1, borderColor: onHero.line }}
          >
            <HeroStat value={String(connections.length)} label={t('recap.connections')} />
            <HeroDivider />
            <HeroStat value={String(captured)} label={t('recap.captured')} />
            <HeroDivider />
            <HeroStat value={best > 0 ? String(best) : '—'} label={t('recap.strongest')} />
          </View>

          <Typography.Paragraph type="body-sm" className="text-hero-ink-muted leading-5">
            {t('recap.subtitle')}
          </Typography.Paragraph>
        </GradientPanel>
      </Reveal>

      <Reveal delay={60} className="gap-3">
        <View className="flex-row items-center gap-2">
          <AlertTriangle size={18} color={signalColor} />
          <Typography.Heading type="h4" className="flex-1">
            {t('recap.missedTitle')}
          </Typography.Heading>
        </View>
        <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
          {t('recap.missedBody')}
        </Typography.Paragraph>

        {missed.length === 0 ? (
          <Surface variant="secondary" className="rounded-2xl p-4">
            <Typography.Paragraph type="body-sm">{t('recap.missedNone')}</Typography.Paragraph>
          </Surface>
        ) : (
          missed.map((match, index) => {
            const reason = topReasons(match, 1)[0];
            const opened = viewedIds.includes(match.person.id);
            return (
              <Reveal key={match.person.id} delay={90 + index * 45}>
                <PressableFeedback onPress={() => openMatch(match.person.id)}>
                  <Card className="rounded-3xl">
                    <Card.Body className="gap-3 p-4">
                      <View className="flex-row items-center gap-3">
                        <Avatar
                          name={match.person.name}
                          seed={match.person.id}
                          size={44}
                          ring="tier"
                          score={match.score}
                        />
                        <View className="flex-1 gap-0.5">
                          <Typography.Paragraph className="font-semibold" numberOfLines={1}>
                            {match.person.name}
                          </Typography.Paragraph>
                          <Typography.Paragraph type="body-sm" color="muted" numberOfLines={1}>
                            {match.person.headline}
                          </Typography.Paragraph>
                        </View>
                        <ScoreDial score={match.score} size={46} strokeWidth={4} />
                      </View>
                      {reason ? (
                        <Typography.Paragraph type="body-sm" className="leading-5">
                          {reason.detail}
                        </Typography.Paragraph>
                      ) : null}
                      <View className="flex-row items-center gap-2">
                        <Chip size="sm" variant="soft" color={opened ? 'warning' : 'default'}>
                          {opened ? t('recap.openedNotConnected') : t('recap.never')}
                        </Chip>
                        <View className="flex-1" />
                        <ArrowUpRight size={16} color={tierColor.fair} />
                      </View>
                    </Card.Body>
                  </Card>
                </PressableFeedback>
              </Reveal>
            );
          })
        )}
      </Reveal>

      <Reveal delay={140} className="gap-3">
        <View className="flex-row items-center gap-2">
          <Typography.Heading type="h4" className="flex-1">
            {t('recap.connections')}
          </Typography.Heading>
          {connections.length > 0 ? (
            <Button size="sm" variant="tertiary" onPress={() => router.push('/connections')}>
              <Button.Label>{t('connections.title')}</Button.Label>
            </Button>
          ) : null}
        </View>

        {connections.length === 0 ? (
          <Surface variant="secondary" className="rounded-2xl p-4">
            <Typography.Paragraph type="body-sm" color="muted">
              {t('connections.empty')}
            </Typography.Paragraph>
          </Surface>
        ) : (
          connections.map((connection) => {
            const person = findAttendee(connection.personId);
            const name = person?.name ?? connection.personName;
            return (
              <Card key={connection.personId} className="rounded-3xl">
                <Card.Body className="gap-2 p-4">
                  <View className="flex-row items-center gap-3">
                    <Avatar
                      name={name}
                      seed={connection.personId}
                      size={44}
                      ring="tier"
                      score={connection.score}
                    />
                    <View className="flex-1 gap-0.5">
                      <Typography.Paragraph className="font-semibold">{name}</Typography.Paragraph>
                      <Typography.Paragraph type="body-sm" color="muted" numberOfLines={1}>
                        {person?.headline ?? ''}
                      </Typography.Paragraph>
                    </View>
                    <ScoreDial score={connection.score} size={46} strokeWidth={4} />
                  </View>
                  {connection.note.length > 0 ? (
                    <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
                      {connection.note}
                    </Typography.Paragraph>
                  ) : null}
                  <Chip size="sm" variant="soft" color="default" className="self-start">
                    {connection.method === 'qr'
                      ? t('connections.method.qr')
                      : t('connections.method.simulated')}
                  </Chip>
                </Card.Body>
              </Card>
            );
          })
        )}
      </Reveal>
    </ScrollView>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
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
