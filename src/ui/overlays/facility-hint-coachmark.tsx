/**
 * Facility hint coachmark — one-time discoverability nudge for the room's iconic
 * object (anvil / reactor / counter). Since arriving in a room no longer auto-opens
 * its function panel, this teaches the click on first visit.
 *
 * Shows on EVERY visit to a room until the player clicks its object once
 * (markFacilityHintSeen fires on click, not on first show), then is suppressed
 * forever via the persisted facilityHintSeen flag.
 *
 * Thin wrapper over TutorialCoachmark targetType="world" — same world-projection
 * bridge as the drum hint. aria-hidden: purely visual; the object click is the
 * only interaction it points to, reachable without the hint once known.
 */

import { useTranslation } from 'react-i18next';
import { useUiStore, type FacilityHintType } from '@/game/state/ui-store';
import { TutorialCoachmark } from '@/ui/coachmark/tutorial-coachmark';

// Per-facility object position offset from room center (cx,cz), mirroring the
// InteractiveFacilityObject placements in the furniture files. Y raised so the
// arrow points at the object's upper body rather than its base.
const OBJECT_OFFSET: Record<FacilityHintType, [number, number, number]> = {
  workshop: [0.8, 1.0, -0.5],     // anvil
  'alchemy-lab': [0, 2.0, -0.2],  // reactor (tall)
  tavern: [-2.8, 1.6, 1.2],       // apothecary counter
  'training-yard': [0, 1.4, -1.8], // training dummy
};

// i18n key per facility type (resolved at render time via t())
const CAPTION_KEY: Record<FacilityHintType, string> = {
  workshop: 'coachmark.workshop',
  'alchemy-lab': 'coachmark.alchemyLab',
  tavern: 'coachmark.tavern',
  'training-yard': 'coachmark.trainingYard',
};

interface FacilityHintCoachmarkProps {
  /** The facility room the camera is currently in, or null when in none of the 3. */
  activeType: FacilityHintType | null;
  /** Room center [cx, _, cz] of the active facility (FACILITY_SLOTS[placedSlot]). */
  roomCenter: [number, number, number] | null;
  /** True once the camera has finished lerping (don't point mid-navigation). */
  settled: boolean;
  /** True if any facility function panel is open (hide the hint while in-panel). */
  panelOpen: boolean;
  /** Re-show the hint even if its seen-flag is set. The tutorial uses this to
   *  re-point at the counter during 'recruit-first-member': assigning a keeper
   *  already clicked the counter (setting the seen-flag), which would otherwise
   *  permanently suppress the hint the player still needs to find. */
  forceShow?: boolean;
}

export function FacilityHintCoachmark({
  activeType,
  roomCenter,
  settled,
  panelOpen,
  forceShow = false,
}: FacilityHintCoachmarkProps) {
  const { t } = useTranslation();
  const seen = useUiStore((s) => s.facilityHintSeen);

  // Show only when settled in a room, no panel open, and the hint is unseen
  // (or forced by the tutorial).
  const active =
    activeType !== null && roomCenter !== null && settled && !panelOpen &&
    (forceShow || !seen[activeType]);

  // World target = room center + the object's local offset.
  const target: [number, number, number] =
    activeType && roomCenter
      ? [
          roomCenter[0] + OBJECT_OFFSET[activeType][0],
          OBJECT_OFFSET[activeType][1],
          roomCenter[2] + OBJECT_OFFSET[activeType][2],
        ]
      : [0, 0, 0];

  return (
    <div aria-hidden="true">
      <TutorialCoachmark
        active={active}
        targetType="world"
        target={target}
        caption={activeType ? t(CAPTION_KEY[activeType]) : ''}
        arrow
        pulse
      />
    </div>
  );
}
