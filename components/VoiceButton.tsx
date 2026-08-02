import { Button, Typography } from 'heroui-native';
import { Mic, Square } from 'lucide-react-native';
import { View } from 'react-native';

import { useLanguageStore, useT } from '@/lib/i18n';
import { brandColor, tierColor } from '@/lib/theme';
import { useVoiceInput } from '@/lib/voice';

interface VoiceButtonProps {
  /** Called with each final transcript chunk. */
  onTranscript: (text: string) => void;
  /** Hide the explanatory line when several buttons share a screen. */
  compact?: boolean;
}

/**
 * Microphone control for spoken answers. Falls back to a clear message when the
 * platform has no speech recogniser instead of pretending to listen.
 */
export function VoiceButton({ onTranscript, compact = false }: VoiceButtonProps) {
  const t = useT();
  const language = useLanguageStore((state) => state.language);
  const { status, partial, start, stop } = useVoiceInput(language, onTranscript);

  const listening = status === 'listening';

  const note =
    status === 'unsupported'
      ? t('voice.unsupported')
      : status === 'denied'
        ? t('voice.denied')
        : status === 'failed'
          ? t('voice.failed')
          : listening
            ? t('voice.listening')
            : compact
              ? ''
              : t('voice.hint');

  return (
    <View className="gap-1.5">
      <View className="flex-row items-center gap-2">
        <Button
          size="sm"
          variant={listening ? 'primary' : 'secondary'}
          onPress={listening ? stop : start}
        >
          {listening ? (
            <Square size={14} color="#ffffff" />
          ) : (
            <Mic size={14} color={brandColor.electric} />
          )}
          <Button.Label>{listening ? t('voice.stop') : t('voice.speak')}</Button.Label>
        </Button>
        {note.length > 0 ? (
          <Typography.Paragraph
            type="body-sm"
            color="muted"
            className="flex-1"
            style={
              status === 'failed' || status === 'denied' ? { color: tierColor.fair } : undefined
            }
          >
            {note}
          </Typography.Paragraph>
        ) : null}
      </View>
      {partial.length > 0 ? (
        <Typography.Paragraph type="body-sm" className="text-accent" numberOfLines={2}>
          {partial}
        </Typography.Paragraph>
      ) : null}
    </View>
  );
}
