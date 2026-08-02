import { Typography } from 'heroui-native';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { cn } from '@/lib/utils';

interface ImpactTextProps {
  text: string;
  /** Applied to each word so the line keeps one type style. */
  className?: string;
  /** Delay before the first word lands, in ms. */
  delay?: number;
  /** Gap between words landing, in ms. */
  stagger?: number;
}

/**
 * Headline that stamps in word by word: each word drops from slightly above at
 * 1.3× and settles with a spring, so the line reads as an announcement.
 */
export function ImpactText({ text, className, delay = 0, stagger = 110 }: ImpactTextProps) {
  const words = useMemo(() => {
    const seen = new Map<string, number>();
    return text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const count = (seen.get(word) ?? 0) + 1;
        seen.set(word, count);
        return { word, key: `${word}#${count}` };
      });
  }, [text]);

  return (
    <View className="flex-row flex-wrap items-center">
      {words.map((item, index) => (
        <ImpactWord
          key={item.key}
          word={item.word}
          className={className}
          delay={delay + index * stagger}
        />
      ))}
    </View>
  );
}

function ImpactWord({
  word,
  className,
  delay,
}: {
  word: string;
  className?: string;
  delay: number;
}) {
  const progress = useSharedValue(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    fade.value = 0;
    progress.value = withDelay(delay, withSpring(1, { damping: 11, stiffness: 190, mass: 0.7 }));
    fade.value = withDelay(
      delay,
      withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }),
    );
  }, [delay, fade, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { scale: 1 + (1 - progress.value) * 0.3 },
      { translateY: (1 - progress.value) * -10 },
    ],
  }));

  return (
    <AnimatedView style={animatedStyle} className="mr-2">
      <Typography.Heading type="h2" className={cn('text-3xl leading-9', className)}>
        {word}
      </Typography.Heading>
    </AnimatedView>
  );
}
