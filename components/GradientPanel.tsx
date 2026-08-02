import type { ReactNode } from 'react';

import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { heroGradient } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface GradientPanelProps {
  children: ReactNode;
  className?: string;
  colors?: readonly [string, string, ...string[]];
}

/** Brand gradient slab used for screen heroes. */
export function GradientPanel({ children, className, colors = heroGradient }: GradientPanelProps) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={cn('overflow-hidden', className)}
    >
      {children}
    </LinearGradient>
  );
}
