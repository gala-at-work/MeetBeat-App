import { Card, Chip, PressableFeedback, Typography } from 'heroui-native';
import { ArrowUpRight, Check } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Reveal } from '@/components/Reveal';
import { ScoreDial } from '@/components/ScoreDial';
import { useT } from '@/lib/i18n';
import { openMatch } from '@/lib/nav';
import { topReasons } from '@/lib/matching';
import { matchColor, matchSoft, matchTier, scoreTier, tierColor } from '@/lib/theme';
import type { Match } from '@/lib/types';

interface MatchCardProps {
  match: Match;
  rank: number;
  connected?: boolean;
}

export function MatchCard({ match, rank, connected = false }: MatchCardProps) {
  const t = useT();
  const person = match.person;
  const reasons = topReasons(match, 2);
  const tier = scoreTier(match.score);
  const tint = matchColor[matchTier(match.score)];
  const soft = matchSoft[matchTier(match.score)];

  return (
    <Reveal delay={Math.min(rank - 1, 6) * 45} className="mb-3">
      <PressableFeedback
        onPress={() => openMatch(person.id)}
        accessibilityRole="button"
        accessibilityLabel={`${person.name}, opportunity score ${match.score}`}
      >
        <Card className="rounded-3xl">
          <Card.Body className="gap-3.5 p-4">
            <View className="flex-row items-center gap-3.5">
              <View>
                <Avatar
                  name={person.name}
                  seed={person.id}
                  size={52}
                  ring="tier"
                  score={match.score}
                />
                <View
                  className="absolute -bottom-0.5 -left-1 h-5 w-5 items-center justify-center rounded-full border-2 border-white"
                  style={{ backgroundColor: tint }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}
                  >
                    {rank}
                  </Text>
                </View>
              </View>

              <View className="flex-1 gap-0.5">
                <Typography.Paragraph className="font-semibold" numberOfLines={1}>
                  {person.name}
                </Typography.Paragraph>
                <Typography.Paragraph type="body-sm" color="muted" numberOfLines={1}>
                  {person.headline}
                </Typography.Paragraph>
                <Typography.Paragraph type="body-sm" color="muted" numberOfLines={1}>
                  {person.location}
                </Typography.Paragraph>
              </View>

              <ScoreDial score={match.score} size={54} strokeWidth={5} />
            </View>

            <View className="gap-2 rounded-2xl p-3" style={{ backgroundColor: soft }}>
              {reasons.map((reason) => (
                <View key={reason.component} className="flex-row gap-2.5">
                  <View
                    className="mt-1.5 h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: tint }}
                  />
                  <Typography.Paragraph type="body-sm" className="flex-1 leading-5">
                    {reason.detail}
                  </Typography.Paragraph>
                </View>
              ))}
            </View>

            <View className="flex-row items-center gap-2">
              <Chip size="sm" variant="soft" color="accent">
                {t(`tier.${tier}`)}
              </Chip>{' '}
              {match.mutual ? (
                <Chip size="sm" variant="soft" color="success">
                  {t('match.mutual')}
                </Chip>
              ) : null}
              {connected ? (
                <Chip size="sm" variant="soft" color="success">
                  <View className="flex-row items-center gap-1">
                    <Check size={12} color={matchColor.high} />
                    <Typography.Paragraph type="body-sm">
                      {t('connection.title')}
                    </Typography.Paragraph>
                  </View>
                </Chip>
              ) : null}
              <View className="flex-1" />
              <ArrowUpRight size={16} color={tierColor.fair} />
            </View>
          </Card.Body>
        </Card>
      </PressableFeedback>
    </Reveal>
  );
}
