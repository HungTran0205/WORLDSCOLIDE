/**
 * Clips combat rendering to the panel viewport rectangle so background and
 * foreground layers don't bleed past the modal's chrome. Without this, the
 * far/mid bg planes (which are sized for full-frustum coverage) leak into the
 * area surrounding the panel — visually breaking the "window onto stage" feel
 * the HD-2D depth scene aims for.
 *
 * Implementation: WebGL scissor (no autoClear changes — the eslint immut rule
 * forbids mutating renderer props like `gl.autoClear`).
 *  - Priority -1: clear the full canvas transparent, then enable scissor test
 *    bound to the panel's pixel rect.
 *  - R3F's render (priority 0) does its own autoClear inside scissor and
 *    renders into scissor only.
 *  - On unmount (combat close): scissor disabled so guild scene rendering
 *    returns to full canvas.
 *
 * Panel rect comes from the DOM — `.combat-panel--phase-battle` is the
 * battle-phase modal whose body hosts the canvas viewport.
 */

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';

const PANEL_SELECTOR = '.combat-panel--phase-battle';

export function CombatScissor() {
  const gl = useThree(s => s.gl);
  const debugBorderRef = useRef<HTMLDivElement | null>(null);

  const { debugBorder, enabled } = useControls('Combat / Scissor', {
    // Default OFF — WebGPU + this scissor implementation produced a left-side
    // misalignment (~30% panel width). Box-shadow on the panel + oversize bg
    // planes reliably hide canvas leakage outside the panel without scissor.
    // Toggle on only for experiments.
    enabled:     { value: false, label: 'enable scissor' },
    debugBorder: { value: false, label: 'show rect (red)' },
  }, { collapsed: true });

  // Mount/unmount a fixed-position DOM border that reflects the computed
  // scissor rect — lets the user visually compare it against the actual
  // panel HTML to detect alignment drift.
  useEffect(() => {
    if (!debugBorder) return;
    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'pointer-events:none', 'z-index:100000',
      'border:2px dashed #ff00ff', 'box-sizing:border-box',
    ].join(';');
    document.body.appendChild(el);
    debugBorderRef.current = el;
    return () => {
      el.remove();
      debugBorderRef.current = null;
    };
  }, [debugBorder]);

  // Restore renderer state when combat closes — otherwise the guild scene
  // would keep rendering inside the now-stale combat scissor rect.
  useEffect(() => {
    return () => {
      gl.setScissorTest(false);
    };
  }, [gl]);

  useFrame(({ size }) => {
    const panelEl = document.querySelector(PANEL_SELECTOR);
    if (!panelEl || !enabled) {
      gl.setScissorTest(false);
      if (debugBorderRef.current) debugBorderRef.current.style.display = 'none';
      return;
    }

    const rect = (panelEl as HTMLElement).getBoundingClientRect();
    const dpr = gl.getPixelRatio();
    const canvasHeight = size.height * dpr;

    // Convert CSS rect → GL pixel coords (origin bottom-left, Y inverted).
    const x = Math.floor(rect.left * dpr);
    const y = Math.floor(canvasHeight - rect.bottom * dpr);
    const w = Math.ceil(rect.width * dpr);
    const h = Math.ceil(rect.height * dpr);

    // Clear the full canvas transparent first (scissor off), then turn scissor
    // on for the upcoming R3F render call.
    gl.setScissorTest(false);
    gl.clearColor();
    gl.clear();

    gl.setScissor(x, y, w, h);
    gl.setScissorTest(true);

    // Update debug border in CSS pixels (since DOM uses CSS px, not device).
    const border = debugBorderRef.current;
    if (border) {
      border.style.display = 'block';
      border.style.left = rect.left + 'px';
      border.style.top = rect.top + 'px';
      border.style.width = rect.width + 'px';
      border.style.height = rect.height + 'px';
    }
  }, -1);

  return null;
}
