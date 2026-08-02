import { Chip } from 'heroui-native';

interface ChipToggleProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
}

/** Selectable taxonomy chip used across onboarding and profile editing. */
export function ChipToggle({ label, selected, onToggle, size = 'sm' }: ChipToggleProps) {
  return (
    <Chip
      size={size}
      variant={selected ? 'primary' : 'tertiary'}
      color={selected ? 'accent' : 'default'}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {label}
    </Chip>
  );
}
