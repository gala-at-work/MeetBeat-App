import { PressableFeedback, Typography } from 'heroui-native';
import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { setConsented, useAuthStore } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { matchColor, onHero, ui } from '@/lib/theme';

interface ConsentCheckProps {
  /** 'hero' sits on the blue gradient, 'surface' on a dark card. */
  tone?: 'hero' | 'surface';
  /** Shows the detail line under the acceptance sentence. */
  detail?: boolean;
  /** Outlines the box in red after a blocked attempt to continue. */
  invalid?: boolean;
  /** Fired after the tick changes, so a screen can clear its blocked message. */
  onChange?: (value: boolean) => void;
}

/**
 * Terms and data-protection acceptance. Single source of truth for the tick, so
 * accepting on the launch screen carries over to sign in and back.
 */
export function ConsentCheck({
  tone = 'surface',
  detail = false,
  invalid = false,
  onChange,
}: ConsentCheckProps) {
  const t = useT();
  const consented = useAuthStore((state) => state.consented);

  const hero = tone === 'hero';
  const boxBorder = invalid && !consented ? matchColor.low : hero ? onHero.line : ui.border;
  // The launch screen does not scroll, so it gets the short sentence.
  const label = hero ? t('auth.consentShort') : t('auth.consent');

  return (
    <PressableFeedback
      accessibilityRole="checkbox"
      accessibilityState={{ checked: consented }}
      accessibilityLabel={label}
      hitSlop={10}
      onPress={() => {
        const next = !consented;
        setConsented(next);
        onChange?.(next);
      }}
      className="flex-row items-start gap-3 py-1"
    >
      <View
        className="items-center justify-center rounded-md"
        style={{
          width: 22,
          height: 22,
          marginTop: 1,
          borderWidth: 1.5,
          borderColor: consented ? ui.accent : boxBorder,
          backgroundColor: consented ? ui.accent : hero ? onHero.fill : 'transparent',
        }}
      >
        {consented ? <Check size={14} color="#ffffff" strokeWidth={3} /> : null}
      </View>
      <View className="flex-1 gap-1">
        <Typography.Paragraph
          type="body-sm"
          className={hero ? 'text-hero-ink leading-5' : 'leading-5'}
        >
          {label}
        </Typography.Paragraph>
        {detail ? (
          <Typography.Paragraph
            type="body-sm"
            className={hero ? 'text-hero-ink-muted leading-5' : 'leading-5'}
            color={hero ? undefined : 'muted'}
          >
            {t('auth.consentDetail')}
          </Typography.Paragraph>
        ) : null}
      </View>
    </PressableFeedback>
  );
}
