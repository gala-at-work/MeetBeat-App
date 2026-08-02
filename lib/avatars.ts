import type { ImageSourcePropType } from 'react-native';

/**
 * Illustrated cast for the demo.
 *
 * Six flat cartoon portraits stand in for the seeded cohort so the room reads
 * as people rather than initials. Nothing in the matching engine looks at these
 * — they are presentation only.
 */
const AV1 = require('@/assets/avatars/av1.png');
const AV2 = require('@/assets/avatars/av2.png');
const AV3 = require('@/assets/avatars/av3.png');
const AV4 = require('@/assets/avatars/av4.png');
const AV5 = require('@/assets/avatars/av5.png');
const AV6 = require('@/assets/avatars/av6.png');

const CAST_A: ImageSourcePropType[] = [AV1, AV3, AV5];
const CAST_B: ImageSourcePropType[] = [AV2, AV4, AV6];

/**
 * First names in the seeded cohort that read as feminine. Used only to pick a
 * portrait that does not fight the name on the card.
 */
const CAST_A_NAMES = new Set([
  'aiko',
  'amara',
  'ananya',
  'camille',
  'clara',
  'divya',
  'elin',
  'emma',
  'greta',
  'hannah',
  'ines',
  'isabel',
  'ishita',
  'julia',
  'leila',
  'lena',
  'meera',
  'mira',
  'nadia',
  'neha',
  'nora',
  'priya',
  'sana',
  'sara',
  'sarah',
  'sofia',
  'zara',
]);

function hash(seed: string): number {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 31 + seed.charCodeAt(index)) % 100000;
  }
  return value;
}

/** Deterministic cartoon portrait for a person. */
export function avatarImage(name: string, seed?: string): ImageSourcePropType {
  const first = name.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  const cast = CAST_A_NAMES.has(first) ? CAST_A : CAST_B;
  return cast[hash(seed ?? name) % cast.length] ?? AV1;
}
