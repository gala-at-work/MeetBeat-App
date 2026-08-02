import { Platform } from 'react-native';

/**
 * MeetBeat's two synthesised cues.
 *
 * `playBrandSting` is the splash "ta-dum": a low thud, then a rising blue-note
 * chord. `playImpactSting` is the short, dry bang used when a result lands, like
 * the networking DNA reveal.
 *
 * Both are generated from a waveform function rather than shipped as audio
 * files — on the web the samples go straight into a Web Audio buffer, on native
 * they are written once into a cached WAV and handed to expo-audio.
 *
 * Playback is best effort. Browsers block audio until the page has been
 * interacted with, and Expo Go may lack the audio module, so every failure is
 * swallowed: the screen is silent rather than broken.
 */

const SAMPLE_RATE = 22050;
const TAU = Math.PI * 2;

/** Percussive envelope: near-instant attack, exponential tail. */
function envelope(t: number, tau: number): number {
  if (t < 0) return 0;
  return (1 - Math.exp(-t / 0.006)) * Math.exp(-t / tau);
}

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

/** One mono sample of the brand sting, in [-1, 1], at time `t` seconds. */
function stingSample(t: number): number {
  const thud =
    envelope(t, 0.17) * (Math.sin(TAU * 73.42 * t) * 0.58 + Math.sin(TAU * 146.83 * t) * 0.28);

  const c = t - 0.4;
  const chord =
    envelope(c, 0.58) *
    (Math.sin(TAU * 146.83 * c) * 0.32 +
      Math.sin(TAU * 220 * c) * 0.18 +
      Math.sin(TAU * 293.66 * c) * 0.3 +
      Math.sin(TAU * 587.33 * c) * 0.07);

  return clamp((thud + chord) * 0.84);
}

/**
 * One mono sample of the impact, in [-1, 1]. A bright transient over a boom that
 * slides down in pitch, plus a short bell overtone so it reads as deliberate
 * rather than as a glitch.
 */
function impactSample(t: number): number {
  const boomFreq = 64 - 20 * Math.min(1, t / 0.45);
  const boom =
    envelope(t, 0.3) *
    (Math.sin(TAU * boomFreq * t) * 0.6 + Math.sin(TAU * boomFreq * 2 * t) * 0.16);

  const transient = Math.exp(-t / 0.03) * (Math.sin(t * 21301) * 0.2 + Math.sin(t * 7919) * 0.12);

  const bell =
    envelope(t, 0.19) * (Math.sin(TAU * 880 * t) * 0.09 + Math.sin(TAU * 1174.66 * t) * 0.05);

  return clamp((boom + transient + bell) * 0.92);
}

interface Cue {
  name: string;
  sampler: (t: number) => number;
  duration: number;
  volume: number;
}

const BRAND_STING: Cue = {
  name: 'meetbeat-sting',
  sampler: stingSample,
  duration: 2.1,
  volume: 0.85,
};

const IMPACT: Cue = { name: 'meetbeat-impact', sampler: impactSample, duration: 1.2, volume: 0.7 };

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const b0 = bytes[index];
    const b1 = bytes[index + 1];
    const b2 = bytes[index + 2];
    out += B64_ALPHABET[b0 >> 2];
    out += B64_ALPHABET[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out += b1 === undefined ? '=' : B64_ALPHABET[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    out += b2 === undefined ? '=' : B64_ALPHABET[b2 & 63];
  }
  return out;
}

/** 16-bit mono PCM WAV of one cue, base64 encoded. */
function wavBase64(cue: Cue): string {
  const frames = Math.round(SAMPLE_RATE * cue.duration);
  const dataBytes = frames * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  const ascii = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };

  ascii(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  ascii(36, 'data');
  view.setUint32(40, dataBytes, true);

  for (let index = 0; index < frames; index += 1) {
    const value = Math.round(cue.sampler(index / SAMPLE_RATE) * 32000);
    view.setInt16(44 + index * 2, value, true);
  }

  return toBase64(new Uint8Array(buffer));
}

interface WebAudioWindow {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

async function playWeb(cue: Cue): Promise<void> {
  const scope = window as Window & WebAudioWindow;
  const Ctor = scope.AudioContext ?? scope.webkitAudioContext;
  if (!Ctor) return;

  const ctx = new Ctor();
  if (ctx.state === 'suspended') await ctx.resume();

  const frames = Math.round(SAMPLE_RATE * cue.duration);
  const buffer = ctx.createBuffer(1, frames, SAMPLE_RATE);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < frames; index += 1) {
    channel[index] = cue.sampler(index / SAMPLE_RATE);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = cue.volume;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.addEventListener('ended', () => {
    void ctx.close();
  });
  source.start();
}

const nativeUris = new Map<string, string>();

async function playNative(cue: Cue): Promise<void> {
  const [audio, fs] = await Promise.all([import('expo-audio'), import('expo-file-system/legacy')]);

  let uri = nativeUris.get(cue.name);
  if (uri === undefined) {
    const target = `${fs.cacheDirectory ?? ''}${cue.name}.wav`;
    const info = await fs.getInfoAsync(target);
    if (!info.exists) {
      await fs.writeAsStringAsync(target, wavBase64(cue), { encoding: 'base64' });
    }
    uri = target;
    nativeUris.set(cue.name, uri);
  }

  const player = audio.createAudioPlayer({ uri });
  player.volume = cue.volume;
  player.play();
  setTimeout(
    () => {
      try {
        player.remove();
      } catch {
        // Player already released.
      }
    },
    Math.round(cue.duration * 1000) + 1100,
  );
}

function play(cue: Cue): void {
  void (async () => {
    try {
      if (Platform.OS === 'web') {
        await playWeb(cue);
      } else {
        await playNative(cue);
      }
    } catch {
      // Autoplay blocked, or no audio module on this runtime. Stay silent.
    }
  })();
}

export function playBrandSting(): void {
  play(BRAND_STING);
}

/** Short bang for a result landing on screen. */
export function playImpactSting(): void {
  play(IMPACT);
}
