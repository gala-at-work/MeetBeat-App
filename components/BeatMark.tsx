import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { brandColor } from '@/lib/theme';

interface BeatMarkProps {
  /** Height of the tallest bar. */
  size?: number;
  color?: string;
}

const BARS = [
  { id: 'bar-1', ratio: 0.45 },
  { id: 'bar-2', ratio: 0.8 },
  { id: 'bar-3', ratio: 1 },
  { id: 'bar-4', ratio: 0.65 },
  { id: 'bar-5', ratio: 0.35 },
];

function Bar({ height, delay, color }: { height: number; delay: number; color: string }) {
  const scale = useSharedValue(0.35);

  useEffect(() => {
    scale.value = withDelay(delay, withRepeat(withTiming(1, { duration: 520 }), -1, true));
  }, [delay, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View
      style={[{ width: 4, height, borderRadius: 2, backgroundColor: color }, animatedStyle]}
    />
  );
}

/** The MeetBeat mark: a small equaliser that keeps a steady pulse. */
export function BeatMark({ size = 28, color = brandColor.electric }: BeatMarkProps) {
  return (
    <View className="flex-row items-center gap-1" style={{ height: size }}>
      {BARS.map((bar, index) => (
        <Bar
          key={bar.id}
          height={Math.max(6, size * bar.ratio)}
          delay={index * 110}
          color={color}
        />
      ))}
    </View>
  );
}
