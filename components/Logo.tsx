import { Image, View } from 'react-native';
import { Typography } from 'heroui-native';

import { BeatMark } from '@/components/BeatMark';
import { brandColor } from '@/lib/theme';
import { cn } from '@/lib/utils';

const LOGO = require('@/assets/meetbeat-logo.png');

/** The artwork's own paper colour, so the tile has no visible seam. */
const LOGO_PAPER = '#f7f8fa';

interface LogoProps {
  /** Rendered width in points. Height follows the square artwork. */
  size?: number;
}

/**
 * Full MeetBeat lockup (mark, wordmark, tagline).
 *
 * Dimensions live in `style` because Expo web ignores class-based sizing on
 * `Image` and would fall back to the asset's natural 1252px square.
 */
export function Logo({ size = 160 }: LogoProps) {
  return (
    <Image
      source={LOGO}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityLabel="MeetBeat"
    />
  );
}

interface LogoTileProps {
  /** Outer tile edge length in points. */
  size?: number;
}

/**
 * The lockup set on its own paper, like an app icon.
 *
 * The artwork is drawn on a light background, so on the dark canvas it needs a
 * deliberate tile rather than a floating image with a pale square behind it.
 */
export function LogoTile({ size = 168 }: LogoTileProps) {
  const radius = Math.round(size * 0.24);

  return (
    <View
      className="items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: LOGO_PAPER,
        borderWidth: 1,
        borderColor: 'rgba(47, 128, 255, 0.35)',
        shadowColor: brandColor.electric,
        shadowOpacity: 0.55,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 10 },
        elevation: 12,
      }}
    >
      <Image
        source={LOGO}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="MeetBeat"
      />
    </View>
  );
}

interface LogoRowProps {
  size?: number;
  /** `light` is for the brand gradient; the default suits the dark canvas. */
  tone?: 'dark' | 'light';
}

/**
 * Compact brand row for screen headers: the animated pulse plus the wordmark,
 * with `Beat` picked out in electric blue.
 */
export function LogoRow({ size = 22, tone = 'dark' }: LogoRowProps) {
  const light = tone === 'light';

  return (
    <View className="flex-row items-center gap-2">
      <BeatMark size={size} color={light ? '#ffffff' : brandColor.electric} />
      <Typography.Paragraph
        className={cn('font-bold tracking-tight', light ? 'text-hero-ink' : 'text-foreground')}
      >
        Meet
        <Typography.Paragraph
          className={cn('font-bold', light ? 'text-hero-ink-muted' : 'text-electric')}
        >
          Beat
        </Typography.Paragraph>
      </Typography.Paragraph>
    </View>
  );
}
