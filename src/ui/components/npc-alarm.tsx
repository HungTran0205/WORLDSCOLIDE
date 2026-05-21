/**
 * NpcAlarm — beat-2 narrative binding (GDD §5 arrival-alarm).
 *
 * A messenger raises the alarm that a moonbear is attacking the village. Drives
 * the reusable <RetroSpeechBubble>; on completion advances the tutorial step.
 */

import { useGameStore } from '@/game/state/store';
import { tContent } from '@/i18n/content-localization';
import { RetroSpeechBubble } from './retro-speech-bubble';

const EN_ALARM_TEXT =
  "A giant moonbear is mauling the village below —\nsomeone's still trapped down there!";
const EN_SPEAKER = 'Messenger';

/** Fixed world point above the central hall (near the quest drum at [5,0,3.5]). */
const MESSENGER_ANCHOR: [number, number, number] = [5, 2.4, 3.5];

interface NpcAlarmProps {
  /** Phase 06 supplies the real advance; default advances the existing flow. */
  onComplete?: () => void;
}

export function NpcAlarm({ onComplete }: NpcAlarmProps) {
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);

  // Default advance → the drum beat. game-screen passes an explicit onComplete that
  // does the same; this default keeps the component safe to mount standalone.
  const handleComplete = onComplete ?? (() => setTutorialStep('open-quest-board'));

  const alarmText = tContent('dialog', 'npc-alarm', 'text', EN_ALARM_TEXT);
  const speaker = tContent('dialog', 'npc-alarm', 'speaker', EN_SPEAKER);

  return (
    <RetroSpeechBubble
      text={alarmText}
      speaker={speaker}
      anchor={{ worldPos: MESSENGER_ANCHOR }}
      onComplete={handleComplete}
    />
  );
}
