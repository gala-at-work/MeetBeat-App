import { Redirect, router } from 'expo-router';
import { Button, PressableFeedback, Typography } from 'heroui-native';
import { ChevronLeft, ListChecks, MessageSquareQuote, Radar } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { ConsentCheck } from '@/components/ConsentCheck';
import { GradientPanel } from '@/components/GradientPanel';
import { LogoRow } from '@/components/Logo';
import type { RadarBlip } from '@/components/OpportunityRadar';
import { OpportunityRadar } from '@/components/OpportunityRadar';
import { Reveal } from '@/components/Reveal';
import { ATTENDEES } from '@/lib/attendees';
import { useAuthStore } from '@/lib/auth';
import { signInAsDemo } from '@/lib/demo';
import { useT } from '@/lib/i18n';
import { matchColor, onHero } from '@/lib/theme';

/** Illustrative ranking for the launch screen. Real scores need a profile. */
const PREVIEW_SCORES = [98, 96, 94, 92, 90];

const PREVIEW_BLIPS: RadarBlip[] = PREVIEW_SCORES.map((score, index) => {
  const person = ATTENDEES[index];
  return {
    id: person?.id ?? `preview-${index}`,
    name: person?.name ?? 'Attendee',
    seed: person?.id,
    score,
  };
});

/**
 * Launch screen. One screenful, no scrolling: brand, promise, a live ranking
 * preview and the two ways in.
 */
export default function LaunchScreen() {
  const t = useT();
  const status = useAuthStore((state) => state.status);
  const consented = useAuthStore((state) => state.consented);
  const { width, height } = useWindowDimensions();
  const [blocked, setBlocked] = useState(false);

  if (status === 'signedIn') return <Redirect href="/" />;

  const radarSize = Math.min(width - 120, Math.max(148, Math.round(height * 0.26)));
  const showValues = height > 680;

  return (
    <GradientPanel className="pt-safe-offset-5 pb-safe-offset-5 flex-1 justify-between gap-5 px-6">
      <View className="gap-5">
        <View className="flex-row items-center gap-2">
          <PressableFeedback
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => router.replace('/splash')}
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: onHero.fill, borderWidth: 1, borderColor: onHero.line }}
          >
            <ChevronLeft size={16} color={onHero.primary} />
          </PressableFeedback>
          <LogoRow size={22} tone="light" />
          <View className="flex-1" />
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: onHero.fill, borderWidth: 1, borderColor: onHero.line }}
          >
            <Typography.Paragraph type="body-sm" className="text-hero-ink-muted">
              {t('auth.heroKicker')}
            </Typography.Paragraph>
          </View>
        </View>

        <Reveal className="gap-2.5">
          <Typography.Heading type="h1" className="text-4xl leading-10 text-white">
            {t('auth.tagline')}
          </Typography.Heading>
          <Typography.Paragraph className="text-hero-ink-muted leading-6">
            {t('auth.heroCaption')}
          </Typography.Paragraph>
        </Reveal>
      </View>

      <Reveal delay={120} className="items-center gap-3">
        <OpportunityRadar blips={PREVIEW_BLIPS} centerName={t('common.you')} size={radarSize} />
      </Reveal>

      {showValues ? (
        <Reveal delay={200} className="gap-3">
          <ValueRow icon={<Radar size={16} color={onHero.primary} />} label={t('auth.value1')} />
          <ValueRow
            icon={<ListChecks size={16} color={onHero.primary} />}
            label={t('auth.value2')}
          />
          <ValueRow
            icon={<MessageSquareQuote size={16} color={onHero.primary} />}
            label={t('auth.value3')}
          />
        </Reveal>
      ) : null}

      <Reveal delay={260} className="gap-2.5">
        <ConsentCheck
          tone="hero"
          invalid={blocked}
          onChange={(value) => {
            if (value) setBlocked(false);
          }}
        />
        <Button onPress={() => router.push('/sign-in')}>
          <Button.Label>{t('launch.start')}</Button.Label>
        </Button>
        <Button
          variant="secondary"
          onPress={() => {
            if (!consented) {
              setBlocked(true);
              return;
            }
            signInAsDemo();
          }}
        >
          <Button.Label>{t('auth.guest')}</Button.Label>
        </Button>
        {blocked && !consented ? (
          <Typography.Paragraph
            type="body-sm"
            className="text-center"
            style={{ color: matchColor.low }}
          >
            {t('auth.consentRequired')}
          </Typography.Paragraph>
        ) : null}
      </Reveal>
    </GradientPanel>
  );
}

function ValueRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: onHero.fill, borderWidth: 1, borderColor: onHero.line }}
      >
        {icon}
      </View>
      <Typography.Paragraph type="body-sm" className="text-hero-ink flex-1">
        {label}
      </Typography.Paragraph>
    </View>
  );
}
