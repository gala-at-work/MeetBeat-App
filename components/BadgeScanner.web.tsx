import { Surface, Typography } from 'heroui-native';

import type { BadgeScannerProps } from '@/components/BadgeScanner';

/**
 * Browsers in the demo preview cannot run the native barcode pipeline, so the
 * web build points people at the simulated scan instead.
 */
export function BadgeScanner(_props: BadgeScannerProps) {
  return (
    <Surface variant="secondary" className="gap-2 rounded-2xl p-4">
      <Typography.Paragraph className="font-medium">
        Camera scanning runs on device
      </Typography.Paragraph>
      <Typography.Paragraph type="body-sm" color="muted">
        Open MeetBeat on a phone to scan a real badge. In the browser, use the simulated scan below
        — it runs the exact same connection logic.
      </Typography.Paragraph>
    </Surface>
  );
}
