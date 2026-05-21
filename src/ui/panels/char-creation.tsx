/**
 * Character creation — game-style SPLIT-HERO wizard.
 * Left: a large live CharacterPreview pinned across every step.
 * Right: a per-step choice panel (Civilization → Class → Mask → Identity).
 * Navigation via Back/Continue + a clickable step rail (completed steps go back).
 * Parent handles save + navigation via onComplete.
 */

import { useState } from 'react';
import { useGameStore } from '@/game/state/store';
import { createFounder } from '@/game/systems/character-creation';
import { STAT_KEYS, INITIAL_STAT_POINTS, createEmptyStats } from '@/game/systems/stat-allocation';
import { initAudio, playBGM } from '@/audio/audio-manager';
import { AUDIO } from '@/audio/audio-keys';
import { FOUNDER_MASK_CHOICES } from '@/scene/sprites/mask-pool';
import { CivSelector } from '@/ui/components/civ-selector';
import { ArchetypeSelector } from '@/ui/components/archetype-selector';
import { MaskSelector } from '@/ui/components/mask-selector';
import { CharacterPreview } from '@/ui/components/character-preview';
import { StatAllocator } from '@/ui/components/stat-allocator';
import { TitleScreenLogo } from '@/ui/screens/title-screen-logo';
import type { FounderArchetypeChoice } from '@/game/data/founder-archetypes';
import type { Civilization } from '@/game/data/civilization-config';
import type { Stats, StatKey } from '@/game/state/game-state';
import '@/ui/styles/title-screen.css';
import '@/ui/styles/panels.css';

interface CharCreationProps {
  slotId: number;
  onComplete: () => void;
}

type Step = 'civ' | 'class' | 'mask' | 'identity';
const STEP_ORDER: Step[] = ['civ', 'class', 'mask', 'identity'];
const STEP_LABELS: Record<Step, string> = {
  civ: 'Civilization',
  class: 'Class',
  mask: 'Mask',
  identity: 'Identity',
};
const NAME_MAX = 20;
const GUILD_MAX = 24;

