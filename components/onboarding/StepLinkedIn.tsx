import { Button, Card, Chip, Separator, Spinner, Surface, Typography } from 'heroui-native';
import { Check, FileText } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { ChipToggle } from '@/components/ChipToggle';
import { useT } from '@/lib/i18n';
import {
  LINKEDIN_FIELD_LABEL,
  type LinkedInField,
  type LinkedInImport,
  SAMPLE_LINKEDIN_FILES,
} from '@/lib/linkedin';
import { goalMeta } from '@/lib/taxonomy';
import { brandColor, positiveColor } from '@/lib/theme';
import type { ProfileDraft } from '@/lib/types';

interface StepLinkedInProps {
  draft: ProfileDraft;
  onChange: (patch: Partial<ProfileDraft>) => void;
}

const ALL_FIELDS: LinkedInField[] = ['identity', 'skills', 'industries', 'goals', 'interests'];

function union<T>(a: T[], b: T[]): T[] {
  return [...new Set([...a, ...b])];
}

export function StepLinkedIn({ draft, onChange }: StepLinkedInProps) {
  const t = useT();
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<LinkedInImport | null>(null);
  const [accepted, setAccepted] = useState<LinkedInField[]>(ALL_FIELDS);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const startParse = (file: LinkedInImport) => {
    setParsing(true);
    setParsed(null);
    timer.current = setTimeout(() => {
      setParsed(file);
      setParsing(false);
    }, 1200);
  };

  const apply = () => {
    if (!parsed) return;
    const patch: Partial<ProfileDraft> = { linkedinImported: true };

    if (accepted.includes('identity')) {
      patch.name = parsed.fullName;
      patch.headline = parsed.headline;
      patch.company = parsed.company;
      patch.role = parsed.role;
      patch.location = parsed.location;
    }
    if (accepted.includes('skills')) patch.skills = union(draft.skills, parsed.skills);
    if (accepted.includes('industries')) {
      patch.industries = union(draft.industries, parsed.industries);
    }
    if (accepted.includes('goals')) {
      patch.seeking = union(draft.seeking, parsed.seeking);
      patch.offering = union(draft.offering, parsed.offering);
    }
    if (accepted.includes('interests')) patch.interests = union(draft.interests, parsed.interests);

    onChange(patch);
  };

  return (
    <View className="gap-6">
      <View className="gap-1">
        <Typography.Heading type="h2">{t('linkedin.title')}</Typography.Heading>
        <Typography.Paragraph color="muted">{t('linkedin.subtitle')}</Typography.Paragraph>
      </View>

      {draft.linkedinImported ? (
        <Surface variant="secondary" className="flex-row items-center gap-3 rounded-2xl p-4">
          <Check size={18} color={positiveColor} />
          <Typography.Paragraph className="flex-1">{t('linkedin.imported')}</Typography.Paragraph>
        </Surface>
      ) : null}

      {!parsed && !parsing ? (
        <View className="gap-3">
          {SAMPLE_LINKEDIN_FILES.map((file) => (
            <Card key={file.fileName}>
              <Card.Body className="flex-row items-center gap-3">
                <FileText size={20} color={brandColor.electric} />
                <View className="flex-1">
                  <Typography.Paragraph className="font-medium">
                    {file.fileName}
                  </Typography.Paragraph>
                  <Typography.Paragraph type="body-sm" color="muted">
                    {file.fileSize} · PDF
                  </Typography.Paragraph>
                </View>
                <Button size="sm" variant="secondary" onPress={() => startParse(file)}>
                  <Button.Label>{t('linkedin.import')}</Button.Label>
                </Button>
              </Card.Body>
            </Card>
          ))}
          <Typography.Paragraph type="body-sm" color="muted">
            {t('linkedin.samplesHint')}
          </Typography.Paragraph>
        </View>
      ) : null}

      {parsing ? (
        <Surface variant="secondary" className="items-center gap-3 rounded-2xl p-6">
          <Spinner />
          <Typography.Paragraph color="muted">{t('linkedin.reading')}</Typography.Paragraph>
        </Surface>
      ) : null}

      {parsed ? (
        <View className="gap-4">
          <Surface variant="secondary" className="gap-2 rounded-2xl p-4">
            <View className="flex-row items-center gap-2">
              <Typography.Paragraph className="flex-1 font-semibold">
                {parsed.fullName}
              </Typography.Paragraph>
              <Chip size="sm" variant="soft" color="accent">
                {t('linkedin.confidence', { value: Math.round(parsed.confidence * 100) })}
              </Chip>
            </View>
            <Typography.Paragraph type="body-sm" color="muted">
              {parsed.headline} · {parsed.location}
            </Typography.Paragraph>
            <Separator className="my-1" />
            {parsed.experience.map((role) => (
              <View key={`${role.org}-${role.period}`} className="gap-0.5">
                <Typography.Paragraph type="body-sm" className="font-medium">
                  {role.title} · {role.org}
                </Typography.Paragraph>
                <Typography.Paragraph type="body-sm" color="muted">
                  {role.period} — {role.note}
                </Typography.Paragraph>
              </View>
            ))}
          </Surface>

          <View className="gap-3">
            <Typography.Paragraph className="font-semibold">
              {t('linkedin.keep')}
            </Typography.Paragraph>
            {ALL_FIELDS.map((field) => {
              const values =
                field === 'identity'
                  ? [parsed.fullName, parsed.company, parsed.location]
                  : field === 'skills'
                    ? parsed.skills
                    : field === 'industries'
                      ? parsed.industries
                      : field === 'goals'
                        ? [
                            ...parsed.seeking.map((goal) => goalMeta(goal).seekLabel),
                            ...parsed.offering.map((goal) => goalMeta(goal).giveLabel),
                          ]
                        : parsed.interests;

              return (
                <Surface key={field} variant="secondary" className="gap-2 rounded-2xl p-3">
                  <View className="flex-row items-center gap-2">
                    <Typography.Paragraph className="flex-1 font-medium">
                      {LINKEDIN_FIELD_LABEL[field]}
                    </Typography.Paragraph>
                    <ChipToggle
                      label={
                        accepted.includes(field) ? t('linkedin.keeping') : t('linkedin.skipped')
                      }
                      selected={accepted.includes(field)}
                      onToggle={() =>
                        setAccepted((current) =>
                          current.includes(field)
                            ? current.filter((item) => item !== field)
                            : [...current, field],
                        )
                      }
                    />
                  </View>
                  <Typography.Paragraph type="body-sm" color="muted">
                    {values.join(' · ')}
                  </Typography.Paragraph>
                </Surface>
              );
            })}
          </View>

          <View className="flex-row gap-3">
            <Button className="flex-1" onPress={apply}>
              <Button.Label>{t('linkedin.apply')}</Button.Label>
            </Button>
            <Button variant="ghost" onPress={() => setParsed(null)}>
              <Button.Label>{t('linkedin.discard')}</Button.Label>
            </Button>
          </View>
        </View>
      ) : null}
    </View>
  );
}
