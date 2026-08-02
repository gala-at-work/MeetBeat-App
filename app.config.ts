import type { ConfigContext, ExpoConfig } from '@expo/config';

type ExpoPlugins = NonNullable<ExpoConfig['plugins']>;

export default ({ config }: ConfigContext): ExpoConfig => {
  const nativePlugins: ExpoPlugins =
    process.env.EXPO_PLATFORM === 'native'
      ? [
          ['expo-dev-client', { launchMode: 'most-recent' }],
          'react-native-maps',
          [
            'expo-camera',
            { cameraPermission: 'MeetBeat uses the camera to scan attendee badges at events.' },
          ],
          [
            'expo-speech-recognition',
            {
              microphonePermission:
                'MeetBeat listens while you answer interview questions out loud.',
              speechRecognitionPermission:
                'MeetBeat turns your spoken answers into networking signals.',
            },
          ],
          'expo-localization',
          'expo-audio',
        ]
      : [];

  return {
    ...config,
    name: 'MeetBeat',
    slug: 'meetbeat',
    newArchEnabled: true,
    icon: './assets/meetbeat-logo.png',
    version: process.env.BILT_APP_VERSION ?? '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    scheme: 'meetbeat',
    runtimeVersion: {
      policy: 'appVersion',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      supportsTablet: true,
      bundleIdentifier: process.env.BILT_IOS_BUNDLE_ID ?? 'com.yourcompany.yourapp',
    },
    android: {
      package: process.env.BILT_ANDROID_PACKAGE ?? 'com.yourcompany.yourapp',
    },
    web: {
      bundler: 'metro',
      // 'single' = SPA export: one index.html + client routing, so edge serving
      // needs only a single 404→index.html fallback rule.
      output: 'single',
      favicon: './public/icons/icon-192.png',
    },
    extra: {
      appStoreAppId: process.env.BILT_APP_STORE_APP_ID,
    },
    plugins: [
      'expo-router',
      'expo-font',
      [
        'expo-splash-screen',
        {
          image: './assets/meetbeat-logo.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#07080d',
        },
      ],
      ...nativePlugins,
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
