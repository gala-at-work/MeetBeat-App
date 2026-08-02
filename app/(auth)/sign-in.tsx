import { Redirect } from 'expo-router';
import {
  Button,
  Card,
  Input,
  Label,
  PressableFeedback,
  Surface,
  TextField,
  Typography,
} from 'heroui-native';
import { UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { ConsentCheck } from '@/components/ConsentCheck';
import { GradientPanel } from '@/components/GradientPanel';
import { HeaderBack } from '@/components/HeaderBack';
import { LanguagePicker } from '@/components/LanguagePicker';
import { LogoRow } from '@/components/Logo';
import { Reveal } from '@/components/Reveal';
import { signIn, useAuthStore } from '@/lib/auth';
import { signInAsDemo } from '@/lib/demo';
import { useT } from '@/lib/i18n';
import { onHero, ui } from '@/lib/theme';
import { cn } from '@/lib/utils';

type Mode = 'signIn' | 'signUp';

/**
 * Sign in or sign up. There is no account to verify: a well-formed email and any
 * password open a local session, so the demo never waits on a code. Guest entry
 * sits on the same screen for a one-tap demo.
 */
export default function SignInScreen() {
  const t = useT();
  const status = useAuthStore((state) => state.status);

  const [mode, setMode] = useState<Mode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const consented = useAuthStore((state) => state.consented);

  if (status === 'signedIn') return <Redirect href="/" />;

  const signingUp = mode === 'signUp';

  /** Terms acceptance gates every way in, including guest entry. */
  const consentOk = () => {
    if (consented) return true;
    setBlocked(true);
    setError(t('auth.consentRequired'));
    return false;
  };

  const submit = () => {
    if (signingUp && name.trim().length < 2) {
      setError(t('auth.nameRequired'));
      return;
    }
    const address = email.trim();
    if (!address.includes('@') || address.length < 3) {
      setError(t('auth.emailInvalid'));
      return;
    }
    if (password.trim().length === 0) {
      setError(t('auth.passwordRequired'));
      return;
    }
    if (!consentOk()) return;
    setError(null);
    setBlocked(false);
    signIn(address, signingUp ? name : undefined);
  };

  return (
    <View className="bg-canvas flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <GradientPanel className="pt-safe-offset-4 gap-4 rounded-b-3xl px-5 pb-6">
          <View className="flex-row items-center gap-3">
            <LogoRow size={20} tone="light" />
            <View className="flex-1" />
            <HeaderBack fallback="/welcome" variant="hero" />
          </View>
          <View className="gap-1.5">
            <Typography.Heading type="h2" className="text-2xl text-white">
              {signingUp ? t('auth.signUpTitle') : t('auth.signInTitle')}
            </Typography.Heading>
            <Typography.Paragraph type="body-sm" className="text-hero-ink-muted leading-5">
              {signingUp ? t('auth.signUpSubtitle') : t('auth.subtitle')}
            </Typography.Paragraph>
          </View>

          <View
            className="flex-row gap-1 rounded-full p-1"
            style={{
              backgroundColor: 'rgba(4, 8, 20, 0.45)',
              borderWidth: 1,
              borderColor: onHero.line,
            }}
          >
            <ModeTab
              label={t('auth.modeSignIn')}
              active={!signingUp}
              onPress={() => {
                setMode('signIn');
                setError(null);
              }}
            />
            <ModeTab
              label={t('auth.modeSignUp')}
              active={signingUp}
              onPress={() => {
                setMode('signUp');
                setError(null);
              }}
            />
          </View>
        </GradientPanel>

        <View className="pb-safe-offset-4 flex-1 justify-between gap-4 px-5 pt-5">
          <Reveal className="gap-3">
            <Card className="rounded-3xl">
              <Card.Body className="gap-4 p-5">
                {signingUp ? (
                  <TextField>
                    <Label>{t('auth.name')}</Label>
                    <Input
                      placeholder={t('auth.namePlaceholder')}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      autoComplete="name"
                    />
                  </TextField>
                ) : null}

                <TextField>
                  <Label>{t('auth.email')}</Label>
                  <Input
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                  />
                </TextField>

                <TextField>
                  <Label>{t('auth.password')}</Label>
                  <Input
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    secureTextEntry
                    onSubmitEditing={submit}
                  />
                </TextField>

                <ConsentCheck
                  detail
                  invalid={blocked}
                  onChange={(value) => {
                    if (!value) return;
                    setBlocked(false);
                    setError((current) => (current === t('auth.consentRequired') ? null : current));
                  }}
                />

                {error ? (
                  <Surface variant="secondary" className="rounded-2xl p-3">
                    <Typography.Paragraph type="body-sm" className="leading-5">
                      {error}
                    </Typography.Paragraph>
                  </Surface>
                ) : null}

                <Button onPress={submit}>
                  <Button.Label>
                    {signingUp ? t('auth.createAccount') : t('auth.signIn')}
                  </Button.Label>
                </Button>
              </Card.Body>
            </Card>

            <View className="flex-row items-center gap-3">
              <View className="bg-hairline h-px flex-1" />
              <Typography.Paragraph type="body-sm" color="muted">
                {t('auth.or')}
              </Typography.Paragraph>
              <View className="bg-hairline h-px flex-1" />
            </View>

            <Button
              variant="secondary"
              onPress={() => {
                if (!consentOk()) return;
                signInAsDemo();
              }}
            >
              <UserRound size={16} color={ui.text} />
              <Button.Label>{t('auth.guest')}</Button.Label>
            </Button>
          </Reveal>

          <LanguagePicker />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function ModeTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressableFeedback
      accessibilityRole="button"
      onPress={onPress}
      className="flex-1 items-center rounded-full py-2"
      style={active ? { backgroundColor: 'rgba(255, 255, 255, 0.92)' } : undefined}
    >
      <Typography.Paragraph
        type="body-sm"
        className={cn('font-semibold', active ? 'text-navy' : 'text-hero-ink-muted')}
      >
        {label}
      </Typography.Paragraph>
    </PressableFeedback>
  );
}
