import { Stack, useLocalSearchParams } from 'expo-router';
import { Button, Card, Input, Separator, TextField, Typography } from 'heroui-native';
import { Check, ChevronDown, MessageSquareQuote, Send } from 'lucide-react-native';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ScoreDial } from '@/components/ScoreDial';
import { GesturePressable } from '@/components/ui/primitives/GesturePressable';
import { findAttendee } from '@/lib/attendees';
import { useAuthStore } from '@/lib/auth';
import { receiveChatMessage, replyFor, REPLY_DELAY_MS, sendChatMessage } from '@/lib/chat';
import { useT } from '@/lib/i18n';
import { openMatch } from '@/lib/nav';
import { EMPTY_FOCUS, scoreMatch } from '@/lib/matching';
import { buildIceBreakers } from '@/lib/openers';
import {
  useActiveEvent,
  useChatThread,
  useEventConnections,
  useEventStore,
  useProfileStore,
} from '@/lib/store';
import { pushConnection } from '@/lib/sync';
import { positiveColor, ui } from '@/lib/theme';
import type { ChatMessage } from '@/lib/types';
import { useRankedRoom } from '@/lib/useRoom';

function timeLabel(at: number): string {
  const date = new Date(at);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Height cap for the inline ice-breaker list so the composer stays reachable. */
const PICKER_MAX_HEIGHT = 236;

/** Direct thread with one attendee: inline ice-breaker picker, send, and free text. */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const profile = useProfileStore((state) => state.profile);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const event = useActiveEvent();
  const connections = useEventConnections(event.id);
  const addConnection = useEventStore((state) => state.addConnection);
  const { matches } = useRankedRoom(event);

  const person = id ? findAttendee(id) : undefined;
  const thread = useChatThread(event.id, person?.id ?? '');

  const [choiceId, setChoiceId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);

  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const match = useMemo(() => {
    if (!profile || !person) return null;
    const ranked = matches.find((candidate) => candidate.person.id === person.id);
    return ranked ?? scoreMatch(profile, person, EMPTY_FOCUS);
  }, [profile, person, matches]);

  const iceBreakers = useMemo(() => {
    if (!profile || !match) return [];
    return buildIceBreakers(
      { name: profile.name, startupIdea: profile.startupIdea, signals: profile.signals },
      match,
    );
  }, [profile, match]);

  const chosen = iceBreakers.find((item) => item.id === choiceId) ?? null;

  useEffect(
    () => () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    },
    [],
  );

  const send = useCallback(
    (text: string) => {
      if (!person) return;
      if (!sendChatMessage(event.id, person.id, text)) return;

      const turn = thread.filter((message) => message.from === 'them').length;
      if (replyTimer.current) clearTimeout(replyTimer.current);
      setTyping(true);
      replyTimer.current = setTimeout(() => {
        receiveChatMessage(event.id, person.id, replyFor(person, turn));
        setTyping(false);
      }, REPLY_DELAY_MS);
    },
    [event.id, person, thread],
  );

  if (!person || !match) {
    return (
      <View className="bg-background flex-1 items-center justify-center p-6">
        <Stack.Screen options={{ title: t('chat.title') }} />
        <Typography.Paragraph color="muted">{t('radar.empty')}</Typography.Paragraph>
      </View>
    );
  }

  const connected = connections.some((connection) => connection.personId === person.id);

  const markMet = () => {
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
  };

  const sendDraft = () => {
    send(draft);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: person.name }} />

      <View className="border-hairline flex-row items-center gap-3 border-b px-5 py-3">
        <Avatar name={person.name} seed={person.id} size={44} ring="tier" score={match.score} />
        <View className="flex-1 gap-0.5">
          <Typography.Paragraph className="font-semibold" numberOfLines={1}>
            {person.name}
          </Typography.Paragraph>
          <Typography.Paragraph type="body-sm" color="muted" numberOfLines={1}>
            {person.headline}
          </Typography.Paragraph>
        </View>
        <ScoreDial score={match.score} size={44} strokeWidth={4} />
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="px-5 py-4 gap-3"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        <Card className="rounded-3xl">
          <Card.Body className="gap-3 p-4">
            <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
              {person.hook.charAt(0).toUpperCase()}
              {person.hook.slice(1)}.
            </Typography.Paragraph>
            <View className="flex-row flex-wrap gap-2">
              <Button size="sm" variant="tertiary" onPress={() => openMatch(person.id)}>
                <Button.Label>{t('chat.openProfile')}</Button.Label>
              </Button>
              {connected ? (
                <View className="flex-row items-center gap-1.5 px-2">
                  <Check size={14} color={positiveColor} />
                  <Typography.Paragraph type="body-sm" color="muted">
                    {t('connection.title')}
                  </Typography.Paragraph>
                </View>
              ) : (
                <Button size="sm" variant="tertiary" onPress={markMet}>
                  <Button.Label>{t('chat.markMet')}</Button.Label>
                </Button>
              )}
            </View>
          </Card.Body>
        </Card>

        {thread.length === 0 ? (
          <View className="bg-elevated gap-1 rounded-2xl p-4">
            <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
              {t('chat.empty')}
            </Typography.Paragraph>
          </View>
        ) : (
          thread.map((message) => (
            <Bubble key={message.id} message={message} name={person.name} score={match.score} />
          ))
        )}

        {typing ? (
          <Typography.Paragraph type="body-sm" color="muted">
            {t('chat.typing', { name: person.name.split(' ')[0] ?? person.name })}
          </Typography.Paragraph>
        ) : null}
      </ScrollView>

      <View className="border-hairline pb-safe-offset-3 gap-2.5 border-t px-5 pt-3">
        <View className="flex-row items-center gap-2">
          <MessageSquareQuote size={14} color={ui.accent} />
          <Typography.Paragraph type="body-sm" color="muted">
            {t('chat.iceBreaker')}
          </Typography.Paragraph>
        </View>

        <GesturePressable
          accessibilityRole="button"
          accessibilityState={{ expanded: pickerOpen }}
          onPress={() => setPickerOpen((open) => !open)}
          className="flex-row items-center gap-3 rounded-2xl px-3.5 py-3"
          style={{
            backgroundColor: ui.surface,
            borderWidth: 1,
            borderColor: pickerOpen ? ui.accent : ui.border,
          }}
        >
          <Typography.Paragraph
            type="body-sm"
            color={chosen ? 'default' : 'muted'}
            numberOfLines={2}
            className="flex-1 leading-5"
          >
            {chosen ? chosen.text : t('chat.pickIceBreaker')}
          </Typography.Paragraph>
          <ChevronDown
            size={16}
            color={ui.textMuted}
            style={{ transform: [{ rotate: pickerOpen ? '180deg' : '0deg' }] }}
          />
        </GesturePressable>

        {pickerOpen ? (
          <View
            className="overflow-hidden rounded-2xl"
            style={{ backgroundColor: ui.panel, borderWidth: 1, borderColor: ui.border }}
          >
            <ScrollView
              style={{ maxHeight: PICKER_MAX_HEIGHT }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {iceBreakers.map((item, index) => {
                const active = item.id === choiceId;
                return (
                  <Fragment key={item.id}>
                    {index > 0 ? <Separator /> : null}
                    <GesturePressable
                      accessibilityRole="button"
                      onPress={() => {
                        setChoiceId(item.id);
                        setPickerOpen(false);
                      }}
                      className="flex-row items-start gap-3 px-3.5 py-3"
                      style={active ? { backgroundColor: ui.surface } : undefined}
                    >
                      <View className="flex-1 gap-1">
                        <Typography.Paragraph
                          type="body-sm"
                          className="font-semibold"
                          style={{ color: ui.accent }}
                        >
                          {item.kind}
                        </Typography.Paragraph>
                        <Typography.Paragraph type="body-sm" className="leading-5">
                          {item.text}
                        </Typography.Paragraph>
                      </View>
                      {active ? <Check size={16} color={ui.accent} /> : null}
                    </GesturePressable>
                  </Fragment>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <Button
          onPress={() => {
            if (!chosen) return;
            send(chosen.text);
            setChoiceId(null);
            setPickerOpen(false);
          }}
          isDisabled={!chosen}
        >
          <Send size={16} color="#ffffff" />
          <Button.Label>{t('chat.sendNow')}</Button.Label>
        </Button>

        {pickerOpen ? null : (
          <>
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <TextField>
                  <Input
                    placeholder={t('chat.placeholder')}
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={sendDraft}
                    returnKeyType="send"
                  />
                </TextField>
              </View>
              <Button
                variant="secondary"
                onPress={sendDraft}
                isDisabled={draft.trim().length === 0}
              >
                <Button.Label>{t('chat.send')}</Button.Label>
              </Button>
            </View>

            <Typography.Paragraph type="body-sm" color="muted">
              {t('chat.hint')}
            </Typography.Paragraph>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message, name, score }: { message: ChatMessage; name: string; score: number }) {
  const mine = message.from === 'me';

  if (mine) {
    return (
      <View className="items-end gap-1">
        <View
          className="max-w-[86%] rounded-2xl px-3.5 py-2.5"
          style={{ backgroundColor: ui.accent }}
        >
          <Typography.Paragraph className="leading-6 text-white">
            {message.text}
          </Typography.Paragraph>
        </View>
        <Typography.Paragraph type="body-sm" color="muted">
          {timeLabel(message.at)}
        </Typography.Paragraph>
      </View>
    );
  }

  return (
    <View className="flex-row items-end gap-2">
      <Avatar name={name} seed={message.personId} size={30} ring="tier" score={score} />
      <View className="max-w-[80%] gap-1">
        <View
          className="rounded-2xl px-3.5 py-2.5"
          style={{ backgroundColor: ui.surface, borderWidth: 1, borderColor: ui.border }}
        >
          <Typography.Paragraph className="leading-6">{message.text}</Typography.Paragraph>
        </View>
        <Typography.Paragraph type="body-sm" color="muted">
          {timeLabel(message.at)}
        </Typography.Paragraph>
      </View>
    </View>
  );
}
