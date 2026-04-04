/**
 * SFX Generator for WORLDCOLIDE
 * Generates retro-style game sound effects as WAV files using raw audio synthesis.
 * No dependencies required — runs with plain Node.js.
 *
 * Usage: node scripts/generate-sfx.mjs
 * Then convert to ogg: ffmpeg -i file.wav -c:a libvorbis -q:a 4 file.ogg
 */
import { writeFileSync } from 'fs';
import { join } from 'path';

const SAMPLE_RATE = 44100;
const OUT_DIR = join(import.meta.dirname, '..', 'public', 'audio');

// ── Utility functions ──────────────────────────────────────────────

function createBuffer(durationSec) {
  const length = Math.floor(SAMPLE_RATE * durationSec);
  return new Float32Array(length);
}

function mixInto(target, source, volume = 1.0, offset = 0) {
  for (let i = 0; i < source.length && (i + offset) < target.length; i++) {
    target[i + offset] += source[i] * volume;
  }
}

/** Sine wave oscillator */
function sine(freq, duration, amplitude = 1.0) {
  const buf = createBuffer(duration);
  for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE) * amplitude;
  }
  return buf;
}

/** Square wave oscillator */
function square(freq, duration, amplitude = 1.0) {
  const buf = createBuffer(duration);
  for (let i = 0; i < buf.length; i++) {
    buf[i] = (Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE) > 0 ? 1 : -1) * amplitude;
  }
  return buf;
}

/** White noise */
function noise(duration, amplitude = 1.0) {
  const buf = createBuffer(duration);
  for (let i = 0; i < buf.length; i++) {
    buf[i] = (Math.random() * 2 - 1) * amplitude;
  }
  return buf;
}

/** Apply ADSR envelope */
function applyEnvelope(buf, attack, decay, sustain, release) {
  const a = Math.floor(attack * SAMPLE_RATE);
  const d = Math.floor(decay * SAMPLE_RATE);
  const r = Math.floor(release * SAMPLE_RATE);
  const sustainEnd = buf.length - r;

  for (let i = 0; i < buf.length; i++) {
    let env;
    if (i < a) {
      env = i / a; // attack ramp
    } else if (i < a + d) {
      env = 1.0 - (1.0 - sustain) * ((i - a) / d); // decay
    } else if (i < sustainEnd) {
      env = sustain;
    } else {
      env = sustain * (1.0 - (i - sustainEnd) / r); // release
    }
    buf[i] *= Math.max(0, env);
  }
  return buf;
}

/** Exponential decay */
function expDecay(buf, decayRate = 5.0) {
  for (let i = 0; i < buf.length; i++) {
    buf[i] *= Math.exp(-decayRate * i / buf.length);
  }
  return buf;
}

/** Pitch sweep (linearly changes frequency over time) */
function pitchSweep(startFreq, endFreq, duration, amplitude = 1.0, waveform = 'sine') {
  const buf = createBuffer(duration);
  let phase = 0;
  for (let i = 0; i < buf.length; i++) {
    const t = i / buf.length;
    const freq = startFreq + (endFreq - startFreq) * t;
    phase += 2 * Math.PI * freq / SAMPLE_RATE;
    const sample = waveform === 'square'
      ? (Math.sin(phase) > 0 ? 1 : -1)
      : Math.sin(phase);
    buf[i] = sample * amplitude;
  }
  return buf;
}

/** Bandpass-filtered noise */
function filteredNoise(duration, centerFreq, bandwidth, amplitude = 1.0) {
  const raw = noise(duration, amplitude);
  // Simple resonant bandpass via biquad coefficients
  const Q = centerFreq / bandwidth;
  const w0 = 2 * Math.PI * centerFreq / SAMPLE_RATE;
  const alpha = Math.sin(w0) / (2 * Q);
  const b0 = alpha, b1 = 0, b2 = -alpha;
  const a0 = 1 + alpha, a1 = -2 * Math.cos(w0), a2 = 1 - alpha;

  const out = createBuffer(duration);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < raw.length; i++) {
    const x0 = raw[i];
    out[i] = (b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x0; y2 = y1; y1 = out[i];
  }
  return out;
}

/** Normalize buffer to -1..1 range */
function normalize(buf) {
  let max = 0;
  for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
  if (max > 0) for (let i = 0; i < buf.length; i++) buf[i] /= max;
  return buf;
}

