import { Select, Separator, Typography } from 'heroui-native';
import { Fragment, useMemo } from 'react';
import { View } from 'react-native';

import { LANGUAGES, useLanguageStore, useT, type LanguageCode } from '@/lib/i18n';

interface LanguagePickerProps {
  onChange?: (language: LanguageCode) => void;
  showHint?: boolean;
}

const CODES = new Set<string>(LANGUAGES.map((entry) => entry.code));

function isLanguageCode(value: string): value is LanguageCode {
  return CODES.has(value);
}

/** Language dropdown used on the sign-in screen and in Profile. */
export function LanguagePicker({ onChange, showHint = false }: LanguagePickerProps) {
  const t = useT();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const selected = useMemo(() => {
    const entry = LANGUAGES.find((item) => item.code === language) ?? LANGUAGES[0];
    return { value: entry.code, label: entry.label };
  }, [language]);

  return (
    <View className="gap-2">
      <Typography.Paragraph type="body-sm" color="muted">
        {t('language.label')}
      </Typography.Paragraph>

      <Select
        value={selected}
        onValueChange={(option) => {
          const next = Array.isArray(option) ? option[0] : option;
          if (!next || !isLanguageCode(next.value)) return;
          setLanguage(next.value);
          onChange?.(next.value);
        }}
      >
        <Select.Trigger>
          <Select.Value placeholder={t('language.label')} />
          <Select.TriggerIndicator />
        </Select.Trigger>
        <Select.Portal>
          <Select.Overlay />
          <Select.Content presentation="popover" width="trigger">
            {LANGUAGES.map((entry, index) => (
              <Fragment key={entry.code}>
                <Select.Item value={entry.code} label={entry.label} />
                {index < LANGUAGES.length - 1 ? <Separator /> : null}
              </Fragment>
            ))}
          </Select.Content>
        </Select.Portal>
      </Select>

      {showHint ? (
        <Typography.Paragraph type="body-sm" color="muted">
          {t('language.hint')}
        </Typography.Paragraph>
      ) : null}
    </View>
  );
}
