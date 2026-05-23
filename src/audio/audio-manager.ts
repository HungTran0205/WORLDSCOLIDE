import { Howl, Howler } from 'howler';
import { assetUrl } from '@/lib/asset-url';

const sounds: Record<string, Howl> = {};
let bgmKey: string | null = null;
let initialized = false;

/** User-configured music volume. Kept as the canonical fade target so that
 * crossfading mid-fade does not snapshot a transient volume value. */
let musicVolumeTarget = 0.3;

/** Pending fade-out stop timers, keyed by the Howl that is fading out.
 * A re-crossfade back to that key clears its pending stop so we do not
 * silence a Howl that has been promoted back to active mid-fade. */
const pendingStopTimers: Record<string, ReturnType<typeof setTimeout>> = {};

/** Initialize all audio assets — safe to call multiple times */
export function initAudio() {
  if (initialized) return;
  initialized = true;

  // BGM — bgm-title file may be missing pre-Phase-7-asset-source;
  // Howl silently fails on 404 so the title screen just renders without music.
  sounds['bgm-title'] = new Howl({
    src: ['/audio/bgm-title.ogg', '/audio/bgm-title.mp3'].map(assetUrl),
    loop: true, volume: 0.3,
  });
  sounds['bgm-guild'] = new Howl({
    src: ['/audio/bgm-guild.ogg', '/audio/bgm-guild.mp3'].map(assetUrl),
    loop: true, volume: 0.3,
  });
  sounds['bgm-combat'] = new Howl({
    src: ['/audio/bgm-combat.ogg', '/audio/bgm-combat.mp3'].map(assetUrl),
    loop: true, volume: 0.3,
  });

  // SFX
  sounds['sfx-click'] = new Howl({ src: ['/audio/sfx-click.ogg'].map(assetUrl), volume: 0.5 });
  sounds['sfx-dispatch'] = new Howl({ src: ['/audio/sfx-dispatch.ogg'].map(assetUrl), volume: 0.5 });
  sounds['sfx-reward'] = new Howl({ src: ['/audio/sfx-reward.ogg'].map(assetUrl), volume: 0.6 });
  sounds['sfx-levelup'] = new Howl({ src: ['/audio/sfx-levelup.ogg'].map(assetUrl), volume: 0.7 });
  sounds['sfx-hit'] = new Howl({ src: ['/audio/sfx-hit.ogg'].map(assetUrl), volume: 0.4 });
  sounds['sfx-crit'] = new Howl({ src: ['/audio/sfx-crit.ogg'].map(assetUrl), volume: 0.5 });
  sounds['sfx-dodge'] = new Howl({ src: ['/audio/sfx-dodge.ogg'].map(assetUrl), volume: 0.4 });
  sounds['sfx-death'] = new Howl({ src: ['/audio/sfx-death.ogg'].map(assetUrl), volume: 0.5 });
  sounds['sfx-skill'] = new Howl({ src: ['/audio/sfx-skill.ogg'].map(assetUrl), volume: 0.5 });
  sounds['sfx-recruit'] = new Howl({ src: ['/audio/sfx-recruit.ogg'].map(assetUrl), volume: 0.6 });
}

export function playBGM(key: string) {
  if (bgmKey === key) return;
  // Stop ALL bgm tracks to prevent overlapping
  for (const [k, howl] of Object.entries(sounds)) {
    if (k.startsWith('bgm-')) howl.stop();
  }
  bgmKey = null;
  sounds[key]?.play();
  bgmKey = key;
}

/**
 * Crossfade from current BGM (if any) to `key` over `durationMs`.
 * No-op when target is already active. Skips silently when target Howl is unregistered.
 *
 * Race-safe: cancels any pending stop-timer for the destination key (a rapid
 * A→B→A within a fade window would otherwise have B's stop-timer kill the
 * revived A). Volume target reads from `musicVolumeTarget` (the user setting),
 * not from the Howl's transient volume which may be mid-fade.
 *
 * Browser autoplay note: if invoked before any user gesture, Howler queues the
 * play() and the fade animates against a not-yet-playing source. On the user's
 * first gesture `Howler.autoUnlock` (default on) flushes the queue. For the
 * splash→title transition prefer `playBGM` over crossfade — there is no prior
 * BGM to fade out and the simpler API plays cleanly post-unlock.
 */
export function crossfadeBGM(key: string, durationMs = 1500) {
  if (bgmKey === key) return;
  const next = sounds[key];
  if (!next) return;

  // Reclaim destination if it is mid-fade-out from a prior crossfade.
  if (pendingStopTimers[key]) {
    clearTimeout(pendingStopTimers[key]);
    delete pendingStopTimers[key];
  }

  // Fade out the previous BGM and schedule its stop after the fade completes.
  if (bgmKey && sounds[bgmKey]) {
    const prevKey = bgmKey;
    const prev = sounds[prevKey];
    prev.fade(prev.volume(), 0, durationMs);
    pendingStopTimers[prevKey] = setTimeout(() => {
      prev.stop();
      delete pendingStopTimers[prevKey];
    }, durationMs);
  }

  next.volume(0);
  next.play();
  next.fade(0, musicVolumeTarget, durationMs);
  bgmKey = key;
}

export function stopBGM() {
  for (const [k, howl] of Object.entries(sounds)) {
    if (k.startsWith('bgm-')) howl.stop();
  }
  bgmKey = null;
}

export function playSFX(key: string) {
  sounds[key]?.play();
}

export function setMusicVolume(vol: number) {
  // Persist as the canonical fade target so subsequent crossfades land on the
  // user's chosen volume, not the Howl-init default.
  musicVolumeTarget = vol;
  // Apply to every BGM track (not just the active one) so switches between
  // bgm-guild / bgm-combat / bgm-title respect the user's setting without
  // each track reverting to its hardcoded Howl-init volume.
  Object.entries(sounds).forEach(([key, howl]) => {
    if (key.startsWith('bgm-')) howl.volume(vol);
  });
}

export function setSFXVolume(vol: number) {
  Object.entries(sounds).forEach(([key, howl]) => {
    if (!key.startsWith('bgm-')) howl.volume(vol);
  });
}

export function setMute(muted: boolean) {
  Howler.mute(muted);
}
