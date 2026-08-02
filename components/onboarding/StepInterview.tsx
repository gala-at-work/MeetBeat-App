import { Chip, Surface, TextArea, TextField, Typography } from 'heroui-native';
import { Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';

import { VoiceButton } from '@/components/VoiceButton';
import { QuestionHeading } from '@/components/QuestionHeading';
import { extractSignals, INTERVIEW_QUESTIONS, signalLabel } from '@/lib/extract';
import { useT } from '@/lib/i18n';
import { brandColor } from '@/lib/theme';
import type { ProfileDraft } from '@/lib/types';

interface StepInterviewProps {
  draft: ProfileDraft;
  onAnswer: (questionId: string, text: string) => void;
}

/** Joins a new fragment onto an answer without doubling punctuation. */
function append(current: string, addition: string): string {
  const trimmed = current.trim();
  if (trimmed.length === 0) return addition;
  return /[.!?]$/.test(trimmed) ? `${trimmed} ${addition}` : `${trimmed}. ${addition}`;
}

export function StepInterview({ draft, onAnswer }: StepInterviewProps) {
  const t = useT();
  const extraction = useMemo(() => extractSignals(draft.answers), [draft.answers]);

  return (
    <View className="gap-6">
      <View className="gap-1">
        <Typography.Heading type="h2">{t('interview.title')}</Typography.Heading>
        <Typography.Paragraph color="muted">{t('interview.subtitle')}</Typography.Paragraph>
      </View>

      {INTERVIEW_QUESTIONS.map((question, index) => {
        const value = draft.answers[question.id] ?? '';

        return (
          <View key={question.id} className="gap-2">
            <QuestionHeading
              question={question.prompt}
              meta={t('interview.progress', {
                index: index + 1,
                total: INTERVIEW_QUESTIONS.length,
              })}
              helper={question.helper}
            />

            <TextField>
              <TextArea
                placeholder={question.placeholder}
                value={value}
                onChangeText={(text) => onAnswer(question.id, text)}
                numberOfLines={3}
              />
            </TextField>

            <VoiceButton
              compact={index > 0}
              onTranscript={(text) => onAnswer(question.id, append(value, text))}
            />

            <View className="flex-row flex-wrap gap-2">
              {question.chips.map((chip) => (
                <Chip
                  key={chip}
                  size="sm"
                  variant="tertiary"
                  color="default"
                  onPress={() => onAnswer(question.id, append(value, chip))}
                >
                  {chip}
                </Chip>
              ))}
            </View>
          </View>
        );
      })}

      <Surface variant="secondary" className="gap-3 rounded-2xl p-4">
        <View className="flex-row items-center gap-2">
          <Sparkles size={16} color={brandColor.electric} />
          <Typography.Paragraph className="font-semibold">
            {t('interview.signalsTitle')}
          </Typography.Paragraph>
          <View className="flex-1" />
          <Typography.Paragraph type="body-sm" color="muted">
            {extraction.signals.length}
          </Typography.Paragraph>
        </View>

        {extraction.signals.length === 0 ? (
          <Typography.Paragraph type="body-sm" color="muted">
            {t('interview.signalsEmpty')}
          </Typography.Paragraph>
        ) : (
          <View className="gap-2">
            {extraction.signals.slice(0, 12).map((signal) => (
              <View key={`${signal.kind}-${signal.value}`} className="gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Chip size="sm" variant="soft" color="accent">
                    {signalLabel(signal)}
                  </Chip>
                  <Typography.Paragraph type="body-sm" color="muted">
                    {signal.kind}
                  </Typography.Paragraph>
                </View>
                <Typography.Paragraph type="body-sm" color="muted" numberOfLines={1}>
                  {t('interview.evidence', { evidence: signal.evidence })}
                </Typography.Paragraph>
              </View>
            ))}
            {extraction.signals.length > 12 ? (
              <Typography.Paragraph type="body-sm" color="muted">
                {t('interview.more', { count: extraction.signals.length - 12 })}
              </Typography.Paragraph>
            ) : null}
          </View>
        )}
      </Surface>
    </View>
  );
}
