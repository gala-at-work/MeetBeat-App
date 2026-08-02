import { Stack, useLocalSearchParams } from 'expo-router';
import { Button, Card, Typography } from 'heroui-native';
import { Check } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { GradientPanel } from '@/components/GradientPanel';
import { Reveal } from '@/components/Reveal';
import { ScoreDial } from '@/components/ScoreDial';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { findAttendee } from '@/lib/attendees';
import { useT } from '@/lib/i18n';
import { EMPTY_FOCUS, scoreMatch, topReasons } from '@/lib/matching';
import { goBack, openChatFromModal, openMatchFromModal } from '@/lib/nav';
import { buildOpeners } from '@/lib/openers';
import { useActiveEvent, useEventConnections, useProfileStore } from '@/lib/store';
import { matchColor, matchSoft, matchTier, onHero, positiveColor, scoreTier } from '@/lib/theme';
import { useRankedRoom } from '@/lib/useRoom';

export default function ConnectionResult() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const profile = useProfileStore((state) => state.profile);
  const event = useActiveEvent();
  const connections = useEventConnections(event.id);
  const { matches } = useRankedRoom(event);

  const person = id ? findAttendee(id) : undefined;

  const match = useMemo(() => {
    if (!profile || !person) return null;
    const ranked = matches.find((candidate) => candidate.person.id === person.id);
    return ranked ?? scoreMatch(profile, person, EMPTY_FOCUS);
  }, [profile, person, matches]);

  const opener = useMemo(() => {
    if (!profile || !match) return null;
    return (
      buildOpeners(
        { name: profile.name, startupIdea: profile.startupIdea, signals: profile.signals },
        match,
      )[0] ?? null
    );
  }, [profile, match]);

  if (!person || !match) {
    return (
      <View className="bg-background flex-1 items-center justify-center p-6">
        <Stack.Screen options={{ title: t('connection.title') }} />
        <Typography.Paragraph color="muted">{t('connections.empty')}</Typography.Paragraph>
      </View>
    );
  }

  const tier = scoreTier(match.score);

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="px-5 pb-10 pt-4 gap-4">
      <Stack.Screen options={{ title: t('connection.title') }} />

      <Reveal>
        <GradientPanel className="items-center gap-4 rounded-3xl px-5 py-6">
          <DetectedBadge />

          <View className="items-center gap-1.5">
            <Typography.Heading type="h2" className="text-2xl text-white" align="center">
              {person.name}
            </Typography.Heading>
            <Typography.Paragraph
              type="body-sm"
              align="center"
              className="text-hero-ink-muted leading-5"
            >
              {t('connection.body')}
            </Typography.Paragraph>
          </View>

          <View
            className="w-full flex-row items-center gap-4 rounded-2xl p-3"
            style={{ backgroundColor: onHero.fill, borderWidth: 1, borderColor: onHero.line }}
          >
            <Avatar name={person.name} seed={person.id} size={54} ring="light" />
            <View className="flex-1 gap-0.5">
              <Typography.Paragraph className="text-hero-ink font-semibold" numberOfLines={1}>
                {person.headline}
              </Typography.Paragraph>
              <Typography.Paragraph type="body-sm" className="text-hero-ink-muted">
                {person.company} · {person.location}
              </Typography.Paragraph>
              <Typography.Paragraph type="body-sm" className="text-hero-ink-muted">
                {match.mutual ? t('match.mutual') : t(`tier.${tier}`)}
              </Typography.Paragraph>
            </View>
            <ScoreDial score={match.score} size={58} strokeWidth={6} tone="hero" />
          </View>

          <Typography.Paragraph type="body-sm" className="text-hero-ink-muted">
            {t('connections.count', { count: connections.length })}
          </Typography.Paragraph>
        </GradientPanel>
      </Reveal>

      <Reveal delay={80}>
        <Card className="rounded-3xl">
          <Card.Body className="gap-3 p-5">
            <Typography.Paragraph className="font-semibold">
              {t('connection.mutual')}
            </Typography.Paragraph>
            {topReasons(match, 3).map((reason) => (
              <View key={reason.component} className="flex-row gap-2.5">
                <View
                  className="mt-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: matchColor[matchTier(match.score)] }}
                />
                <Typography.Paragraph type="body-sm" className="flex-1 leading-5">
                  {reason.detail}
                </Typography.Paragraph>
              </View>
            ))}
          </Card.Body>
        </Card>
      </Reveal>

      {opener ? (
        <Reveal delay={140}>
          <Card className="rounded-3xl">
            <Card.Body className="gap-2 p-5">
              <Typography.Paragraph className="font-semibold">
                {t('match.openers')}
              </Typography.Paragraph>
              <View
                className="rounded-2xl p-3.5"
                style={{ backgroundColor: matchSoft[matchTier(match.score)] }}
              >
                <Typography.Paragraph className="leading-6">{opener.text}</Typography.Paragraph>
              </View>
            </Card.Body>
          </Card>
        </Reveal>
      ) : null}

      <View className="gap-2.5">
        <Button size="lg" onPress={() => openChatFromModal(person.id)}>
          <Button.Label>
            {t('chat.open', { name: person.name.split(' ')[0] ?? person.name })}
          </Button.Label>
        </Button>
        <Button variant="secondary" onPress={() => openMatchFromModal(person.id)}>
          <Button.Label>{t('connection.openProfile')}</Button.Label>
        </Button>
        <Button variant="ghost" onPress={() => goBack('/')}>
          <Button.Label>{t('common.close')}</Button.Label>
        </Button>
      </View>
    </ScrollView>
  );
}

/** Check mark with two expanding rings: the "connection detected" beat. */
function DetectedBadge() {
  return (
    <View className="h-20 w-20 items-center justify-center">
      <Burst delay={0} />
      <Burst delay={900} />
      <View
        className="h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: '#ffffff' }}
      >
        <Check size={26} color={positiveColor} />
      </View>
    </View>
  );
}

function Burst({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false),
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - progress.value),
    transform: [{ scale: 0.7 + progress.value * 0.6 }],
  }));

  return (
    <AnimatedView
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 2,
          borderColor: '#ffffff',
        },
        animatedStyle,
      ]}
    />
  );
}
