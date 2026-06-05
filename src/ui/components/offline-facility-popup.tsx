/** Popup shown on return — consolidates everything the guild's facilities produced offline. */

import { useTranslation } from 'react-i18next';
import type { OfflineReport } from '@/game/systems/offline-report';
import { ITEM_DATABASE } from '@/game/data/items';
import type { ItemID } from '@/game/data/items';
import { tContent } from '@/i18n/content-localization';
import '@/ui/styles/panels.css';

interface OfflineFacilityPopupProps {
  report: OfflineReport;
  onDismiss: () => void;
}

const FACILITY_ICONS: Record<string, string> = {
  'logging-site': '🌲',
  'stone-quarry': '⛏',
  workshop: '🔨',
  'alchemy-lab': '⚗',
  'training-yard': '🏋',
  infirmary: '⚕️',
};

function itemLabel(itemId: string): string {
  const name = ITEM_DATABASE[itemId as ItemID]?.name ?? itemId.replace(/_/g, ' ');
  return tContent('items', itemId, 'name', name);
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ color: '#87ceeb', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: 4 }}>
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

const ROW: React.CSSProperties = { fontSize: '0.8rem', color: '#ccc', paddingLeft: 16 };

export function OfflineFacilityPopup({ report, onDismiss }: OfflineFacilityPopupProps) {
  const { t } = useTranslation();
  const production = report.production.filter((p) => Object.keys(p.itemGains).length > 0);
  const craftedEntries = Object.entries(report.crafted);
  const alchemyEntries = Object.entries(report.alchemy);

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog" style={{ maxWidth: 440, textAlign: 'left', maxHeight: '80vh', overflowY: 'auto' }}>
        <h3 style={{ color: '#ffd700', margin: '0 0 4px', fontSize: '1rem' }}>{t('offlinePopup.title')}</h3>
        <p style={{ color: '#aaa', fontSize: '0.8rem', margin: '0 0 16px' }}>
          {t('offlinePopup.offline', { hours: report.elapsedHours.toFixed(1) })}
        </p>

        {/* Gathering (logging / quarry) */}
        {production.map((r) => (
          <Section key={r.facilityType} icon={FACILITY_ICONS[r.facilityType] ?? '🏛'} title={r.facilityName}>
            {Object.entries(r.itemGains).map(([itemId, qty]) => (
              <div key={itemId} style={ROW}>{t('offlinePopup.itemGain', { qty, item: itemLabel(itemId) })}</div>
            ))}
          </Section>
        ))}

        {/* Workshop crafted equipment */}
        {craftedEntries.length > 0 && (
          <Section icon={FACILITY_ICONS.workshop} title={t('offlinePopup.workshop')}>
            {craftedEntries.map(([name, qty]) => (
              <div key={name} style={ROW}>{t('offlinePopup.itemGain', { qty, item: name })}</div>
            ))}
          </Section>
        )}

        {/* Alchemy items */}
        {alchemyEntries.length > 0 && (
          <Section icon={FACILITY_ICONS['alchemy-lab']} title={t('offlinePopup.alchemy')}>
            {alchemyEntries.map(([itemId, qty]) => (
              <div key={itemId} style={ROW}>{t('offlinePopup.itemGain', { qty, item: itemLabel(itemId) })}</div>
            ))}
          </Section>
        )}

        {/* Training Yard — learned / ranked skills */}
        {report.trained.length > 0 && (
          <Section icon={FACILITY_ICONS['training-yard']} title={t('offlinePopup.training')}>
            {report.trained.map((tr, i) => (
              <div key={i} style={ROW}>{t('offlinePopup.skillGain', { member: tr.memberName, skill: tr.skillName, level: tr.level })}</div>
            ))}
          </Section>
        )}

        {/* Infirmary recoveries */}
        {report.recovered.length > 0 && (
          <Section icon={FACILITY_ICONS.infirmary} title={t('offlinePopup.infirmary')}>
            {report.recovered.map((name, i) => (
              <div key={i} style={ROW}>{t('offlinePopup.recovered', { member: name })}</div>
            ))}
          </Section>
        )}

        <button className="panel-btn" onClick={onDismiss} style={{ marginTop: 8 }}>
          {t('offlinePopup.collect')}
        </button>
      </div>
    </div>
  );
}
