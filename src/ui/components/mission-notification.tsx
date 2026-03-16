/**
 * Toast notification stack — shows mission completion results.
 * Auto-dismisses after 5s, click to dismiss immediately.
 */

import { useEffect } from 'react';
import { useGameStore } from '@/game/state/store';
import { getItemInfo, type ItemID } from '@/game/data/items';
import '@/ui/styles/hud.css';

export function MissionNotification() {
  const notifications = useGameStore((s) => s.notifications);
  const dismissNotification = useGameStore((s) => s.dismissNotification);

  const visible = notifications.filter((n) => !n.dismissed).slice(0, 5);

  return (
    <div className="notification-stack">
      {visible.map((n) => (
        <NotificationToast
          key={n.id}
          id={n.id}
          missionName={n.missionName}
          notificationType={n.notificationType}
          outcome={n.result?.outcome ?? null}
          gold={n.result?.goldEarned ?? 0}
          exp={n.result?.expPerMember ?? 0}
          loot={n.result?.lootEarned ?? {}}
          survivors={n.result?.survivors.length ?? 0}
          injured={n.result?.injured.length ?? 0}
          onDismiss={() => dismissNotification(n.id)}
        />
      ))}
    </div>
  );
}

interface ToastProps {
  id: string;
  missionName: string;
  notificationType: 'arrival' | 'completion';
  outcome: string | null;
  gold: number;
  exp: number;
  loot: Partial<Record<ItemID, number>>;
  survivors: number;
  injured: number;
  onDismiss: () => void;
}

function NotificationToast({ id, missionName, notificationType, outcome, gold, exp, loot, survivors, injured, onDismiss }: ToastProps) {
  // Use id as dep instead of onDismiss to prevent timer reset on parent re-render
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (notificationType === 'arrival') {
    return (
      <div className="notification-toast notification-toast--victory" onClick={onDismiss}>
        <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#ffd700' }}>{missionName}</div>
        <div style={{ fontSize: '0.85rem', color: '#67b8e3' }}>📍 Party arrived! Choose combat mode.</div>
      </div>
    );
  }

  const isWipe = outcome === 'full-wipe';
  const outcomeLabel = outcome === 'victory' ? 'Victory!' : outcome === 'partial-victory' ? 'Partial Victory' : 'Wiped!';
  const outcomeClass = isWipe ? 'notification-toast--wipe' : 'notification-toast--victory';

  return (
    <div className={`notification-toast ${outcomeClass}`} onClick={onDismiss}>
      <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#ffd700' }}>{missionName}</div>
      <div style={{ fontSize: '0.85rem', color: isWipe ? '#e74c3c' : '#2ecc71' }}>{outcomeLabel}</div>
      {!isWipe && (
        <div style={{ fontSize: '0.8rem', color: '#ccc', marginTop: 4 }}>
          +{gold} Gold | +{exp} EXP | {survivors} survived
          {injured > 0 && <span style={{ color: '#e74c3c' }}> | {injured} injured</span>}
          {Object.keys(loot).length > 0 && (
            <div style={{ color: '#a8d8ea', marginTop: 2 }}>
              {Object.entries(loot)
                .filter(([, amt]) => amt && amt > 0)
                .map(([id, amt]) => `+${amt} ${getItemInfo(id as ItemID).name}`)
                .join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
