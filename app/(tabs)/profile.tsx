import { router } from 'expo-router';
import { Button, Card, Chip, Separator, Surface, Typography } from 'heroui-native';
import { ArrowRight, Fingerprint, Linkedin, LogOut } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ChipToggle } from '@/components/ChipToggle';
import { GradientPanel } from '@/components/GradientPanel';
import { LanguagePicker } from '@/components/LanguagePicker';
import { Reveal } from '@/components/Reveal';
import { signOut, useAuthStore } from '@/lib/auth';
import { useLanguageStore, useT } from '@/lib/i18n';
import { resetAppData } from '@/lib/reset';
import { useActiveEvent, useEventStore, useProfileStore } from '@/lib/store';
import { pushLanguage, pushProfile } from '@/lib/sync';
import { GOALS, ROLE_LABEL, STAGE_LABEL } from '@/lib/taxonomy';
import { brandColor, onHero } from '@/lib/theme';
import type { GoalId } from '@/lib/types';

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function ProfileScreen() {
  const t = useT();
  const profile = useProfileStore((state) => state.profile);
  const updateSignals = useProfileStore((state) => state.updateSignals);
  const resetProfile = useProfileStore((state) => state.resetProfile);
  const resetEvent = useEventStore((state) => state.resetEvent);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const email = useAuthStore((state) => state.user?.email ?? '');
  const language = useLanguageStore((state) => state.language);
  const event = useActiveEvent();

  if (!profile) return null;

  const signals = profile.signals;

  const applySignals = (next: typeof signals) => {
    updateSignals(next);
    const updated = useProfileStore.getState().profile;
    if (updated) pushProfile(userId, updated, language);
  };

  const setSeeking = (goal: GoalId) =>
    applySignals({ ...signals, seeking: toggle(signals.seeking, goal) });
  const setOffering = (goal: GoalId) =>
    applySignals({ ...signals, offering: toggle(signals.offering, goal) });

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="px-5 pb-10 pt-4 gap-5">
      <Reveal>
        <GradientPanel className="gap-4 rounded-3xl p-5">
          <View className="flex-row items-center gap-4">
            <Avatar name={profile.name} seed={profile.id} size={62} ring="light" />
            <View className="flex-1 gap-1">
              <Typography.Heading type="h3" className="text-white">
                {profile.name}
              </Typography.Heading>
              <Typography.Paragraph type="body-sm" className="text-hero-ink-muted leading-5">
                {profile.headline}
              </Typography.Paragraph>
              <Typography.Paragraph type="body-sm" className="text-hero-ink-muted">
                {ROLE_LABEL[profile.role]} · {profile.company} · {profile.location}
              </Typography.Paragraph>
            </View>
          </View>

          {profile.linkedinImported ? (
            <View className="flex-row items-center gap-2">
              <Linkedin size={14} color={onHero.primary} />
              <Typography.Paragraph type="body-sm" className="text-hero-ink">
                {t('linkedin.imported')}
              </Typography.Paragraph>
            </View>
          ) : null}
        </GradientPanel>
      </Reveal>

      <Card className="rounded-3xl">
        <Card.Body className="gap-3 p-5">
          <Typography.Paragraph className="font-semibold">
            {t('profile.account')}
          </Typography.Paragraph>
          <Typography.Paragraph type="body-sm" color="muted">
            {t('auth.signedInAs', { email })}
          </Typography.Paragraph>
          <Separator />
          <LanguagePicker
            showHint
            onChange={(next) => {
              pushLanguage(userId, next);
            }}
          />
          <Separator />
          <Button variant="secondary" onPress={() => signOut()}>
            <LogOut size={16} color={brandColor.electric} />
            <Button.Label>{t('auth.signOut')}</Button.Label>
          </Button>
        </Card.Body>
      </Card>

      <Card className="rounded-3xl">
        <Card.Body className="gap-3 p-5">
          <Typography.Paragraph className="font-semibold">{t('profile.room')}</Typography.Paragraph>
          <Typography.Paragraph type="body-sm" color="muted">
            {event.name} · {event.venue}, {event.city}
          </Typography.Paragraph>
          <Button
            size="sm"
            variant="tertiary"
            className="self-start"
            onPress={() => router.push('/events')}
          >
            <Button.Label>{t('events.title')}</Button.Label>
            <ArrowRight size={14} color={brandColor.electric} />
          </Button>
        </Card.Body>
      </Card>

      <Card className="rounded-3xl">
        <Card.Body className="gap-3 p-5">
          <View className="flex-row items-center gap-2">
            <Fingerprint size={16} color={brandColor.electric} />
            <Typography.Paragraph className="flex-1 font-semibold">
              {t('profile.dna')}
            </Typography.Paragraph>
          </View>
          <View className="flex-row flex-wrap gap-2">
            <Chip size="sm" variant="soft" color="accent">
              {STAGE_LABEL[signals.stage]}
            </Chip>
            {[...signals.skills, ...signals.industries, ...signals.interests]
              .slice(0, 8)
              .map((tag) => (
                <Chip key={tag} size="sm" variant="tertiary" color="default">
                  {tag}
                </Chip>
              ))}
          </View>
          <Button
            size="sm"
            variant="tertiary"
            className="self-start"
            onPress={() => router.push('/dna')}
          >
            <Button.Label>{t('dna.title')}</Button.Label>
            <ArrowRight size={14} color={brandColor.electric} />
          </Button>
        </Card.Body>
      </Card>

      <Card className="rounded-3xl">
        <Card.Body className="gap-4 p-5">
          <Typography.Paragraph className="font-semibold">
            {t('signals.title')}
          </Typography.Paragraph>
          <View className="gap-2">
            <Typography.Paragraph type="body-sm" color="muted">
              {t('signals.seeking')}
            </Typography.Paragraph>
            <View className="flex-row flex-wrap gap-2">
              {GOALS.map((goal) => (
                <ChipToggle
                  key={`seek-${goal.id}`}
                  label={goal.seekLabel}
                  selected={signals.seeking.includes(goal.id)}
                  onToggle={() => setSeeking(goal.id)}
                />
              ))}
            </View>
          </View>
          <View className="gap-2">
            <Typography.Paragraph type="body-sm" color="muted">
              {t('signals.offering')}
            </Typography.Paragraph>
            <View className="flex-row flex-wrap gap-2">
              {GOALS.map((goal) => (
                <ChipToggle
                  key={`offer-${goal.id}`}
                  label={goal.giveLabel}
                  selected={signals.offering.includes(goal.id)}
                  onToggle={() => setOffering(goal.id)}
                />
              ))}
            </View>
          </View>
        </Card.Body>
      </Card>

      <Surface variant="secondary" className="gap-3 rounded-3xl p-4">
        <Typography.Paragraph className="font-semibold">{t('profile.reset')}</Typography.Paragraph>
        <Typography.Paragraph type="body-sm" color="muted">
          {t('profile.resetHint')}
        </Typography.Paragraph>
        <Button
          variant="danger-soft"
          onPress={() => {
            resetEvent();
            resetProfile();
            router.replace('/onboarding');
          }}
        >
          <Button.Label>{t('profile.redoInterview')}</Button.Label>
        </Button>
        <Separator />
        <Typography.Paragraph type="body-sm" color="muted">
          {t('profile.startOverHint')}
        </Typography.Paragraph>
        <Button variant="danger" onPress={() => resetAppData()}>
          <Button.Label>{t('profile.startOver')}</Button.Label>
        </Button>
      </Surface>
    </ScrollView>
  );
}
