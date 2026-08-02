import { Image, type ImageSourcePropType, View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { ui } from '@/lib/theme';

const FULL: ImageSourcePropType = require('@/assets/mascot/beaky-full.png');

/** Canvas colour with zero alpha — Android renders a literal `transparent` stop as black. */
const CANVAS_CLEAR = 'rgba(7, 8, 13, 0)';

interface MascotArtProps {
  source: ImageSourcePropType;
  size: number;
  /** Edges to dissolve into the canvas, as a fraction of `size`. */
  fade?: { left?: number; right?: number; top?: number; bottom?: number };
}

/**
 * The mascot artwork with its flat backdrop dissolved into the app canvas.
 *
 * The illustrations ship on a solid near-black plate rather than an alpha
 * channel, so without these edge washes the character would sit inside a
 * faintly visible rectangle on an OLED screen.
 */
function MascotArt({ source, size, fade }: MascotArtProps) {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="MeetBeat guide"
      />
      {fade?.left ? (
        <LinearGradient
          colors={[ui.canvas, CANVAS_CLEAR]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: size * fade.left }}
        />
      ) : null}
      {fade?.right ? (
        <LinearGradient
          colors={[CANVAS_CLEAR, ui.canvas]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: size * fade.right }}
        />
      ) : null}
      {fade?.top ? (
        <LinearGradient
          colors={[ui.canvas, CANVAS_CLEAR]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: size * fade.top }}
        />
      ) : null}
      {fade?.bottom ? (
        <LinearGradient
          colors={[CANVAS_CLEAR, ui.canvas]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: size * fade.bottom }}
        />
      ) : null}
    </View>
  );
}

interface MascotHeroProps {
  size?: number;
  /** Milliseconds before the character walks on. */
  delay?: number;
}

/**
 * Centred mascot for the splash screen: rises into place, then breathes.
 */
export function MascotHero({ size = 220, delay = 620 }: MascotHeroProps) {
  const enter = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    enter.value = withDelay(
      delay,
      withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }),
    );
    bob.value = withDelay(
      delay + 620,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [bob, delay, enter]);

  const style = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: (1 - enter.value) * 42 - bob.value * 6 },
      { scale: 0.9 + enter.value * 0.1 },
    ],
  }));

  return (
    <Animated.View style={style} pointerEvents="none">
      <MascotArt
        source={FULL}
        size={size}
        fade={{ left: 0.14, right: 0.14, top: 0.14, bottom: 0.14 }}
      />
    </Animated.View>
  );
}
