/**
 * Combat preparation panel — formation setup screen before battle.
 * Players drag party members onto a 2x3 grid, preview enemies, auto-suggest placement.
 */

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import { ENEMIES } from '@/game/data/enemies';
import { isRangedArchetype } from '@/game/systems/combat-arena-types';
import type { Member } from '@/game/state/game-state';
import type { Formation } from '@/game/systems/combat-arena-types';

/** Auto-suggest formation: melee front, ranged back */
function autoSuggestFormation(members: Member[]): Formation {
  const formation: Formation = [null, null, null, null, null, null];
  const melee: Member[] = [];
  const ranged: Member[] = [];

  for (const m of members) {
    if (isRangedArchetype(m.archetype)) ranged.push(m);
    else melee.push(m);
  }

  let frontIdx = 0;
  let backIdx = 3;
  for (const m of melee) {
    if (frontIdx <= 2) formation[frontIdx++] = m.id;
    else if (backIdx <= 5) formation[backIdx++] = m.id;
  }
  for (const m of ranged) {
    if (backIdx <= 5) formation[backIdx++] = m.id;
    else if (frontIdx <= 2) formation[frontIdx++] = m.id;
  }

  return formation;
}

export function CombatPrepPanel() {
  const arenaMissionId = useGameStore(s => s.arenaMissionId);
  const arenaInstanceId = useGameStore(s => s.arenaInstanceId);
  const formation = useGameStore(s => s.formation);
  const setFormationSlot = useGameStore(s => s.setFormationSlot);
  const startBattle = useGameStore(s => s.startBattle);
  const exitArena = useGameStore(s => s.exitArena);
  const founder = useGameStore(s => s.founder);
  const roster = useGameStore(s => s.roster);
  const activeMissions = useGameStore(s => s.activeMissions);

  const mission = activeMissions.find(m => m.instanceId === arenaInstanceId);
  const allMembers = useMemo(() => founder ? [founder, ...roster] : roster, [founder, roster]);
  const partyMembers = useMemo(
    () => allMembers.filter(m => mission?.memberIds.includes(m.id)),
    [allMembers, mission],
  );

  const missionData = MISSIONS.find(m => m.id === arenaMissionId);
  const enemies = useMemo(
    () => missionData?.enemyIds.map(id => ENEMIES[id]).filter(Boolean) ?? [],
    [missionData],
  );

  const placedIds = new Set(formation.filter(Boolean));
  const unplacedMembers = partyMembers.filter(m => !placedIds.has(m.id));
  const canStart = formation.some(id => id !== null);

  const handleAutoSuggest = useCallback(() => {
    const suggested = autoSuggestFormation(partyMembers);
    suggested.forEach((memberId, i) => setFormationSlot(i, memberId));
  }, [partyMembers, setFormationSlot]);

  const onDragStart = (e: React.DragEvent, memberId: string) => {
    e.dataTransfer.setData('memberId', memberId);
  };

  const onDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    const memberId = e.dataTransfer.getData('memberId');
    if (memberId) setFormationSlot(slotIndex, memberId);
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const getMember = (id: string | null) => id ? partyMembers.find(m => m.id === id) : null;

  const { t } = useTranslation();

  /** Display order: each row is [back, front] to match in-game spawn positions */
  const GRID_ORDER = [3, 0, 4, 1, 5, 2];
  const SLOT_LABELS = [
    t('combatPrepPanel.frontSlot', { n: 1 }),
    t('combatPrepPanel.frontSlot', { n: 2 }),
    t('combatPrepPanel.frontSlot', { n: 3 }),
    t('combatPrepPanel.backSlot', { n: 1 }),
    t('combatPrepPanel.backSlot', { n: 2 }),
    t('combatPrepPanel.backSlot', { n: 3 }),
  ];

  return (
    <div style={OVERLAY}>
      <div style={PANEL}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#ffd700', margin: 0, fontSize: '1.2rem' }}>{t('combatPrepPanel.title')}</h2>
          <button onClick={exitArena} style={BTN_SECONDARY}>{t('combatPrepPanel.retreat')}</button>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {/* Unplaced members sidebar */}
          <div style={{ minWidth: 120 }}>
            <div style={{ color: '#aaa', fontSize: '0.75rem', marginBottom: 6 }}>{t('combatPrepPanel.party')}</div>
            {unplacedMembers.map(m => (
              <div
                key={m.id}
                draggable
                onDragStart={e => onDragStart(e, m.id)}
                style={MEMBER_CARD}
              >
                <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{m.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                  Lv.{m.level} {m.archetype ?? 'warrior'}
                </div>
              </div>
            ))}
            {unplacedMembers.length === 0 && (
              <div style={{ color: '#666', fontSize: '0.75rem' }}>{t('combatPrepPanel.allPlaced')}</div>
            )}
          </div>

          {/* Formation grid — 2 columns × 3 rows */}
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
              <div style={{ color: '#aaa', fontSize: '0.75rem', textAlign: 'center' }}>{t('combatPrepPanel.back')}</div>
              <div style={{ color: '#aaa', fontSize: '0.75rem', textAlign: 'center' }}>{t('combatPrepPanel.front')}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {GRID_ORDER.map(slotIdx => {
                const member = getMember(formation[slotIdx]);
                return (
                  <div
                    key={slotIdx}
                    onDrop={e => onDrop(e, slotIdx)}
                    onDragOver={onDragOver}
                    draggable={!!member}
                    onDragStart={member ? e => onDragStart(e, member.id) : undefined}
                    onClick={member ? () => setFormationSlot(slotIdx, null) : undefined}
                    style={{
                      ...GRID_SLOT,
                      background: member ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                      cursor: member ? 'grab' : 'default',
                    }}
                  >
                    {member ? (
                      <>
                        <div style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>{member.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#aaa' }}>Lv.{member.level}</div>
                      </>
                    ) : (
                      <div style={{ color: '#555', fontSize: '0.7rem' }}>{SLOT_LABELS[slotIdx]}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enemy preview */}
          <div style={{ minWidth: 120 }}>
            <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginBottom: 6 }}>{t('combatPrepPanel.enemies')}</div>
            {enemies.map((enemy, i) => (
              <div key={`${enemy.id}-${i}`} style={{ ...MEMBER_CARD, borderColor: 'rgba(231,76,60,0.3)' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#e74c3c' }}>{enemy.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#aaa' }}>Lv.{enemy.level}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          <button onClick={handleAutoSuggest} style={BTN_SECONDARY}>{t('combatPrepPanel.autoPlace')}</button>
          <button onClick={startBattle} disabled={!canStart} style={{
            ...BTN_PRIMARY,
            opacity: canStart ? 1 : 0.4,
            cursor: canStart ? 'pointer' : 'default',
          }}>
            {t('combatPrepPanel.startBattle')}
          </button>
        </div>
      </div>
    </div>
  );
}

const OVERLAY: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 90,
};

const PANEL: React.CSSProperties = {
  background: 'rgba(20,20,30,0.95)',
  border: '1px solid rgba(255,215,0,0.3)',
  borderRadius: 12, padding: 24,
  maxWidth: 600, width: '90%',
};

const MEMBER_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,215,0,0.2)',
  borderRadius: 6, padding: '6px 10px',
  marginBottom: 4, cursor: 'grab',
  color: '#e0e0e0',
};

const GRID_SLOT: React.CSSProperties = {
  width: 100, height: 56,
  border: '1px dashed rgba(255,215,0,0.3)',
  borderRadius: 6, padding: 6,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  color: '#e0e0e0',
};

const BTN_PRIMARY: React.CSSProperties = {
  padding: '8px 24px', background: '#ffd700', color: '#1a1a2e',
  border: 'none', borderRadius: 6, fontWeight: 'bold',
  fontSize: '0.9rem', cursor: 'pointer',
};

const BTN_SECONDARY: React.CSSProperties = {
  padding: '8px 16px', background: 'rgba(255,255,255,0.1)',
  color: '#e0e0e0', border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem',
};
