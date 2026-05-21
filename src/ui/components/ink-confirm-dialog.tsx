/** Reusable ink-themed confirmation dialog with overlay. */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '@/ui/styles/facilities-panel.css';

interface InkConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function InkConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }: InkConfirmDialogProps) {
  const { t } = useTranslation();
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div className="fp-dialog-overlay" onClick={onCancel}>
      <div className="fp-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="fp-dialog-title">{title}</div>
        <div className="fp-dialog-body">{body}</div>
        <div className="fp-dialog-actions">
          <button className="fp-btn-cancel" onClick={onCancel}>{t('inkConfirmDialog.cancel')}</button>
          <button className="fp-btn-confirm" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