/** Clamp buffer values */
function clamp(buf) {
  for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.max(-1, Math.min(1, buf[i]));
  }
  return buf;
}

/** Write WAV file (16-bit PCM mono) */
function writeWav(filename, buffer) {
  clamp(buffer);
  const numSamples = buffer.length;
  const byteRate = SAMPLE_RATE * 2; // 16-bit mono
  const dataSize = numSamples * 2;
  const fileSize = 44 + dataSize;

  const wav = Buffer.alloc(fileSize);
  // RIFF header
  wav.write('RIFF', 0);
  wav.writeUInt32LE(fileSize - 8, 4);
  wav.write('WAVE', 8);
  // fmt chunk
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16); // chunk size
  wav.writeUInt16LE(1, 20);  // PCM
  wav.writeUInt16LE(1, 22);  // mono
  wav.writeUInt32LE(SAMPLE_RATE, 24);
  wav.writeUInt32LE(byteRate, 28);
  wav.writeUInt16LE(2, 32);  // block align
  wav.writeUInt16LE(16, 34); // bits per sample
  // data chunk
  wav.write('data', 36);
  wav.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    wav.writeInt16LE(Math.floor(s * 32767), 44 + i * 2);
  }

  const path = join(OUT_DIR, filename);
  writeFileSync(path, wav);
  console.log(`  ✓ ${filename} (${(dataSize / 1024).toFixed(0)}KB, ${(numSamples / SAMPLE_RATE).toFixed(2)}s)`);
}

// ── SFX Generators ─────────────────────────────────────────────────

/** sfx-click: Short wooden tap (0.1s) */
function genClick() {
  const buf = createBuffer(0.12);
  // Wooden tap — short sine burst with fast decay
  const tap = sine(1200, 0.12, 0.8);
  expDecay(tap, 40);
  mixInto(buf, tap);
  // Add a subtle knock
  const knock = sine(800, 0.08, 0.4);
  expDecay(knock, 50);
  mixInto(buf, knock);
  return normalize(buf);
}

/** sfx-dispatch: Ascending 3-note fanfare (1.0s) */
function genDispatch() {
  const buf = createBuffer(1.0);
  const notes = [523, 659, 784]; // C5, E5, G5 — major triad ascending
  for (let n = 0; n < notes.length; n++) {
    const offset = Math.floor(n * 0.2 * SAMPLE_RATE);
    // Trumpet-like: mix of sine + square
    const note = sine(notes[n], 0.35, 0.5);
    const harm = square(notes[n], 0.35, 0.15);
    applyEnvelope(note, 0.02, 0.05, 0.7, 0.15);
    applyEnvelope(harm, 0.02, 0.05, 0.5, 0.15);
    mixInto(buf, note, 1.0, offset);
    mixInto(buf, harm, 1.0, offset);
  }
  // Sparkle on final note
  const sparkle = sine(2500, 0.3, 0.2);
  expDecay(sparkle, 6);
  mixInto(buf, sparkle, 1.0, Math.floor(0.45 * SAMPLE_RATE));
  return normalize(buf);
}

/** sfx-reward: Coin cascade + chime (0.8s) */
function genReward() {
  const buf = createBuffer(0.85);
  // Coin pings — rapid metallic taps
  const coinFreqs = [3200, 2800, 3400, 3000];
  for (let c = 0; c < coinFreqs.length; c++) {
    const offset = Math.floor(c * 0.06 * SAMPLE_RATE);
    const ping = sine(coinFreqs[c], 0.15, 0.5);
    expDecay(ping, 15);
    mixInto(buf, ping, 1.0, offset);
  }
  // Warm chime underneath
  const chime = sine(880, 0.4, 0.6);
  applyEnvelope(chime, 0.01, 0.1, 0.5, 0.2);
  mixInto(buf, chime);
  // High sparkle tail
  const sparkle = sine(4500, 0.4, 0.15);
  expDecay(sparkle, 5);
  mixInto(buf, sparkle, 1.0, Math.floor(0.3 * SAMPLE_RATE));
  return normalize(buf);
}

