import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { LogoTile } from '@/components/Logo';
import { MascotHero } from '@/components/Mascot';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { consumeSplash } from '@/lib/splash';
import { playBrandSting } from '@/lib/sting';
import { splashGradient, ui } from '@/lib/theme';

/** How long the splash holds once it has rendered. */
const HOLD_MS = 3000;

/**
 * Brand splash. Shown once ahead of a new sign-in: the lockup resolves in the
 * centre with a blue pulse and the brand sting, the guide walks on underneath,
 * then the launch screen takes over. Tapping skips it.
 */
export default function SplashScreen() {
  const { width, height } = useWindowDimensions();
  const done = useRef(false);

  const enter = useSharedValue(0);
  const pulse = useSharedValue(0);
  const progress = useSharedValue(0);

  const leave = useCallback(() => {
    if (done.current) return;
    done.current = true;
    consumeSplash();
    router.replace('/welcome');
  }, []);

  useEffect(() => {
    enter.value = withSequence(
      withTiming(1.06, { duration: 520, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 260, easing: Easing.inOut(Easing.quad) }),
    );
    pulse.value = withDelay(
      420,
      withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false),
    );
    progress.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear });

    playBrandSting();

    const timer = setTimeout(leave, HOLD_MS);
    return () => clearTimeout(timer);
  }, [enter, leave, progress, pulse]);

  const tileStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, enter.value * 1.3),
    transform: [{ scale: 0.72 + Math.min(enter.value, 1.06) * 0.28 }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - pulse.value) * 0.4,
    transform: [{ scale: 0.85 + pulse.value * 0.75 }],
  }));

  const ringLateStyle = useAnimatedStyle(() => {
    const shifted = (pulse.value + 0.5) % 1;
    return {
      opacity: (1 - shifted) * 0.26,
      transform: [{ scale: 0.85 + shifted * 0.75 }],
    };
  });

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const tile = Math.min(184, Math.round(width * 0.46));
  const mascot = Math.min(248, Math.round(Math.min(width * 0.62, height * 0.32)));

  return (
    <>
      <StatusBar style="light" />
      <Pressable onPress={leave} accessibilityRole="button" className="flex-1">
        <LinearGradient
          colors={splashGradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          className="flex-1"
        >
          <View className="flex-1 items-center justify-center gap-9">
            <View
              className="items-center justify-center"
              style={{ width: tile * 1.9, height: tile * 1.9 }}
            >
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: tile * 1.55,
                    height: tile * 1.55,
                    borderRadius: tile,
                    borderWidth: 1.5,
                    borderColor: ui.accent,
                  },
                  ringStyle,
                ]}
              />
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: tile * 1.55,
                    height: tile * 1.55,
                    borderRadius: tile,
                    borderWidth: 1,
                    borderColor: ui.accent,
                  },
                  ringLateStyle,
                ]}
              />
              <Animated.View style={tileStyle}>
                <LogoTile size={tile} />
              </Animated.View>
            </View>

            <MascotHero size={mascot} delay={620} />
          </View>

          <View className="pb-safe-offset-10 items-center px-16">
            <View
              className="h-0.5 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.14)' }}
            >
              <Animated.View style={[{ height: '100%', backgroundColor: ui.accent }, barStyle]} />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </>
  );
}
