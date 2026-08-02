import { router } from 'expo-router';
import { Button, Card, Chip, Separator, Spinner, Typography } from 'heroui-native';
import { useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { GradientPanel } from '@/components/GradientPanel';
import { ImpactText } from '@/components/ImpactText';
import { Reveal } from '@/components/Reveal';
import { useNetworkingDna } from '@/lib/ai';
import { useT } from '@/lib/i18n';
import { INTERVIEW_QUESTIONS } from '@/lib/extract';
import { useProfileStore } from '@/lib/store';
import { playImpactSting } from '@/lib/sting';
import { goalMeta, ROLE_LABEL, STAGE_LABEL } from '@/lib/taxonomy';
import { onHero } from '@/lib/theme';

export default function NetworkingDnaScreen() {
  const t = useT();
  const profile = useProfileStore((state) => state.profile);
  const dna = useNetworkingDna(profile);
  const soundPlayed = useRef(false);

  // The archetype landing is the moment on this screen, so it gets the bang.
  useEffect(() => {
    if (!dna || soundPlayed.current) return;
    soundPlayed.current = true;
    playImpactSting();
  }, [dna]);

  if (!profile) return null;
  const signals = profile.signals;

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="px-5 pb-10 pt-4 gap-5">
      <View className="gap-1">
        <ImpactText text={t('dna.title')} className="text-2xl leading-8" stagger={90} />
        <Typography.Paragraph type="body-sm" color="muted" className="leading-5">
          {t('dna.subtitle')}
        </Typography.Paragraph>
      </View>

      <Reveal>
        <GradientPanel className="gap-5 rounded-3xl p-5">
          <View className="flex-row items-center gap-4">
            <Avatar name={profile.name} seed={profile.id} size={56} ring="light" />
            <View className="flex-1 gap-0.5">
              <Typography.Paragraph className="font-semibold text-white">
                {profile.name}
              </Typography.Paragraph>
              <Typography.Paragraph type="body-sm" className="text-hero-ink-muted leading-5">
                {profile.headline}
              </Typography.Paragraph>
              <Typography.Paragraph type="body-sm" className="text-hero-ink-muted">
                {ROLE_LABEL[profile.role]} · {profile.company} · {profile.location}
              </Typography.Paragraph>
            </View>
          </View>

          {dna ? (
            <View className="gap-3">
              <View className="flex-row items-center gap-2">
                <Typography.Paragraph type="body-sm" className="text-hero-ink-muted flex-1">
                  {t('dna.archetype')}
                </Typography.Paragraph>
                {dna.loading ? <Spinner size="sm" /> : null}
                <View
                  className="rounded-full px-3 py-1"
                  style={{ backgroundColor: onHero.fill, borderWidth: 1, borderColor: onHero.line }}
                >
                  <Typography.Paragraph type="body-sm" className="text-hero-ink-muted">
                    {dna.source === 'ai' ? t('ai.byModel') : t('ai.byDemo')}
                  </Typography.Paragraph>
                </View>
              </View>

              <ImpactText
                key={dna.value.archetype}
                text={dna.value.archetype}
                className="text-white"
              />
              <Reveal delay={260}>
                <Typography.Paragraph className="text-hero-ink leading-6">
                  {dna.value.summary}
                </Typography.Paragraph>
              </Reveal>

              {dna.value.traits.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {dna.value.traits.map((trait) => (
                    <View
                      key={trait}
                      className="rounded-full px-3 py-1"
                      style={{
                        backgroundColor: onHero.fill,
                        borderWidth: 1,
                        borderColor: onHero.line,
                      }}
                    >
                      <Typography.Paragraph type="body-sm" className="text-hero-ink">
                        {trait}
                      </Typography.Paragraph>
                    </View>
                  ))}
                </View>
              ) : null}

              <Typography.Paragraph type="body-sm" className="text-hero-ink-muted">
                {t('dna.confidence', { value: Math.round(dna.value.confidence * 100) })}
              </Typography.Paragraph>
            </View>
          ) : null}
        </GradientPanel>
      </Reveal>

      <Card className="rounded-3xl">
        <Card.Body className="gap-4 p-5">
          <View className="gap-2">
            <Typography.Paragraph type="body-sm" color="muted">
              {t('dna.seeking')}
            </Typography.Paragraph>
            <View className="flex-row flex-wrap gap-2">
              {signals.seeking.map((goal) => (
                <Chip key={`seek-${goal}`} size="sm" variant="soft" color="accent">
                  {goalMeta(goal).seekLabel}
                </Chip>
              ))}
            </View>
          </View>
          <Separator />
          <View className="gap-2">
            <Typography.Paragraph type="body-sm" color="muted">
              {t('dna.offering')}
            </Typography.Paragraph>
            <View className="flex-row flex-wrap gap-2">
              {signals.offering.map((goal) => (
                <Chip key={`offer-${goal}`} size="sm" variant="soft" color="success">
                  {goalMeta(goal).giveLabel}
                </Chip>
              ))}
            </View>
          </View>
        </Card.Body>
      </Card>

      <Card className="rounded-3xl">
        <Card.Body className="gap-3 p-5">
          <View className="flex-row flex-wrap gap-2">
            <Chip size="sm" variant="soft" color="accent">
              {STAGE_LABEL[signals.stage]}
            </Chip>
            {[...signals.skills, ...signals.industries, ...signals.interests].map((tag) => (
              <Chip key={tag} size="sm" variant="tertiary" color="default">
                {tag}
              </Chip>
            ))}
          </View>
          <Separator />
          <View className="gap-1">
            <Typography.Paragraph type="body-sm" color="muted">
              {t('dna.ask')}
            </Typography.Paragraph>
            <Typography.Paragraph>
              {signals.ask.length > 0 ? signals.ask : '—'}
            </Typography.Paragraph>
          </View>
          <View className="gap-1">
            <Typography.Paragraph type="body-sm" color="muted">
              {t('dna.give')}
            </Typography.Paragraph>
            <Typography.Paragraph>
              {signals.give.length > 0 ? signals.give : '—'}
            </Typography.Paragraph>
          </View>
        </Card.Body>
      </Card>

      <Card className="rounded-3xl">
        <Card.Body className="gap-3 p-5">
          <Typography.Paragraph className="font-semibold">{t('dna.answers')}</Typography.Paragraph>
          {INTERVIEW_QUESTIONS.map((question) => {
            const answer = profile.interviewAnswers[question.id]?.trim() ?? '';
            if (answer.length === 0) return null;
            return (
              <View key={question.id} className="gap-1">
                <Typography.Paragraph type="body-sm" color="muted">
                  {question.prompt}
                </Typography.Paragraph>
                <Typography.Paragraph>{answer}</Typography.Paragraph>
              </View>
            );
          })}
        </Card.Body>
      </Card>

      <Button onPress={() => router.push('/events')}>
        <Button.Label>{t('dna.continue')}</Button.Label>
      </Button>
    </ScrollView>
  );
}
