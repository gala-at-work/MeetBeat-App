import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, Surface, Typography } from 'heroui-native';
import { useState } from 'react';
import { View } from 'react-native';

export interface BadgeScannerProps {
  onScan: (value: string) => void;
}

/** Native QR badge scanner. Web gets the fallback in BadgeScanner.web.tsx. */
export function BadgeScanner({ onScan }: BadgeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);

  if (!permission) {
    return (
      <Surface variant="secondary" className="rounded-2xl p-4">
        <Typography.Paragraph color="muted">Preparing the camera…</Typography.Paragraph>
      </Surface>
    );
  }

  if (!permission.granted) {
    return (
      <Surface variant="secondary" className="gap-3 rounded-2xl p-4">
        <Typography.Paragraph>
          MeetBeat needs the camera to read badges. You can always use the simulated scan instead.
        </Typography.Paragraph>
        <Button variant="secondary" onPress={() => void requestPermission()}>
          <Button.Label>Allow camera</Button.Label>
        </Button>
      </Surface>
    );
  }

  return (
    <View className="border-border h-64 overflow-hidden rounded-2xl border">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (locked) return;
          setLocked(true);
          onScan(data);
          setTimeout(() => setLocked(false), 1500);
        }}
      />
    </View>
  );
}
