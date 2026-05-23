/** Reusable ink-themed confirmation dialog with overlay. */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import '@/ui/styles/facilities-panel.css';

interface InkConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Inline mode: render just the dialog box (no portal, no full-screen overlay) so
   *  the caller can dock it inside its own layout — e.g. stacked below the build
   *  picker. Default false = centered modal portaled to <body>. */
  inline?: boolean;
}

export function InkConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel, inline = false }: InkConfirmDialogProps) {
  const { t } = useTranslation();
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  const dialog = (
    <div className="fp-dialog" onClick={(e) => e.stopPropagation()}>
      <div className="fp-dialog-title">{title}</div>
      <div className="fp-dialog-body">{body}</div>
      <div className="fp-dialog-actions">
        <button className="fp-btn-cancel" onClick={onCancel}>{t('inkConfirmDialog.cancel')}</button>
        <button className="fp-btn-confirm" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </div>
  );

  // Inline: the caller owns placement (e.g. inside a flex column under the picker).
  if (inline) return dialog;

  // Default: portal to <body> so the modal escapes any pointer-events:none / zoomed
  // ancestor (e.g. the facilities overlay) and reliably centers on the viewport.
  return createPortal(
    <div className="fp-dialog-overlay" onClick={onCancel}>{dialog}</div>,
    document.body,
  );
}
