import { Howl, Howler } from 'howler';

const sounds: Record<string, Howl> = {};
let bgmKey: string | null = null;

/** Initialize all audio assets — call after first user interaction */
export function initAudio() {
  // BGM
  sounds['bgm-guild'] = new Howl({
    src: ['/audio/bgm-guild.ogg', '/audio/bgm-guild.m4a'],
    loop: true, volume: 0.3,
  });
  sounds['bgm-combat'] = new Howl({
    src: ['/audio/bgm-combat.ogg', '/audio/bgm-combat.m4a'],
    loop: true, volume: 0.3,
  });

  // SFX — existing
  sounds['sfx-click'] = new Howl({ src: ['/audio/sfx-click.ogg', '/audio/sfx-click.m4a'], volume: 0.5 });
  sounds['sfx-dispatch'] = new Howl({ src: ['/audio/sfx-dispatch.ogg', '/audio/sfx-dispatch.m4a'], volume: 0.5 });
  sounds['sfx-reward'] = new Howl({ src: ['/audio/sfx-reward.ogg', '/audio/sfx-reward.m4a'], volume: 0.6 });
  sounds['sfx-levelup'] = new Howl({ src: ['/audio/sfx-levelup.ogg', '/audio/sfx-levelup.m4a'], volume: 0.7 });
  sounds['sfx-hit'] = new Howl({ src: ['/audio/sfx-hit.ogg', '/audio/sfx-hit.m4a'], volume: 0.4 });

  // SFX — new
  sounds['sfx-crit'] = new Howl({ src: ['/audio/sfx-crit.ogg', '/audio/sfx-crit.m4a'], volume: 0.5 });
  sounds['sfx-dodge'] = new Howl({ src: ['/audio/sfx-dodge.ogg', '/audio/sfx-dodge.m4a'], volume: 0.4 });
  sounds['sfx-death'] = new Howl({ src: ['/audio/sfx-death.ogg', '/audio/sfx-death.m4a'], volume: 0.5 });
  sounds['sfx-skill'] = new Howl({ src: ['/audio/sfx-skill.ogg', '/audio/sfx-skill.m4a'], volume: 0.5 });
  sounds['sfx-recruit'] = new Howl({ src: ['/audio/sfx-recruit.ogg', '/audio/sfx-recruit.m4a'], volume: 0.6 });
}

export function playBGM(key: string) {
  if (bgmKey === key) return; // already playing
  if (bgmKey) stopBGM();
  sounds[key]?.play();
  bgmKey = key;
}

export function stopBGM() {
  if (bgmKey && sounds[bgmKey]) {
    sounds[bgmKey].stop();
    bgmKey = null;
  }
}

export function playSFX(key: string) {
  sounds[key]?.play();
}

export function setMusicVolume(vol: number) {
  if (bgmKey && sounds[bgmKey]) sounds[bgmKey].volume(vol);
}

export function setSFXVolume(vol: number) {
  Object.entries(sounds).forEach(([key, howl]) => {
    if (!key.startsWith('bgm-')) howl.volume(vol);
  });
}

export function setMute(muted: boolean) {
  Howler.mute(muted);
}
