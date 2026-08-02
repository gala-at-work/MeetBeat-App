import { router } from 'expo-router';
import { Button, Card, Input, Label, Spinner, Surface, TextField, Typography } from 'heroui-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { ChipToggle } from '@/components/ChipToggle';
import { useAuthStore } from '@/lib/auth';
import { createEvent } from '@/lib/cloud';
import { useT } from '@/lib/i18n';
import { useEventStore } from '@/lib/store';
import { CITIES, INDUSTRIES } from '@/lib/taxonomy';

const SIZES = [12, 20, 30, 40];

export default function NewEventScreen() {
  const t = useT();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const addEvent = useEventStore((state) => state.addEvent);
  const setActiveEvent = useEventStore((state) => state.setActiveEvent);

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState<string>(CITIES[0]);
  const [dateLabel, setDateLabel] = useState('');
  const [focus, setFocus] = useState<string[]>([]);
  const [size, setSize] = useState(20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFocus = (industry: string) => {
    setFocus((current) =>
      current.includes(industry)
        ? current.filter((item) => item !== industry)
        : [...current, industry],
    );
  };

  const submit = () => {
    if (name.trim().length < 2) {
      setError(t('events.form.nameRequired'));
      return;
    }
    if (!userId) {
      setError(t('common.error'));
      return;
    }

    setBusy(true);
    setError(null);
    void createEvent(
      {
        name: name.trim(),
        tagline: tagline.trim(),
        venue: venue.trim(),
        city,
        dateLabel: dateLabel.trim(),
        cohortIndustries: focus,
        cohortSize: size,
      },
      userId,
    )
      .then((event) => {
        addEvent(event);
        setActiveEvent(event.id);
        router.replace({ pathname: '/events/[id]', params: { id: event.id } });
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : t('common.error'));
      })
      .finally(() => setBusy(false));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="bg-background flex-1"
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-4 gap-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-1">
          <Typography.Heading type="h2">{t('events.createTitle')}</Typography.Heading>
          <Typography.Paragraph color="muted">{t('events.createSubtitle')}</Typography.Paragraph>
        </View>

        <TextField>
          <Label>{t('events.form.name')}</Label>
          <Input
            placeholder={t('events.form.namePlaceholder')}
            value={name}
            onChangeText={setName}
          />
        </TextField>

        <TextField>
          <Label>{t('events.form.tagline')}</Label>
          <Input
            placeholder={t('events.form.taglinePlaceholder')}
            value={tagline}
            onChangeText={setTagline}
          />
        </TextField>

        <TextField>
          <Label>{t('events.form.venue')}</Label>
          <Input
            placeholder={t('events.form.venuePlaceholder')}
            value={venue}
            onChangeText={setVenue}
          />
        </TextField>

        <TextField>
          <Label>{t('events.form.date')}</Label>
          <Input
            placeholder={t('events.form.datePlaceholder')}
            value={dateLabel}
            onChangeText={setDateLabel}
          />
        </TextField>

        <View className="gap-2">
          <Label>{t('events.form.city')}</Label>
          <View className="flex-row flex-wrap gap-2">
            {CITIES.map((option) => (
              <ChipToggle
                key={option}
                label={option}
                selected={city === option}
                onToggle={() => setCity(option)}
              />
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Label>{t('events.form.focus')}</Label>
          <Typography.Paragraph type="body-sm" color="muted">
            {t('events.form.focusHint')}
          </Typography.Paragraph>
          <View className="flex-row flex-wrap gap-2">
            {INDUSTRIES.map((industry) => (
              <ChipToggle
                key={industry}
                label={industry}
                selected={focus.includes(industry)}
                onToggle={() => toggleFocus(industry)}
              />
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Label>{t('events.form.size')}</Label>
          <View className="flex-row flex-wrap gap-2">
            {SIZES.map((option) => (
              <ChipToggle
                key={option}
                label={String(option)}
                selected={size === option}
                onToggle={() => setSize(option)}
              />
            ))}
          </View>
        </View>

        {error ? (
          <Surface variant="secondary" className="rounded-2xl p-3">
            <Typography.Paragraph type="body-sm">{error}</Typography.Paragraph>
          </Surface>
        ) : null}

        <Card>
          <Card.Body>
            <Button isDisabled={busy} onPress={submit}>
              {busy ? <Spinner size="sm" /> : null}
              <Button.Label>{t('events.form.submit')}</Button.Label>
            </Button>
          </Card.Body>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
