import { PressableFeedback } from 'heroui-native';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { Circle, Svg } from '@/components/ui/primitives/Svg';
import { matchColor, matchTier, onHero } from '@/lib/theme';

export interface RadarBlip {
  id: string;
  name: string;
  seed?: string;
  score: number;
}

interface OpportunityRadarProps {
  /** Ranked people. Only the first six are plotted. */
  blips: RadarBlip[];
  centerName: string;
  centerSeed?: string;
  size?: number;
  onPressBlip?: (id: string) => void;
}

/** Fixed angles keep plotted people from overlapping regardless of score. */
const ANGLES = [-80, -8, 64, 152, 224, 296];
const BLIP = 56;

/**
 * Higher score sits closer to the centre. Purely a metaphor, never location.
 *
 * The band is tuned to the range the ranked room actually produces — the curated
 * cohort lands in the eighties and nineties — so the top six stay visibly
 * separated instead of collapsing onto the innermost ring.
 */
function radiusFor(score: number, size: number): number {
  const t = Math.max(0, Math.min(1, (score - 68) / 32));
  return size * (0.4 - t * 0.24);
}

function PulseRing({ size, delay }: { size: number; delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2800, easing: Easing.out(Easing.quad) }), -1, false),
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - progress.value),
    transform: [{ scale: 0.28 + progress.value * 0.72 }],
  }));

  return (
    <AnimatedView
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: '#8ab6ff',
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Opportunity radar: concentric orbits with the strongest matches drawn nearest
 * the centre. Static rings still read fine if animation is reduced.
 */
export function OpportunityRadar({
  blips,
  centerName,
  centerSeed,
  size = 300,
  onPressBlip,
}: OpportunityRadarProps) {
  const center = size / 2;
  const plotted = blips.slice(0, ANGLES.length);

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {[0.4, 0.28, 0.16].map((factor) => (
          <Circle
            key={factor}
            cx={center}
            cy={center}
            r={size * factor}
            stroke={onHero.line}
            strokeWidth={1}
            strokeDasharray="3 6"
            fill="none"
          />
        ))}
        <Circle cx={center} cy={center} r={size * 0.16} fill={onHero.fill} />
      </Svg>

      <PulseRing size={size * 0.9} delay={0} />
      <PulseRing size={size * 0.9} delay={1400} />

      <Avatar name={centerName} seed={centerSeed} size={54} ring="light" />

      {plotted.map((blip, index) => {
        const angle = ((ANGLES[index] ?? 0) * Math.PI) / 180;
        const radius = radiusFor(blip.score, size);
        const tint = matchColor[matchTier(blip.score)];

        return (
          <View
            key={blip.id}
            style={{
              position: 'absolute',
              width: BLIP,
              left: center + radius * Math.cos(angle) - BLIP / 2,
              top: center + radius * Math.sin(angle) - BLIP / 2,
            }}
            className="items-center"
          >
            <PressableFeedback
              onPress={onPressBlip ? () => onPressBlip(blip.id) : undefined}
              accessibilityRole="button"
              accessibilityLabel={`${blip.name}, score ${blip.score}`}
              className="items-center gap-1"
            >
              <Avatar name={blip.name} seed={blip.seed ?? blip.id} size={40} ring="light" />
              <View
                className="rounded-full px-1.5 py-0.5"
                style={{ backgroundColor: onHero.primary }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ color: tint, fontSize: 10, fontWeight: '700' }}
                >
                  {Math.round(blip.score)}
                </Text>
              </View>
            </PressableFeedback>
          </View>
        );
      })}
    </View>
  );
}
