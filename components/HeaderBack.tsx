import { router, usePathname, type Href } from 'expo-router';
import { Typography } from 'heroui-native';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable } from 'react-native';

import { useT } from '@/lib/i18n';
import { goBack } from '@/lib/nav';
import { onHero, ui } from '@/lib/theme';

interface HeaderBackProps {
  fallback?: Href;
  /** `hero` styles the control as a pill for use on the brand gradient. */
  variant?: 'header' | 'hero';
}

/** Grace period for the pop to land before the fallback route is forced. */
const SETTLE_MS = 700;

/**
 * Back control used by every screen past the splash. Explicit rather than the
 * platform default so the affordance is present even when the screen was opened
 * without history behind it.
 *
 * Plain `Pressable` on purpose: this renders inside the navigator's header,
 * where the fewest layers between the touch and the handler is the most
 * reliable arrangement on both native and web.
 */
export function HeaderBack({ fallback = '/', variant = 'header' }: HeaderBackProps) {
  const t = useT();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onPress = useCallback(() => {
    const from = pathRef.current;
    if (timer.current) clearTimeout(timer.current);

    const popped = goBack(fallback);
    if (!popped) return;

    // Safety net: if the pop never took effect the screen is still mounted on
    // the same route, so send it to the parent instead of leaving a dead press.
    timer.current = setTimeout(() => {
      timer.current = null;
      if (pathRef.current === from) router.replace(fallback);
    }, SETTLE_MS);
  }, [fallback]);

  if (variant === 'hero') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        onPress={onPress}
        hitSlop={12}
        className="flex-row items-center gap-1 rounded-full py-1.5 pr-3 pl-2"
        style={{ backgroundColor: onHero.fill, borderWidth: 1, borderColor: onHero.line }}
      >
        <ChevronLeft size={16} color={onHero.primary} />
        <Typography.Paragraph type="body-sm" className="text-hero-ink">
          {t('common.back')}
        </Typography.Paragraph>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      onPress={onPress}
      hitSlop={16}
      className="-ml-1 flex-row items-center gap-0.5 py-2 pr-4"
    >
      <ChevronLeft size={22} color={ui.text} />
      <Typography.Paragraph type="body-sm">{t('common.back')}</Typography.Paragraph>
    </Pressable>
  );
}
