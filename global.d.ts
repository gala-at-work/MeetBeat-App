declare module '*.css';

declare module 'react-native-qrcode-svg' {
  import type { ComponentType } from 'react';

  export interface QRCodeProps {
    value: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    quietZone?: number;
    ecl?: 'L' | 'M' | 'Q' | 'H';
    enableLinearGradient?: boolean;
    linearGradient?: string[];
    gradientDirection?: string[];
    onError?: (error: unknown) => void;
  }

  const QRCode: ComponentType<QRCodeProps>;
  export default QRCode;
}
