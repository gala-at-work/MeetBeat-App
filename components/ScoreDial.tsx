import { Text, View } from 'react-native';

import { Circle, Svg } from '@/components/ui/primitives/Svg';
import { matchColor, matchSoft, matchTier } from '@/lib/theme';

interface ScoreDialProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  /** `hero` drops the soft fill so the dial reads on the brand gradient. */
  tone?: 'default' | 'hero';
}

export function ScoreDial({
  score,
  size = 52,
  strokeWidth = 5,
  showLabel = true,
  tone = 'default',
}: ScoreDialProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const tier = matchTier(score);
  const color = matchColor[tier];
  const labelColor = tone === 'hero' ? '#ffffff' : color;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeOpacity={tone === 'hero' ? 0.32 : 0.16}
          strokeWidth={strokeWidth}
          fill={tone === 'hero' ? 'transparent' : matchSoft[tier]}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={tone === 'hero' ? '#ffffff' : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          fill="none"
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      {showLabel ? (
        <Text
          allowFontScaling={false}
          style={{
            color: labelColor,
            fontSize: Math.round(size * 0.34),
            fontWeight: '700',
            letterSpacing: -0.4,
          }}
        >
          {Math.round(score)}
        </Text>
      ) : null}
    </View>
  );
}
