/** Training Yard assign pickers — step 1 (member) → step 2 (class skill pool). */

import { useTranslation } from 'react-i18next';
import type { InventoryState, Member } from '@/game/state/game-state';
import { RANK_COSTS } from '@/game/data/skill-rank-costs';
import { ITEM_DATABASE } from '@/game/data/items';
import type { ItemID } from '@/game/data/items';
import { getArchetypeSkillPool } from '@/game/data/skills';
import { applySkillRankMilestones } from '@/game/systems/skill-training-system';
import { tContent } from '@/i18n/content-localization';
import { FacilityMemberAvatar } from './facility-member-avatar';
import { SkillIcon } from './skill-icon';
import { SkillDetail } from './skill-detail';

// ── Step 1: member picker ────────────────────────────────────────────────────

export function MemberPicker({ eligible, onPick }: { eligible: Member[]; onPick: (m: Member) => void }) {
  const { t } = useTranslation();
  if (eligible.length === 0) return <div className="fp-inf-empty">{t('trainingYardCard.pickerEmpty')}</div>;
  return (
    <div className="fp-inf-rows">
      <div className="fp-tray-stat" style={{ padding: '0 4px 2px' }}>{t('trainingYardCard.pickMember')}</div>
      {eligible.map(m => {
        const carriedRank = m.skill ? (m.skillRanks?.[m.skill.id]?.rank ?? 1) : 1;
        return (
          <div key={m.id} className="fp-inf-row">
            <FacilityMemberAvatar member={m} />
            <div className="fp-inf-row-main">
              <div className="fp-inf-row-head">
                <span className="fp-inf-row-name">{m.name}</span>
                {m.skill && (
                  <span className="fp-inf-row-badge">{tContent('skills', m.skill.id, 'name', m.skill.name)} · {t('trainingYardCard.levelShort', { rank: carriedRank })}</span>
                )}
              </div>
              <div className="fp-inf-row-foot">
                <span className="fp-inf-row-remaining">{t('trainingYardCard.gradeBadge', { grade: m.grade })}</span>
                <button className="fp-inf-skip-btn" onClick={() => onPick(m)}>
                  {t('trainingYardCard.pickSkillBtn')}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Step 2: class skill picker ───────────────────────────────────────────────

interface SkillPickerProps {
  member: Member; cap: number; facilityId: string;
  gold: number; inventory: InventoryState;
  startSkillTraining: (memberId: string, skillId: string, facilityId: string) => boolean;
  onBack: () => void; onDone: () => void;
}

export function SkillPicker({ member, cap, facilityId, gold, inventory, startSkillTraining, onBack, onDone }: SkillPickerProps) {
  const { t } = useTranslation();
  const pool = getArchetypeSkillPool(member.archetype);
  return (
    <div className="fp-inf-rows">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 2px' }}>
        <span className="fp-tray-stat">{t('trainingYardCard.pickSkill', { name: member.name })}</span>
        <button className="fp-inf-skip-btn" onClick={onBack}>{t('trainingYardCard.back')}</button>
      </div>
      {pool.map(skill => {
        const currentRank = member.skillRanks?.[skill.id]?.rank ?? 0; // 0 = not yet learned
        const nextRank = currentRank + 1;
        const cost = RANK_COSTS[nextRank];
        const isCarried = member.skill?.id === skill.id;
        const isLearned = currentRank >= 1;
        const isMaxed = currentRank >= 5;
        const aboveCap = nextRank > cap;
        const cantAffordGold = !cost || gold < cost.gold;
        const cantAffordMat = cost?.material ? (inventory.items[cost.material as ItemID] ?? 0) < cost.quantity : false;
        const disabled = isMaxed || aboveCap || cantAffordGold || cantAffordMat;
        const disabledReason = isMaxed ? t('trainingYardCard.maxed')
          : aboveCap ? t('trainingYardCard.capTooLow')
          : (cantAffordGold || cantAffordMat) ? t('trainingYardCard.cantAfford') : '';
        const costLabel = cost?.material
          ? t('trainingYardCard.costMaterial', { gold: cost.gold, qty: cost.quantity, item: ITEM_DATABASE[cost.material as ItemID]?.name ?? cost.material })
          : t('trainingYardCard.costLabel', { gold: cost?.gold ?? '?' });
        return (
          <div key={skill.id} className="fp-inf-row">
            <SkillIcon skill={skill} />
            <div className="fp-inf-row-main">
              <div className="fp-inf-row-head">
                <span className="fp-inf-row-name">{tContent('skills', skill.id, 'name', skill.name)}</span>
                <span className="fp-inf-row-badge">{t('trainingYardCard.levelShort', { rank: currentRank })}</span>
                {isCarried && <span className="fp-inf-row-badge">{t('trainingYardCard.carried')}</span>}
                {!isLearned && <span className="fp-inf-row-badge">{t('trainingYardCard.unlearned')}</span>}
              </div>
              {tContent('skills', skill.id, 'desc', '') && (
                <p className="skill-desc">{tContent('skills', skill.id, 'desc', '')}</p>
              )}
              <SkillDetail skill={applySkillRankMilestones({ ...skill }, Math.max(1, currentRank))} t={t} />
              <div className="fp-inf-row-foot">
                <span className="fp-inf-row-remaining">{disabled ? disabledReason : costLabel}</span>
                <button className="fp-inf-skip-btn" disabled={disabled}
                  onClick={() => { if (startSkillTraining(member.id, skill.id, facilityId)) onDone(); }}>
                  {isLearned ? t('trainingYardCard.trainBtn') : t('trainingYardCard.learnBtn')}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
