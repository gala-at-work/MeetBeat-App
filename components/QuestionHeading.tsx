import { Typography } from 'heroui-native';
import { useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View } from 'react-native';

import { Path, Svg } from '@/components/ui/primitives/Svg';
import { brandColor } from '@/lib/theme';

interface QuestionHeadingProps {
  /** The question itself. A question mark is added when it is missing. */
  question: string;
  /** Small label above the question, e.g. the "2/5" counter. */
  meta?: string;
  /** Supporting line under the question. */
  helper?: string;
  /** Draw the hand-drawn marker loop around the question. Defaults to true. */
  circled?: boolean;
}

/** Questions always read as questions, even if the source copy forgot the mark. */
function withQuestionMark(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) return trimmed;
  if (/[?？]$/.test(trimmed)) return trimmed;
  return `${trimmed.replace(/[.:!]$/, '')}?`;
}

/**
 * Marker loop around the question: two thirds of a rough ellipse that overshoots
 * where it started, so it reads as hand-drawn rather than as a border.
 */
function loopPath(width: number, height: number): string {
  const cx = width / 2;
  const cy = height / 2;
  const rx = Math.max(8, width / 2 - 2);
  const ry = Math.max(8, height / 2 - 1);
  const p = (x: number, y: number) => `${(cx + rx * x).toFixed(1)} ${(cy + ry * y).toFixed(1)}`;

  return [
    `M ${p(0.97, -0.1)}`,
    `C ${p(1.02, 0.6)}, ${p(0.42, 1.0)}, ${p(-0.16, 0.96)}`,
    `C ${p(-0.84, 0.92)}, ${p(-1.02, 0.24)}, ${p(-0.95, -0.36)}`,
    `C ${p(-0.88, -0.98)}, ${p(-0.12, -1.02)}, ${p(0.46, -0.9)}`,
    `C ${p(0.94, -0.8)}, ${p(1.04, -0.24)}, ${p(0.86, 0.36)}`,
  ].join(' ');
}

/**
 * A question, visibly separated from the fields that answer it: larger type,
 * circled with a marker loop in the brand blue unless `circled` is false.
 */
export function QuestionHeading({ question, meta, helper, circled = true }: QuestionHeadingProps) {
  const [box, setBox] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((current) =>
      Math.abs(current.width - width) < 1 && Math.abs(current.height - height) < 1
        ? current
        : { width, height },
    );
  };

  return (
    <View className="gap-2">
      {meta ? (
        <Typography.Paragraph type="body-sm" color="muted" className="font-semibold uppercase">
          {meta}
        </Typography.Paragraph>
      ) : null}

      <View className="self-start">
        <View className={circled ? 'px-4 py-2.5' : ''} onLayout={circled ? onLayout : undefined}>
          <Typography.Heading type="h3" className="text-xl leading-7">
            {withQuestionMark(question)}
          </Typography.Heading>
        </View>

        {circled && box.width > 0 ? (
          <Svg
            width={box.width}
            height={box.height}
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, top: 0 }}
          >
            <Path
              d={loopPath(box.width, box.height)}
              stroke={brandColor.electric}
              strokeWidth={2}
              strokeLinecap="round"
              strokeOpacity={0.85}
              fill="none"
            />
          </Svg>
        ) : null}
      </View>

      {helper ? (
        <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
          {helper}
        </Typography.Paragraph>
      ) : null}
    </View>
  );
}
