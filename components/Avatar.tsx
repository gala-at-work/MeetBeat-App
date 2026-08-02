import { Image, View } from 'react-native';

import { avatarImage } from '@/lib/avatars';
import { avatarColor, brandColor, matchColor, matchTier } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  seed?: string;
  /** Rendered diameter in points, ring included. */
  size?: number;
  /** Ring drawn around the portrait. `tier` colours it by `score`. */
  ring?: 'none' | 'brand' | 'tier' | 'light';
  score?: number;
  className?: string;
}

function ringColorFor(ring: AvatarProps['ring'], score: number | undefined, seed: string): string {
  if (ring === 'tier') return matchColor[matchTier(score ?? 0)];
  if (ring === 'brand') return brandColor.electric;
  if (ring === 'light') return '#ffffff';
  return avatarColor(seed);
}

/**
 * Cartoon portrait clipped to a circle.
 *
 * Dimensions live in `style` because Expo web ignores class-based sizing on
 * `Image` and would render the 1024px artwork at natural size.
 */
export function Avatar({ name, seed, size = 48, ring = 'none', score, className }: AvatarProps) {
  const source = avatarImage(name, seed);
  const ringWidth = ring === 'none' ? 0 : Math.max(2, Math.round(size * 0.055));
  const inner = size - ringWidth * 2;
  const border = ringColorFor(ring, score, seed ?? name);

  return (
    <View
      className={cn('items-center justify-center rounded-full', className)}
      style={{
        width: size,
        height: size,
        padding: ringWidth,
        backgroundColor: ring === 'none' ? 'transparent' : border,
      }}
    >
      <View
        className="overflow-hidden rounded-full bg-white"
        style={{ width: inner, height: inner }}
      >
        <Image
          source={source}
          style={{ width: inner, height: inner }}
          resizeMode="cover"
          accessibilityLabel={name}
        />
      </View>
    </View>
  );
}
