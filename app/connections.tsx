import { Button, Card, Chip, PressableFeedback, Surface, Typography } from 'heroui-native';
import { ArrowUpRight, MessageCircle } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Reveal } from '@/components/Reveal';
import { ScoreDial } from '@/components/ScoreDial';
import { findAttendee } from '@/lib/attendees';
import { useT } from '@/lib/i18n';
import { openChat, openMatch } from '@/lib/nav';
import { useEventStore } from '@/lib/store';
import { tierColor, ui } from '@/lib/theme';

export default function ConnectionsScreen() {
  const t = useT();
  const connections = useEventStore((state) => state.connections);
  const events = useEventStore((state) => state.events);

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="px-5 pb-10 pt-4 gap-4">
      <View className="gap-1">
        <Typography.Heading type="h2">{t('connections.title')}</Typography.Heading>
        <Typography.Paragraph type="body-sm" color="muted">
          {t('connections.count', { count: connections.length })}
        </Typography.Paragraph>
      </View>

      {connections.length === 0 ? (
        <Surface variant="secondary" className="rounded-2xl p-4">
          <Typography.Paragraph type="body-sm" color="muted">
            {t('connections.empty')}
          </Typography.Paragraph>
        </Surface>
      ) : null}

      {connections.map((connection, index) => {
        const person = findAttendee(connection.personId);
        const event = events.find((item) => item.id === connection.eventId);
        const name = person?.name ?? connection.personName;

        return (
          <Reveal key={`${connection.eventId}-${connection.personId}`} delay={index * 45}>
            <PressableFeedback onPress={() => openMatch(connection.personId)}>
              <Card className="rounded-3xl">
                <Card.Body className="gap-3 p-4">
                  <View className="flex-row items-center gap-3">
                    <Avatar
                      name={name}
                      seed={connection.personId}
                      size={46}
                      ring="tier"
                      score={connection.score}
                    />
                    <View className="flex-1 gap-0.5">
                      <Typography.Paragraph className="font-semibold" numberOfLines={1}>
                        {name}
                      </Typography.Paragraph>
                      <Typography.Paragraph type="body-sm" color="muted" numberOfLines={1}>
                        {person?.headline ?? event?.name ?? ''}
                      </Typography.Paragraph>
                    </View>
                    <ScoreDial score={connection.score} size={46} strokeWidth={4} />
                  </View>

                  {connection.note.length > 0 ? (
                    <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
                      {connection.note}
                    </Typography.Paragraph>
                  ) : null}

                  <View className="flex-row flex-wrap items-center gap-2">
                    <Chip size="sm" variant="soft" color="default">
                      {connection.method === 'qr'
                        ? t('connections.method.qr')
                        : t('connections.method.simulated')}
                    </Chip>
                    {event ? (
                      <Chip size="sm" variant="tertiary" color="default">
                        {event.name}
                      </Chip>
                    ) : null}
                    <View className="flex-1" />
                    <Button
                      size="sm"
                      variant="tertiary"
                      onPress={() => openChat(connection.personId)}
                    >
                      <MessageCircle size={14} color={ui.accent} />
                      <Button.Label>{t('chat.openShort')}</Button.Label>
                    </Button>
                    <ArrowUpRight size={16} color={tierColor.fair} />
                  </View>
                </Card.Body>
              </Card>
            </PressableFeedback>
          </Reveal>
        );
      })}
    </ScrollView>
  );
}