export function CharCreation({ onComplete }: CharCreationProps) {
  const setFounder = useGameStore((s) => s.setFounder);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);
  const setGuildName = useGameStore((s) => s.setGuildName);

  const [step, setStep] = useState<Step>('civ');
  const [selectedCiv, setSelectedCiv] = useState<Civilization | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<FounderArchetypeChoice | null>(null);
  // No mask until the player picks one at the Mask step (overlay only appears on selection).
  const [selectedMaskId, setSelectedMaskId] = useState<string>('');
  const [name, setName] = useState('');
  const [guildName, setGuildNameLocal] = useState('');
  const [stats, setStats] = useState<Stats>(createEmptyStats());

  const allocated = STAT_KEYS.reduce((sum, k) => sum + stats[k], 0);
  const remaining = INITIAL_STAT_POINTS - allocated;
  const trimmedName = name.trim();
  const canBegin = !!selectedCiv && !!selectedChoice && !!selectedMaskId && !!trimmedName && remaining === 0;

  const handleAllocate = (stat: StatKey, delta: number) => {
    setStats((prev) => {
      const newVal = prev[stat] + delta;
      if (newVal < 0) return prev;
      const newAllocated = allocated + delta;
      if (newAllocated > INITIAL_STAT_POINTS) return prev;
      return { ...prev, [stat]: newVal };
    });
  };

  const handleSelectCiv = (civ: Civilization) => {
    setSelectedCiv(civ);
    setSelectedChoice(null); // changing civ invalidates downstream class pick
  };

  const goToStep = (target: Step) => {
    // Only allow jumping to a step that is already reachable (current or a completed one).
    const currentIdx = STEP_ORDER.indexOf(step);
    const targetIdx = STEP_ORDER.indexOf(target);
    if (targetIdx <= currentIdx) setStep(target);
  };

  const handleBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  const handleContinue = () => {
    if (step === 'civ' && selectedCiv) setStep('class');
    else if (step === 'class' && selectedChoice) setStep('mask');
    else if (step === 'mask' && selectedMaskId) setStep('identity');
  };

  const handleConfirm = () => {
    if (!canBegin || !selectedCiv || !selectedChoice || !selectedMaskId) return;
    const founder = createFounder(
      trimmedName,
      stats,
      selectedCiv,
      selectedChoice.archetype,
      selectedChoice.gender,
      selectedMaskId,
    );
    setFounder(founder);
    if (guildName.trim()) setGuildName(guildName.trim());
    setTutorialStep('arrival-alarm');

    initAudio();
    playBGM(AUDIO.BGM_GUILD);
    onComplete();
  };

  // Preview civ defaults to LinhSon so the placeholder has a faction tint before a pick.
  const previewCiv = selectedCiv ?? 'LinhSon';

  return (
    <div className="char-creation-overlay">
      <TitleScreenLogo size="brand" animate={false} />

      <StepRail current={step} onJump={goToStep} />

      <div className="char-create-hero-layout">
        <aside className="char-create-hero">
          <CharacterPreview
            civ={previewCiv}
            archetype={selectedChoice?.archetype}
            gender={selectedChoice?.gender}
            maskId={selectedMaskId}
          />
        </aside>

        <section className="char-create-panel">
          {step === 'civ' && (
            <StepBody title="Choose your civilization">
              <CivSelector selectedCiv={selectedCiv} onSelect={handleSelectCiv} />
            </StepBody>
          )}

          {step === 'class' && selectedCiv && (
            <StepBody title="Choose your class">
              <ArchetypeSelector
                civ={selectedCiv}
                selectedId={selectedChoice?.id}
                onSelect={setSelectedChoice}
              />
              {selectedChoice && <p className="char-create-flavor">{selectedChoice.description}</p>}
            </StepBody>
          )}

          {step === 'mask' && (
            <StepBody title="Choose your mask">
              <MaskSelector
                choices={FOUNDER_MASK_CHOICES}
                selectedId={selectedMaskId}
                onSelect={setSelectedMaskId}
              />
            </StepBody>
          )}

          {step === 'identity' && (
            <StepBody title="Forge your identity">
              <div className="char-create-fields">
                <input
                  type="text" placeholder="Character name"
                  value={name} onChange={(e) => setName(e.target.value)} maxLength={NAME_MAX}
                />
                <input
                  type="text" placeholder="Guild name (optional)"
                  value={guildName} onChange={(e) => setGuildNameLocal(e.target.value)} maxLength={GUILD_MAX}
                />
              </div>
              <StatAllocator stats={stats} remaining={remaining} onAllocate={handleAllocate} />
            </StepBody>
          )}

          <div className="char-create-nav">
            {step !== 'civ' && (
              <button type="button" className="panel-btn char-create-nav-btn" onClick={handleBack}>
                Back
              </button>
            )}
            {step !== 'identity' ? (
              <button
                type="button"
                className="panel-btn char-create-nav-btn"
                disabled={isContinueDisabled(step, selectedCiv, selectedChoice, selectedMaskId)}
                onClick={handleContinue}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="panel-btn char-create-nav-btn"
                disabled={!canBegin}
                onClick={handleConfirm}
              >
                Begin
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/** Continue-button gate per step (identity uses canBegin and renders Begin instead). */
function isContinueDisabled(
  step: Step,
  selectedCiv: Civilization | null,
  selectedChoice: FounderArchetypeChoice | null,
  selectedMaskId: string,
): boolean {
  if (step === 'civ') return !selectedCiv;
  if (step === 'class') return !selectedChoice;
  if (step === 'mask') return !selectedMaskId; // always preselected, but keep the guard
  return false;
}

/** Visual breadcrumb of the wizard steps; completed steps are clickable to go back. */
function StepRail({ current, onJump }: { current: Step; onJump: (step: Step) => void }) {
  const currentIdx = STEP_ORDER.indexOf(current);
  return (
    <nav className="char-step-rail" aria-label="Creation steps">
      {STEP_ORDER.map((s, idx) => {
        const state = idx < currentIdx ? 'done' : idx === currentIdx ? 'active' : 'upcoming';
        const clickable = idx <= currentIdx;
        return (
          <div key={s} className="char-step-rail-item">
            {idx > 0 && <span className="char-step-rail-sep" aria-hidden>▸</span>}
            <button
              type="button"
              className={`char-step-rail-btn char-step-rail-btn--${state}`}
              disabled={!clickable}
              onClick={clickable ? () => onJump(s) : undefined}
            >
              {STEP_LABELS[s]}
            </button>
          </div>
        );
      })}
    </nav>
  );
}

function StepBody({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="char-create-step-body">
      <h2 className="char-create-step-title">{title}</h2>
      {children}
    </div>
  );
}
