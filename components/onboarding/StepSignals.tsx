import { Input, Label, Separator, TextField, Typography } from 'heroui-native';
import { View } from 'react-native';

import { ChipToggle } from '@/components/ChipToggle';
import { QuestionHeading } from '@/components/QuestionHeading';
import { useT } from '@/lib/i18n';
import { GOALS, INDUSTRIES, INTERESTS, SKILLS, STAGES, STAGE_LABEL } from '@/lib/taxonomy';
import type { GoalId, ProfileDraft } from '@/lib/types';

interface StepSignalsProps {
  draft: ProfileDraft;
  onChange: (patch: Partial<ProfileDraft>) => void;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function StepSignals({ draft, onChange }: StepSignalsProps) {
  const t = useT();

  return (
    <View className="gap-6">
      <View className="gap-1">
        <Typography.Heading type="h2">{t('signals.title')}</Typography.Heading>
        <Typography.Paragraph color="muted">{t('signals.subtitle')}</Typography.Paragraph>
      </View>

      <View className="gap-3">
        <QuestionHeading question={t('signals.seeking')} circled={false} />
        <View className="flex-row flex-wrap gap-2">
          {GOALS.map((goal) => (
            <ChipToggle
              key={`seek-${goal.id}`}
              label={goal.seekLabel}
              selected={draft.seeking.includes(goal.id)}
              onToggle={() => onChange({ seeking: toggle<GoalId>(draft.seeking, goal.id) })}
            />
          ))}
        </View>
      </View>

      <View className="gap-3">
        <QuestionHeading question={t('signals.offering')} circled={false} />
        <View className="flex-row flex-wrap gap-2">
          {GOALS.map((goal) => (
            <ChipToggle
              key={`offer-${goal.id}`}
              label={goal.giveLabel}
              selected={draft.offering.includes(goal.id)}
              onToggle={() => onChange({ offering: toggle<GoalId>(draft.offering, goal.id) })}
            />
          ))}
        </View>
      </View>

      <Separator />

      <View className="gap-2">
        <Label>{t('signals.skills')}</Label>
        <View className="flex-row flex-wrap gap-2">
          {SKILLS.map((skill) => (
            <ChipToggle
              key={skill}
              label={skill}
              selected={draft.skills.includes(skill)}
              onToggle={() => onChange({ skills: toggle(draft.skills, skill) })}
            />
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Label>{t('signals.industries')}</Label>
        <View className="flex-row flex-wrap gap-2">
          {INDUSTRIES.map((industry) => (
            <ChipToggle
              key={industry}
              label={industry}
              selected={draft.industries.includes(industry)}
              onToggle={() => onChange({ industries: toggle(draft.industries, industry) })}
            />
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Label>{t('signals.stage')}</Label>
        <View className="flex-row flex-wrap gap-2">
          {STAGES.map((stage) => (
            <ChipToggle
              key={stage}
              label={STAGE_LABEL[stage]}
              selected={draft.stage === stage}
              onToggle={() => onChange({ stage })}
            />
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Label>{t('signals.interests')}</Label>
        <View className="flex-row flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <ChipToggle
              key={interest}
              label={interest}
              selected={draft.interests.includes(interest)}
              onToggle={() => onChange({ interests: toggle(draft.interests, interest) })}
            />
          ))}
        </View>
      </View>

      <Separator />

      <TextField>
        <Label>{t('signals.ask')}</Label>
        <Input value={draft.ask} onChangeText={(ask) => onChange({ ask })} />
      </TextField>

      <TextField>
        <Label>{t('signals.give')}</Label>
        <Input value={draft.give} onChangeText={(give) => onChange({ give })} />
      </TextField>
    </View>
  );
}
