import { Input, Label, TextField, Typography } from 'heroui-native';
import { View } from 'react-native';

import { ChipToggle } from '@/components/ChipToggle';
import { useT } from '@/lib/i18n';
import { CITIES, ROLES, ROLE_LABEL } from '@/lib/taxonomy';
import type { ProfileDraft } from '@/lib/types';

interface StepIdentityProps {
  draft: ProfileDraft;
  onChange: (patch: Partial<ProfileDraft>) => void;
}

export function StepIdentity({ draft, onChange }: StepIdentityProps) {
  const t = useT();

  return (
    <View className="gap-6">
      <View className="gap-1">
        <Typography.Heading type="h2">{t('identity.title')}</Typography.Heading>
        <Typography.Paragraph color="muted">{t('identity.subtitle')}</Typography.Paragraph>
      </View>

      <TextField>
        <Label>{t('identity.name')}</Label>
        <Input
          placeholder={t('identity.namePlaceholder')}
          value={draft.name}
          onChangeText={(name) => onChange({ name })}
          autoCapitalize="words"
          autoComplete="name"
        />
      </TextField>

      <TextField>
        <Label>{t('identity.headline')}</Label>
        <Input
          placeholder={t('identity.headlinePlaceholder')}
          value={draft.headline}
          onChangeText={(headline) => onChange({ headline })}
        />
      </TextField>

      <TextField>
        <Label>{t('identity.company')}</Label>
        <Input
          placeholder={t('identity.companyPlaceholder')}
          value={draft.company}
          onChangeText={(company) => onChange({ company })}
        />
      </TextField>

      <View className="gap-2">
        <Label>{t('identity.role')}</Label>
        <View className="flex-row flex-wrap gap-2">
          {ROLES.map((role) => (
            <ChipToggle
              key={role}
              label={ROLE_LABEL[role]}
              selected={draft.role === role}
              onToggle={() => onChange({ role })}
            />
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Label>{t('identity.city')}</Label>
        <View className="flex-row flex-wrap gap-2">
          {CITIES.map((city) => (
            <ChipToggle
              key={city}
              label={city}
              selected={draft.location === city}
              onToggle={() => onChange({ location: city })}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
