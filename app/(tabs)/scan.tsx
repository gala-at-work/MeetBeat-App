import { router } from 'expo-router';
import { Button, Card, Chip, Surface, Typography } from 'heroui-native';
import { ArrowRight, Shuffle } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Avatar } from '@/components/Avatar';
import { BadgeScanner } from '@/components/BadgeScanner';
import { ChipToggle } from '@/components/ChipToggle';
import { GradientPanel } from '@/components/GradientPanel';
import { Reveal } from '@/components/Reveal';
import { findAttendee } from '@/lib/attendees';
import { useAuthStore } from '@/lib/auth';
import { badgeValue, parseBadge } from '@/lib/badge';
import { useT } from '@/lib/i18n';
import { useActiveEvent, useEventConnections, useEventStore, useProfileStore } from '@/lib/store';
import { pushConnection } from '@/lib/sync';
import { brandColor, tierColor } from '@/lib/theme';
import { useRankedRoom } from '@/lib/useRoom';

export default function ScanScreen() {
  const t = useT();
  const profile = useProfileStore((state) => state.profile);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const event = useActiveEvent();
  const connections = useEventConnections(event.id);
  const addConnection = useEventStore((state) => state.addConnection);
  const { matches } = useRankedRoom(event);

  const [error, setError] = useState<string | null>(null);
  const [demoBadgeId, setDemoBadgeId] = useState<string | null>(null);

  const connectedIds = useMemo(
    () => new Set(connections.map((connection) => connection.personId)),
    [connections],
  );

  const demoOptions = useMemo(() => matches.slice(0, 3).map((match) => match.person), [matches]);

  const connect = (personId: string, method: 'qr' | 'simulated') => {
    const match = matches.find((candidate) => candidate.person.id === personId);
    if (!match) {
      setError(t('scan.unreadable'));
      return;
    }
    setError(null);

    const connection = {
      eventId: event.id,
      personId,
      personName: match.person.name,
      score: match.score,
      method,
      note: match.reasons[0]?.detail ?? '',
      connectedAt: Date.now(),
    } as const;

    addConnection(connection);
    pushConnection(userId, connection);
    router.push({ pathname: '/connection/[id]', params: { id: personId } });
  };

  const handleScan = (value: string) => {
    const id = parseBadge(value);
    if (!id || !findAttendee(id)) {
      setError(t('scan.unreadable'));
      return;
    }
    connect(id, 'qr');
  };

  const simulate = () => {
    const candidates = matches.filter((match) => !connectedIds.has(match.person.id));
    if (candidates.length === 0) {
      setError(t('radar.empty'));
      return;
    }
    // Pick from outside the top of the list so the recap has something to reveal.
    const pool = candidates.length > 6 ? candidates.slice(3) : candidates;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) connect(pick.person.id, 'simulated');
  };

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="px-5 pb-10 pt-4 gap-5">
      <View className="gap-1">
        <Typography.Heading type="h2">{t('scan.title')}</Typography.Heading>
        <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
          {t('scan.yourBadgeHint')}
        </Typography.Paragraph>
      </View>

      <Reveal>
        <GradientPanel className="items-center gap-4 rounded-3xl px-5 py-6">
          <Typography.Paragraph className="text-hero-ink font-semibold">
            {t('scan.yourBadge')}
          </Typography.Paragraph>
          <View className="rounded-3xl bg-white p-4">
            <QRCode value={badgeValue(profile?.id ?? 'me')} size={148} color={brandColor.navy} />
          </View>
          <View className="items-center gap-0.5">
            <Typography.Paragraph className="font-semibold text-white">
              {profile?.name ?? t('common.you')}
            </Typography.Paragraph>
            <Typography.Paragraph type="body-sm" align="center" className="text-hero-ink-muted">
              {profile?.headline ?? ''}
            </Typography.Paragraph>
          </View>
        </GradientPanel>
      </Reveal>

      <View className="gap-3">
        <Typography.Paragraph className="font-semibold">{t('scan.scanBadge')}</Typography.Paragraph>
        <BadgeScanner onScan={handleScan} />
        {error ? (
          <Surface variant="secondary" className="rounded-2xl p-3">
            <Typography.Paragraph type="body-sm">{error}</Typography.Paragraph>
          </Surface>
        ) : null}
        <Button variant="secondary" onPress={simulate}>
          <Shuffle size={16} color={brandColor.electric} />
          <Button.Label>{t('scan.simulate')}</Button.Label>
        </Button>
        <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
          {t('scan.simulateHint')}
        </Typography.Paragraph>
      </View>

      <Card className="rounded-3xl">
        <Card.Body className="gap-3 p-5">
          <Typography.Paragraph className="font-semibold">
            {t('scan.demoBadges')}
          </Typography.Paragraph>
          <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
            {t('scan.demoBadgesHint')}
          </Typography.Paragraph>
          <View className="flex-row flex-wrap gap-2">
            {demoOptions.map((person) => (
              <ChipToggle
                key={person.id}
                label={person.name}
                selected={demoBadgeId === person.id}
                onToggle={() =>
                  setDemoBadgeId((current) => (current === person.id ? null : person.id))
                }
              />
            ))}
          </View>
          {demoBadgeId ? (
            <View className="items-center gap-2 pt-1">
              <View className="rounded-2xl bg-white p-3">
                <QRCode value={badgeValue(demoBadgeId)} size={132} color={tierColor.good} />
              </View>
              <Typography.Paragraph type="body-sm" color="muted">
                {findAttendee(demoBadgeId)?.name}
              </Typography.Paragraph>
            </View>
          ) : null}
        </Card.Body>
      </Card>

      {connections.length > 0 ? (
        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <Typography.Paragraph className="flex-1 font-semibold">
              {t('connections.title')}
            </Typography.Paragraph>
            <Button size="sm" variant="tertiary" onPress={() => router.push('/connections')}>
              <Button.Label>{t('scan.viewConnections')}</Button.Label>
              <ArrowRight size={14} color={brandColor.electric} />
            </Button>
          </View>
          {connections.slice(0, 4).map((connection) => {
            const person = findAttendee(connection.personId);
            const name = person?.name ?? connection.personName;
            return (
              <Surface
                key={connection.personId}
                variant="secondary"
                className="flex-row items-center gap-3 rounded-2xl p-3"
              >
                <Avatar
                  name={name}
                  seed={connection.personId}
                  size={40}
                  ring="tier"
                  score={connection.score}
                />
                <View className="flex-1 gap-0.5">
                  <Typography.Paragraph className="font-semibold" numberOfLines={1}>
                    {name}
                  </Typography.Paragraph>
                  <Typography.Paragraph type="body-sm" color="muted" numberOfLines={1}>
                    {person?.headline ?? ''}
                  </Typography.Paragraph>
                </View>
                <Chip size="sm" variant="soft" color="accent">
                  {connection.score}
                </Chip>
              </Surface>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}
