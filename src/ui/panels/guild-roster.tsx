import { useState, useMemo } from 'react';
import { useGameStore } from '@/game/state/store';
import { MemberBookmarkList } from '@/ui/components/member-bookmark-list';
import { MemberBookDetailPage } from '@/ui/components/member-book-detail-page';
import { CIVILIZATIONS, CIV_CONFIG } from '@/game/data/civilization-config';
import { canPromote } from '@/game/data/ranks';
import type { StatKey } from '@/game/state/game-state';
import { ConfirmDialog } from '@/ui/components/confirm-dialog';
import '@/ui/styles/panels.css';

interface GuildRosterProps {
  onClose: () => void;
}

export function GuildRoster({ onClose }: GuildRosterProps) {
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const gold = useGameStore((s) => s.gold);
  const allocateStat = useGameStore((s) => s.allocateStat);
  const toggleAutoCast = useGameStore((s) => s.toggleAutoCast);
  const inviteMercenary = useGameStore((s) => s.inviteMercenary);
  const promoteMember = useGameStore((s) => s.promoteMember);
  const removeMember = useGameStore((s) => s.removeMember);

  const allMembers = useMemo(() => (founder ? [founder, ...roster] : roster), [founder, roster]);

  const [civFilter, setCivFilter] = useState<string>('all');
  const [releaseTarget, setReleaseTarget] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(() => allMembers[0]?.id ?? null);

  const members = useMemo(
    () => (civFilter === 'all' ? allMembers : allMembers.filter((m) => m.civilization === civFilter)),
    [allMembers, civFilter],
  );

  // Fall back to first visible member if current selection is filtered out
  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) ?? members[0] ?? null,
    [members, selectedMemberId],
  );

  const isMercenary = selectedMember?.rank === 'MERCENARY';
  const inviteCost = (selectedMember?.level ?? 0) * 100;

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, background: 'rgba(0,0,0,0.55)',
    }}>
      {/* Book shell — 680px wide */}
      <div style={{
        width: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        background: 'rgba(14,16,28,0.98)', borderRadius: 10,
        border: '1px solid rgba(255,215,0,0.22)',
        boxShadow: '0 16px 56px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>

        {/* ── Title bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 14px', borderBottom: '1px solid rgba(255,215,0,0.14)',
          background: 'rgba(255,215,0,0.03)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ color: '#ffd700', fontSize: '0.95rem', fontStyle: 'italic' }}>Guild Roster</span>
            <span style={{
              fontSize: '0.62rem', color: '#777', padding: '1px 6px',
              border: '1px solid rgba(255,215,0,0.18)', borderRadius: 3,
            }}>{allMembers.length}</span>
            {/* Civ filter pills */}
            <div style={{ display: 'flex', gap: 3 }}>
              <button className="panel-btn" style={{ width: 'auto', padding: '2px 7px', fontSize: '0.65rem', marginTop: 0, opacity: civFilter === 'all' ? 1 : 0.55 }} onClick={() => setCivFilter('all')}>All</button>
              {CIVILIZATIONS.map((civ) => (
                <button key={civ} className="panel-btn" style={{ width: 'auto', padding: '2px 7px', fontSize: '0.65rem', marginTop: 0, opacity: civFilter === civ ? 1 : 0.5 }} onClick={() => setCivFilter(civ)}>
                  {CIV_CONFIG[civ].displayName}
                </button>
              ))}
            </div>
          </div>
          <button className="panel-close-btn" onClick={onClose}>Close</button>
        </div>

        {/* ── Book body: [bookmarks | left page | spine | right page] ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <MemberBookmarkList
            members={members}
            selectedId={selectedMember?.id ?? null}
            onSelect={setSelectedMemberId}
          />

          {selectedMember ? (
            <MemberBookDetailPage
              member={selectedMember}
              onAllocateStat={(stat) => allocateStat(selectedMember.id, stat as StatKey)}
              onToggleAutoCast={() => toggleAutoCast(selectedMember.id)}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '0.85rem' }}>
              No members
            </div>
          )}
        </div>

        {/* ── Action footer: rank-aware actions ── */}
        {selectedMember && (
          <div style={{
            display: 'flex', gap: 8, padding: '9px 14px',
            borderTop: '1px solid rgba(255,215,0,0.14)', flexShrink: 0,
          }}>
            {!isMercenary && !selectedMember.isFounder && (
              <button
                className="panel-btn"
                disabled={!canPromote(selectedMember, gold)}
                onClick={() => promoteMember(selectedMember.id)}
                style={{ marginTop: 0 }}
              >
                Promote
              </button>
            )}
            {isMercenary && (
              <button
                className="panel-btn"
                disabled={gold < inviteCost}
                onClick={() => inviteMercenary(selectedMember.id)}
                style={{ marginTop: 0 }}
              >
                Invite to Guild ({inviteCost}g)
              </button>
            )}
            {!selectedMember.isFounder && (
              <button
                className="panel-btn"
                onClick={() => setReleaseTarget(selectedMember.id)}
                style={{ marginTop: 0, color: '#e74c3c', borderColor: 'rgba(231,76,60,0.4)' }}
              >
                Release
              </button>
            )}
          </div>
        )}
      </div>

      {releaseTarget && (
        <ConfirmDialog
          message={`Release ${allMembers.find((m) => m.id === releaseTarget)?.name ?? 'this member'}? This cannot be undone.`}
          confirmLabel="Release"
          danger
          onConfirm={() => { removeMember(releaseTarget); setReleaseTarget(null); setSelectedMemberId(null); }}
          onCancel={() => setReleaseTarget(null)}
        />
      )}
    </div>
  );
}
