import { router } from 'expo-router';
import { Button, Card, Chip, Input, Spinner, Surface, TextField, Typography } from 'heroui-native';
import { ArrowRight, MapPin, Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { Reveal } from '@/components/Reveal';
import { cohortForEvent } from '@/lib/attendees';
import { fetchEvents, findEventByCode } from '@/lib/cloud';
import { useT } from '@/lib/i18n';
import { useEventStore } from '@/lib/store';
import { brandColor, tierColor } from '@/lib/theme';
import type { EventInfo } from '@/lib/types';

export default function EventsScreen() {
  const t = useT();
  const events = useEventStore((state) => state.events);
  const activeEventId = useEventStore((state) => state.activeEventId);
  const checkedInEventIds = useEventStore((state) => state.checkedInEventIds);
  const setEvents = useEventStore((state) => state.setEvents);
  const addEvent = useEventStore((state) => state.addEvent);
  const setActiveEvent = useEventStore((state) => state.setActiveEvent);

  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setRefreshing(true);
    void fetchEvents()
      .then(setEvents)
      .catch(() => undefined)
      .finally(() => setRefreshing(false));
  }, [setEvents]);

  const join = () => {
    const trimmed = code.trim();
    if (trimmed.length === 0) return;
    setJoining(true);
    setError(null);

    void findEventByCode(trimmed)
      .then((event) => {
        if (!event) {
          setError(t('events.notFound'));
          return;
        }
        addEvent(event);
        setActiveEvent(event.id);
        setCode('');
        router.push({ pathname: '/events/[id]', params: { id: event.id } });
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : t('common.error'));
      })
      .finally(() => setJoining(false));
  };

  const openEvent = (event: EventInfo) => {
    setActiveEvent(event.id);
    router.push({ pathname: '/events/[id]', params: { id: event.id } });
  };

  return (
    <SafeAreaView className="bg-background flex-1" edges={[]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-4 gap-5"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View className="gap-1">
          <Typography.Heading type="h2">{t('events.title')}</Typography.Heading>
          <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
            {t('events.subtitle')}
          </Typography.Paragraph>
        </View>

        <Card className="rounded-3xl">
          <Card.Body className="gap-4 p-5">
            <Typography.Paragraph className="font-semibold">
              {t('events.joinByCode')}
            </Typography.Paragraph>
            <View className="flex-row items-end gap-2">
              <View className="flex-1">
                <TextField>
                  <Input
                    placeholder={t('events.codePlaceholder')}
                    value={code}
                    onChangeText={(value) => setCode(value.toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={8}
                  />
                </TextField>
              </View>
              <Button isDisabled={joining || code.trim().length === 0} onPress={join}>
                {joining ? <Spinner size="sm" /> : null}
                <Button.Label>{t('events.join')}</Button.Label>
              </Button>
            </View>
            {error ? (
              <Surface variant="secondary" className="rounded-2xl p-3">
                <Typography.Paragraph type="body-sm">{error}</Typography.Paragraph>
              </Surface>
            ) : null}
            <Button variant="secondary" onPress={() => router.push('/events/new')}>
              <Plus size={16} color={brandColor.electric} />
              <Button.Label>{t('events.create')}</Button.Label>
            </Button>
          </Card.Body>
        </Card>

        <Typography.Heading type="h4">{t('events.allRooms')}</Typography.Heading>

        {events.length === 0 ? (
          <Surface variant="secondary" className="rounded-2xl p-4">
            <Typography.Paragraph type="body-sm" color="muted">
              {t('common.loading')}
            </Typography.Paragraph>
          </Surface>
        ) : null}

        {events.map((event, index) => {
          const size = cohortForEvent(event).length;
          const isActive = event.id === activeEventId;
          const isCheckedIn = checkedInEventIds.includes(event.id);

          return (
            <Reveal key={event.id} delay={Math.min(index, 6) * 40}>
              <Card
                className="rounded-3xl"
                style={
                  isActive ? { borderWidth: 1.5, borderColor: brandColor.electric } : undefined
                }
              >
                <Card.Body className="gap-3 p-4">
                  <View className="flex-row items-start gap-3">
                    <View className="flex-1 gap-1">
                      <Typography.Paragraph className="font-semibold">
                        {event.name}
                      </Typography.Paragraph>
                      <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
                        {event.tagline}
                      </Typography.Paragraph>
                      <View className="flex-row items-center gap-1 pt-0.5">
                        <MapPin size={12} color={tierColor.fair} />
                        <Typography.Paragraph type="body-sm" color="muted">
                          {event.venue}, {event.city} · {event.dateLabel}
                        </Typography.Paragraph>
                      </View>
                    </View>
                    {isActive ? (
                      <Chip size="sm" variant="soft" color="accent">
                        {t('events.activeRoom')}
                      </Chip>
                    ) : null}
                  </View>

                  <View className="flex-row flex-wrap items-center gap-2">
                    <Chip size="sm" variant="tertiary" color="default">
                      {t('events.inRoom', { count: size })}
                    </Chip>
                    <Chip size="sm" variant="tertiary" color="default">
                      {t('events.code', { code: event.joinCode })}
                    </Chip>
                    {isCheckedIn ? (
                      <Chip size="sm" variant="soft" color="success">
                        {t('events.checkedIn')}
                      </Chip>
                    ) : null}
                    {event.isDemo ? null : (
                      <Chip size="sm" variant="soft" color="accent">
                        {t('events.yours')}
                      </Chip>
                    )}
                  </View>

                  <Button size="sm" variant="tertiary" onPress={() => openEvent(event)}>
                    <Button.Label>{t('events.enter')}</Button.Label>
                    <ArrowRight size={14} color={brandColor.electric} />
                  </Button>
                </Card.Body>
              </Card>
            </Reveal>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
