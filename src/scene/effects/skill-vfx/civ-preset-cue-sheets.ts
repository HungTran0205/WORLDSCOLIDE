/**
 * Cheap cue sheets for the 11 non-Pierce Linh Sơn skills.
 *
 * Each sheet fires a single themed particle preset at the connect frame
 * (330ms), replacing the default gen-hit for skills with a more on-theme effect.
 * These are data-only; no mesh, shake, or hitstop — low-risk routing.
 *
 * Pierce is handled separately by pierce-cue-sheet.ts (full sequence).
 */

import type { SkillCueSheet } from './cue-sheet-types';

const AT_CONNECT = 330; // matches COMBAT_IMPACT_DELAY_S * 1000

export const CIV_PRESET_CUE_SHEETS: SkillCueSheet[] = [
  // ── Templar ──────────────────────────────────────────────────────────────
  // Cleave, Riposte, Rally have full dedicated cue sheets (cleave/riposte/rally-cue-sheet.ts).

  // ── Forester ──────────────────────────────────────────────────────────────
  { skillId: 'sunder',  cues: [{ atMs: AT_CONNECT, type: 'particles', presetId: 'ls-earth-slam',    count: 22 }] },
  { skillId: 'quake',   cues: [{ atMs: AT_CONNECT, type: 'particles', presetId: 'ls-earth-slam',    count: 28 }] },
  { skillId: 'bulwark', cues: [{ atMs: AT_CONNECT, type: 'particles', presetId: 'ls-smoke',         count: 18 }] },
  { skillId: 'aegis',   cues: [{ atMs: AT_CONNECT, type: 'particles', presetId: 'ls-heal',          count: 16 }] },

  // ── Ranger ───────────────────────────────────────────────────────────────
  { skillId: 'snipe',   cues: [{ atMs: AT_CONNECT, type: 'particles', presetId: 'gen-hit',          count: 24 }] },
  { skillId: 'barrage', cues: [{ atMs: AT_CONNECT, type: 'particles', presetId: 'gen-burst',        count: 20 }] },
  { skillId: 'pin',     cues: [{ atMs: AT_CONNECT, type: 'particles', presetId: 'gen-trail',        count: 16 }] },
  { skillId: 'mark',    cues: [{ atMs: AT_CONNECT, type: 'particles', presetId: 'ls-blessing-dust', count: 28 }] },
];
