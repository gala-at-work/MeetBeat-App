import * as Clipboard from 'expo-clipboard';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, Separator, Spinner, Surface, Typography } from 'heroui-native';
import { Check, Copy, MapPin, MessageCircle, Sparkles } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { GradientPanel } from '@/components/GradientPanel';
import { Reveal } from '@/components/Reveal';
import { ScoreDial } from '@/components/ScoreDial';
import { useMatchIntelligence } from '@/lib/ai';
import { findAttendee } from '@/lib/attendees';
import { useAuthStore } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { EMPTY_FOCUS, scoreMatch } from '@/lib/matching';
import { openChat } from '@/lib/nav';
import { useActiveEvent, useEventConnections, useEventStore, useProfileStore } from '@/lib/store';
import { pushConnection } from '@/lib/sync';
import { goalMeta, ROLE_LABEL, STAGE_LABEL } from '@/lib/taxonomy';
import {
  matchColor,
  matchSoft,
  matchTier,
  onHero,
  positiveColor,
  scoreTier,
  tierColor,
  tierSoft,
} from '@/lib/theme';
import { useRankedRoom } from '@/lib/useRoom';

export default function MatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const profile = useProfileStore((state) => state.profile);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const event = useActiveEvent();
  const connections = useEventConnections(event.id);
  const markViewed = useEventStore((state) => state.markViewed);
  const addConnection = useEventStore((state) => state.addConnection);
  const { matches } = useRankedRoom(event);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const person = id ? findAttendee(id) : undefined;

  useEffect(() => {
    if (person) markViewed(person.id);
  }, [person, markViewed]);

  const match = useMemo(() => {
    if (!profile || !person) return null;
    const ranked = matches.find((candidate) => candidate.person.id === person.id);
    // Someone met at another room is still scored, just without this room's focus.
    return ranked ?? scoreMatch(profile, person, EMPTY_FOCUS);
  }, [profile, person, matches]);

  const intelligence = useMatchIntelligence(profile, match);
  const openers = intelligence?.openers ?? [];

  if (!person || !match) {
    return (
      <View className="bg-background flex-1 items-center justify-center p-6">
        <Stack.Screen options={{ title: t('lobby.notFound') }} />
        <Typography.Paragraph color="muted">{t('radar.empty')}</Typography.Paragraph>
      </View>
    );
  }

  const connected = connections.some((connection) => connection.personId === person.id);
  const tier = scoreTier(match.score);
  const tint = matchColor[matchTier(match.score)];
  const soft = matchSoft[matchTier(match.score)];
  const scoredReasons = match.reasons.filter((reason) => reason.contribution > 0);
  const maxContribution = Math.max(1, ...scoredReasons.map((reason) => reason.contribution));

  const copy = async (openerId: string, text: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedId(openerId);
  };

  const logConnection = () => {
    const connection = {
      eventId: event.id,
      personId: person.id,
      personName: person.name,
      score: match.score,
      method: 'simulated',
      note: match.reasons[0]?.detail ?? '',
      connectedAt: Date.now(),
    } as const;
    addConnection(connection);
    pushConnection(userId, connection);
    router.push({ pathname: '/connection/[id]', params: { id: person.id } });
  };

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="px-5 pb-10 pt-3 gap-4">
      <Stack.Screen options={{ title: person.name }} />

      <Reveal>
        <GradientPanel className="gap-5 rounded-3xl p-5">
          <View className="flex-row items-center gap-4">
            <Avatar name={person.name} seed={person.id} size={66} ring="light" />
            <View className="flex-1 gap-1">
              <Typography.Heading type="h3" className="text-white">
                {person.name}
              </Typography.Heading>
              <Typography.Paragraph type="body-sm" className="text-hero-ink-muted leading-5">
                {person.headline}
              </Typography.Paragraph>
              <View className="flex-row items-center gap-1">
                <MapPin size={12} color={onHero.faint} />
                <Typography.Paragraph type="body-sm" className="text-hero-ink-muted">
                  {person.location} · {ROLE_LABEL[person.role]}
                </Typography.Paragraph>
              </View>
            </View>
          </View>

          <View
            className="flex-row items-center gap-4 rounded-2xl p-3"
            style={{ backgroundColor: onHero.fill, borderWidth: 1, borderColor: onHero.line }}
          >
            <ScoreDial score={match.score} size={68} strokeWidth={6} tone="hero" />
            <View className="flex-1 gap-1">
              <Typography.Paragraph className="font-semibold text-white">
                {t(`tier.${tier}`)}
              </Typography.Paragraph>
              {intelligence ? (
                <>
                  <Typography.Paragraph type="body-sm" className="text-hero-ink-muted">
                    {t('match.outcome')}
                  </Typography.Paragraph>
                  <Typography.Paragraph type="body-sm" className="text-hero-ink leading-5">
                    {intelligence.brief.potentialOutcome}
                  </Typography.Paragraph>
                </>
              ) : (
                <Typography.Paragraph type="body-sm" className="text-hero-ink-muted">
                  {event.name}
                </Typography.Paragraph>
              )}
            </View>
          </View>

          {match.mutual ? (
            <View className="flex-row">
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: onHero.fill, borderWidth: 1, borderColor: onHero.line }}
              >
                <Typography.Paragraph type="body-sm" className="text-hero-ink">
                  {t('match.mutual')}
                </Typography.Paragraph>
              </View>
            </View>
          ) : null}
        </GradientPanel>
      </Reveal>

      <Reveal delay={60}>
        <Card className="rounded-3xl">
          <Card.Body className="gap-4 p-5">
            <View className="flex-row items-center gap-2">
              <Typography.Paragraph className="flex-1 font-semibold">
                {t('match.why')}
              </Typography.Paragraph>
              {intelligence?.loading ? <Spinner size="sm" /> : null}
              {intelligence ? (
                <Chip size="sm" variant="tertiary" color="default">
                  {intelligence.source === 'ai' ? t('ai.byModel') : t('ai.byDemo')}
                </Chip>
              ) : null}
            </View>

            {intelligence ? (
              <Typography.Paragraph className="leading-6">
                {intelligence.brief.summary}
              </Typography.Paragraph>
            ) : null}

            <Separator />

            <View className="gap-4">
              {scoredReasons.map((reason) => (
                <View key={reason.component} className="gap-2">
                  <View className="flex-row items-baseline gap-2">
                    <Typography.Paragraph type="body-sm" className="flex-1 font-semibold">
                      {t(`component.${reason.component}`)}
                    </Typography.Paragraph>
                    <Typography.Paragraph
                      type="body-sm"
                      className="font-semibold"
                      style={{ color: tint }}
                    >
                      {t('match.contribution', { points: reason.contribution })}
                    </Typography.Paragraph>
                  </View>
                  <View
                    className="h-2 overflow-hidden rounded-full"
                    style={{ backgroundColor: soft }}
                  >
                    <View
                      className="h-2 rounded-full"
                      style={{
                        width: `${(reason.contribution / maxContribution) * 100}%`,
                        backgroundColor: tint,
                      }}
                    />
                  </View>
                  <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
                    {reason.detail}
                  </Typography.Paragraph>
                </View>
              ))}
            </View>

            {intelligence && intelligence.brief.unknowns.length > 0 ? (
              <>
                <Separator />
                <View className="gap-1.5">
                  <Typography.Paragraph type="body-sm" className="font-semibold">
                    {t('match.unknowns')}
                  </Typography.Paragraph>
                  {intelligence.brief.unknowns.map((unknown) => (
                    <View key={unknown} className="flex-row gap-2.5">
                      <View className="bg-tier-fair mt-1.5 h-1.5 w-1.5 rounded-full" />
                      <Typography.Paragraph
                        type="body-sm"
                        color="muted"
                        className="flex-1 leading-5"
                      >
                        {unknown}
                      </Typography.Paragraph>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </Card.Body>
        </Card>
      </Reveal>

      <Reveal delay={120}>
        <Card className="rounded-3xl">
          <Card.Body className="gap-4 p-5">
            <View className="gap-1">
              <Typography.Paragraph type="body-sm" color="muted">
                {t('match.ask')}
              </Typography.Paragraph>
              <Typography.Paragraph className="leading-6">
                {person.signals.ask}
              </Typography.Paragraph>
            </View>
            <Separator />
            <View className="gap-1">
              <Typography.Paragraph type="body-sm" color="muted">
                {t('match.give')}
              </Typography.Paragraph>
              <Typography.Paragraph className="leading-6">
                {person.signals.give}
              </Typography.Paragraph>
            </View>
            <Separator />
            <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
              {person.bio}
            </Typography.Paragraph>
          </Card.Body>
        </Card>
      </Reveal>

      <Reveal delay={180}>
        <Card className="rounded-3xl">
          <Card.Body className="gap-3 p-5">
            <Typography.Paragraph className="font-semibold">
              {t('match.theirSignals')}
            </Typography.Paragraph>
            <View className="flex-row flex-wrap gap-2">
              {person.signals.seeking.map((goal) => (
                <Chip key={`seek-${goal}`} size="sm" variant="soft" color="accent">
                  {goalMeta(goal).seekLabel}
                </Chip>
              ))}
              {person.signals.offering.map((goal) => (
                <Chip key={`offer-${goal}`} size="sm" variant="soft" color="success">
                  {goalMeta(goal).giveLabel}
                </Chip>
              ))}
              <Chip size="sm" variant="tertiary" color="default">
                {STAGE_LABEL[person.signals.stage]}
              </Chip>
              {[
                ...person.signals.skills,
                ...person.signals.industries,
                ...person.signals.interests,
              ].map((tag) => (
                <Chip key={tag} size="sm" variant="tertiary" color="default">
                  {tag}
                </Chip>
              ))}
            </View>
          </Card.Body>
        </Card>
      </Reveal>

      <Reveal delay={240}>
        <Card className="rounded-3xl">
          <Card.Body className="gap-4 p-5">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color={tierColor.strong} />
              <Typography.Paragraph className="font-semibold">
                {t('match.openers')}
              </Typography.Paragraph>
            </View>
            {openers.map((opener, index) => (
              <View
                key={opener.id}
                className="gap-2.5 rounded-2xl p-3.5"
                style={{ backgroundColor: index === 0 ? tierSoft.strong : undefined }}
              >
                <Chip size="sm" variant="soft" color="accent" className="self-start">
                  {opener.kind}
                </Chip>
                <Typography.Paragraph className="leading-6">{opener.text}</Typography.Paragraph>
                <Button
                  size="sm"
                  variant="tertiary"
                  className="self-start"
                  onPress={() => void copy(opener.id, opener.text)}
                >
                  {copiedId === opener.id ? (
                    <Check size={14} color={positiveColor} />
                  ) : (
                    <Copy size={14} color={tierColor.fair} />
                  )}
                  <Button.Label>
                    {copiedId === opener.id ? t('common.copied') : t('common.copy')}
                  </Button.Label>
                </Button>
              </View>
            ))}
          </Card.Body>
        </Card>
      </Reveal>

      <View className="gap-2.5">
        <Button size="lg" onPress={() => openChat(person.id)}>
          <MessageCircle size={16} color="#ffffff" />
          <Button.Label>
            {t('chat.open', { name: person.name.split(' ')[0] ?? person.name })}
          </Button.Label>
        </Button>

        {connected ? (
          <Surface variant="secondary" className="flex-row items-center gap-3 rounded-2xl p-4">
            <Check size={18} color={positiveColor} />
            <Typography.Paragraph className="flex-1">{t('connection.title')}</Typography.Paragraph>
          </Surface>
        ) : (
          <Button variant="secondary" onPress={logConnection}>
            <Button.Label>{t('match.connect')}</Button.Label>
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
