import type { ReactNode } from 'react';
import { useEffect } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';

interface RevealProps {
  children: ReactNode;
  /** Stagger in ms. Keep the whole sequence under ~400ms. */
  delay?: number;
  /** Distance travelled on entry, in points. */
  offset?: number;
  className?: string;
}

/** Single fade-and-rise entrance. Used to stagger lists and stacked sections. */
export function Reveal({ children, delay = 0, offset = 12, className }: RevealProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * offset }],
  }));

  return (
    <AnimatedView className={className} style={animatedStyle}>
      {children}
    </AnimatedView>
  );
}
