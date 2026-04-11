/**
 * Modal overlay for picking a placement slot for a newly purchased facility room.
 * Shows 12 slots in a 3-col × 4-row grid. Occupied slots are disabled.
 */

import { useState } from 'react';
import { useGameStore } from '@/game/state/store';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import type { FacilityType } from '@/game/state/game-state';

interface FacilitySlotPickerProps {
  facilityType: FacilityType;
  onPlace: (slotIndex: number) => void;
  onClose: () => void;
}

const COLS = 3;
const ROWS = 4;

export function FacilitySlotPicker({ facilityType, onPlace, onClose }: FacilitySlotPickerProps) {
  const facilities = useGameStore((s) => s.facilities);
  const [selected, setSelected] = useState<number | null>(null);

  const def = FACILITY_DEFINITIONS[facilityType];

  // Slots occupied by other facilities
  const occupiedSlots = new Set(
    facilities
      .filter((f) => f.type !== facilityType && f.placedSlot !== null)
      .map((f) => f.placedSlot as number),
  );

  // Build display order: row-major across 3 cols — slot = col * ROWS + row
  const displayOrder: number[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      displayOrder.push(col * ROWS + row);
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ color: '#ffd700', margin: '0 0 4px' }}>Place: {def.name}</h3>
        <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 12px' }}>
          Choose a slot around the guild hall for this room.
        </p>

        {/* Guild hall footprint label */}
        <div style={guildHallLabelStyle}>GUILD HALL</div>

        {/* 3×4 slot grid */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 6, margin: '10px 0' }}>
          {displayOrder.map((slotIndex) => {
            const occupied = occupiedSlots.has(slotIndex);
            const isSelected = selected === slotIndex;
            return (
              <button
                key={slotIndex}
                disabled={occupied}
                onClick={() => setSelected(slotIndex)}
                style={slotButtonStyle(isSelected, occupied)}
              >
                {occupied ? '■' : isSelected ? `✓ ${slotIndex}` : slotIndex}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: 8 }}>
            Slot {selected} selected
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="panel-btn"
            disabled={selected === null}
            onClick={() => { if (selected !== null) onPlace(selected); }}
          >
            Confirm
          </button>
          <button className="panel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 300,
};

const modalStyle: React.CSSProperties = {
  background: '#1a1a2e',
  border: '1px solid rgba(255,215,0,0.3)',
  borderRadius: 8,
  padding: 20,
  minWidth: 240,
  maxWidth: 300,
};

const guildHallLabelStyle: React.CSSProperties = {
  background: 'rgba(255,215,0,0.06)',
  border: '1px solid rgba(255,215,0,0.25)',
  borderRadius: 4,
  padding: '5px 0',
  textAlign: 'center',
  color: '#ffd700',
  fontSize: '0.75rem',
  letterSpacing: 2,
};

function slotButtonStyle(selected: boolean, occupied: boolean): React.CSSProperties {
  return {
    padding: '8px 4px',
    borderRadius: 4,
    border: selected ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.12)',
    background: selected
      ? 'rgba(255,215,0,0.18)'
      : occupied
        ? 'rgba(255,50,50,0.08)'
        : 'rgba(255,255,255,0.04)',
    color: occupied ? '#444' : selected ? '#ffd700' : '#aaa',
    cursor: occupied ? 'not-allowed' : 'pointer',
    fontSize: '0.8rem',
    fontWeight: selected ? 'bold' : 'normal',
    transition: 'background 0.15s',
  };
}