/** sfx-levelup: Ascending arpeggio + chord resolve (1.8s) */
function genLevelUp() {
  const buf = createBuffer(1.8);
  // Harp arpeggio: C5 → E5 → G5 → C6
  const arpNotes = [523, 659, 784, 1047];
  for (let n = 0; n < arpNotes.length; n++) {
    const offset = Math.floor(n * 0.13 * SAMPLE_RATE);
    const note = sine(arpNotes[n], 0.4, 0.6);
    expDecay(note, 4);
    mixInto(buf, note, 1.0, offset);
  }
  // Warm chord resolve at peak
  const chordStart = Math.floor(0.55 * SAMPLE_RATE);
  const root = sine(523, 0.8, 0.4);
  const third = sine(659, 0.8, 0.3);
  const fifth = sine(784, 0.8, 0.3);
  applyEnvelope(root, 0.02, 0.1, 0.6, 0.4);
  applyEnvelope(third, 0.02, 0.1, 0.5, 0.4);
  applyEnvelope(fifth, 0.02, 0.1, 0.5, 0.4);
  mixInto(buf, root, 1.0, chordStart);
  mixInto(buf, third, 1.0, chordStart);
  mixInto(buf, fifth, 1.0, chordStart);
  // Sparkle shower
  for (let i = 0; i < 8; i++) {
    const freq = 3000 + Math.random() * 3000;
    const offset = chordStart + Math.floor(i * 0.08 * SAMPLE_RATE);
    const s = sine(freq, 0.2, 0.15);
    expDecay(s, 8);
    mixInto(buf, s, 1.0, offset);
  }
  // Deep bass grounding
  const bass = sine(262, 0.5, 0.3);
  applyEnvelope(bass, 0.02, 0.1, 0.4, 0.3);
  mixInto(buf, bass, 1.0, chordStart);
  return normalize(buf);
}

/** sfx-hit: Melee impact thud (0.25s) */
function genHit() {
  const buf = createBuffer(0.25);
  // Deep thud
  const thud = pitchSweep(300, 80, 0.15, 0.9);
  expDecay(thud, 12);
  mixInto(buf, thud);
  // Mid knock
  const knock = sine(600, 0.08, 0.5);
  expDecay(knock, 25);
  mixInto(buf, knock);
  // Subtle noise transient
  const impact = noise(0.04, 0.3);
  expDecay(impact, 30);
  mixInto(buf, impact);
  return normalize(buf);
}

/** sfx-crit: Slash + heavy impact (0.4s) */
function genCrit() {
  const buf = createBuffer(0.45);
  // Sharp slash — high freq noise sweep
  const slash = filteredNoise(0.1, 4000, 2000, 0.7);
  expDecay(slash, 15);
  mixInto(buf, slash);
  // Heavy impact (deeper than normal hit)
  const impact = pitchSweep(400, 60, 0.2, 1.0);
  expDecay(impact, 10);
  mixInto(buf, impact, 1.0, Math.floor(0.03 * SAMPLE_RATE));
  // Metallic ring
  const ring = sine(1800, 0.3, 0.3);
  expDecay(ring, 6);
  mixInto(buf, ring, 1.0, Math.floor(0.05 * SAMPLE_RATE));
  // Sub-bass accent
  const sub = sine(50, 0.08, 0.5);
  expDecay(sub, 20);
  mixInto(buf, sub, 1.0, Math.floor(0.03 * SAMPLE_RATE));
  return normalize(buf);
}

/** sfx-dodge: Whoosh sweep (0.4s) */
function genDodge() {
  const buf = createBuffer(0.4);
  // Bandpass-filtered noise whoosh with frequency sweep
  const segments = 8;
  for (let s = 0; s < segments; s++) {
    const t = s / segments;
    const centerFreq = 800 + 2200 * t; // sweep 800→3000 Hz
    const segDur = 0.4 / segments;
    const seg = filteredNoise(segDur, centerFreq, 600, 0.8);
    const offset = Math.floor(s * segDur * SAMPLE_RATE);
    mixInto(buf, seg, 1.0, offset);
  }
  // Volume envelope: quick rise, sustain, medium decay
  applyEnvelope(buf, 0.03, 0.05, 0.7, 0.2);
  // Cloth flutter at tail
  const flutter = filteredNoise(0.1, 2000, 1000, 0.15);
  expDecay(flutter, 8);
  mixInto(buf, flutter, 1.0, Math.floor(0.25 * SAMPLE_RATE));
  return normalize(buf);
}

/** sfx-death: Collapse + clatter (0.7s) */
function genDeath() {
  const buf = createBuffer(0.7);
  // Body thud
  const thud = pitchSweep(250, 60, 0.15, 0.8);
  expDecay(thud, 8);
  mixInto(buf, thud);
  // Descending rumble
  const rumble = pitchSweep(400, 100, 0.4, 0.5);
  applyEnvelope(rumble, 0.03, 0.1, 0.4, 0.2);
  mixInto(buf, rumble);
  // Metal clatter (2-3 taps)
  const clatFreqs = [1200, 900, 1400];
  for (let c = 0; c < clatFreqs.length; c++) {
    const offset = Math.floor((0.1 + c * 0.08) * SAMPLE_RATE);
    const clat = sine(clatFreqs[c], 0.1, 0.3);
    expDecay(clat, 18);
    mixInto(buf, clat, 1.0, offset);
  }
  // Dust settling noise at tail
  const dust = noise(0.2, 0.08);
  expDecay(dust, 5);
  mixInto(buf, dust, 1.0, Math.floor(0.4 * SAMPLE_RATE));
  return normalize(buf);
}

/** sfx-skill: Energy charge + magical release (0.7s) */
function genSkill() {
  const buf = createBuffer(0.7);
  // Charge-up: ascending shimmer
  const charge = pitchSweep(400, 1200, 0.18, 0.6);
  applyEnvelope(charge, 0.0, 0.0, 1.0, 0.02);
  mixInto(buf, charge);
  // Release burst: warm resonant bell
  const releaseOffset = Math.floor(0.18 * SAMPLE_RATE);
  const bell = sine(880, 0.35, 0.7);
  const bellHarm = sine(1760, 0.25, 0.3);
  expDecay(bell, 4);
  expDecay(bellHarm, 6);
  mixInto(buf, bell, 1.0, releaseOffset);
  mixInto(buf, bellHarm, 1.0, releaseOffset);
  // Sparkle particles post-release
  for (let i = 0; i < 6; i++) {
    const freq = 2000 + Math.random() * 4000;
    const offset = releaseOffset + Math.floor((0.05 + i * 0.06) * SAMPLE_RATE);
    const spark = sine(freq, 0.12, 0.2);
    expDecay(spark, 10);
    mixInto(buf, spark, 1.0, offset);
  }
  // Sub-bass pulse on release
  const bass = sine(80, 0.15, 0.4);
  expDecay(bass, 10);
  mixInto(buf, bass, 1.0, releaseOffset);
  return normalize(buf);
}

/** sfx-recruit: Door thud + welcoming chime (1.2s) */
function genRecruit() {
  const buf = createBuffer(1.2);
  // Door thud / footstep
  const thud = pitchSweep(200, 100, 0.1, 0.5);
  expDecay(thud, 15);
  mixInto(buf, thud);
  // 3-note welcoming chime: G4 → C4 → E4 (descending 5th→root, up to 3rd)
  const chimeNotes = [784, 523, 659]; // G5→C5→E5
  for (let n = 0; n < chimeNotes.length; n++) {
    const offset = Math.floor((0.15 + n * 0.2) * SAMPLE_RATE);
    const note = sine(chimeNotes[n], 0.4, 0.6);
    expDecay(note, 3.5);
    mixInto(buf, note, 1.0, offset);
    // Harmonic layer
    const harm = sine(chimeNotes[n] * 2, 0.25, 0.15);
    expDecay(harm, 5);
    mixInto(buf, harm, 1.0, offset);
  }
  // Warm string pad
  const pad = sine(262, 0.8, 0.15);
  applyEnvelope(pad, 0.1, 0.1, 0.6, 0.3);
  mixInto(buf, pad, 1.0, Math.floor(0.15 * SAMPLE_RATE));
  return normalize(buf);
}

// ── Main ───────────────────────────────────────────────────────────

console.log('Generating SFX for WORLDCOLIDE...\n');

const sfxMap = {
  'sfx-click.wav': genClick,
  'sfx-dispatch.wav': genDispatch,
  'sfx-reward.wav': genReward,
  'sfx-levelup.wav': genLevelUp,
  'sfx-hit.wav': genHit,
  'sfx-crit.wav': genCrit,
  'sfx-dodge.wav': genDodge,
  'sfx-death.wav': genDeath,
  'sfx-skill.wav': genSkill,
  'sfx-recruit.wav': genRecruit,
};

for (const [filename, generator] of Object.entries(sfxMap)) {
  writeWav(filename, generator());
}

console.log('\n✓ All WAV files generated in public/audio/');
console.log('  Next: convert to .ogg with ffmpeg');
