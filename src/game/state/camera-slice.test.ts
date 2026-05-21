/**
 * Camera slice tests — facility function-panel request/clear actions.
 *
 * Covers:
 *  - initial state: pendingFacilityFunctionPanel null + facilityFocusTarget null
 *  - requestFacilityPanel: sets pending type + facility-focus + target + focusTarget + unsettles camera
 *  - clearPendingFacilityFunctionPanel: resets pending to null, leaves focus/target untouched
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createCameraSlice, type CameraSlice, GUILD_HALL_CAMERA_TARGET } from './camera-slice';

// Instantiate the slice in isolation as its own tiny store.
const useCameraStore = create<CameraSlice>(createCameraSlice);

const SAMPLE_FOCUS: [number, number, number] = [5, 0, 3.5];

beforeEach(() => {
  // Reset to a fresh slice between tests.
  useCameraStore.setState(createCameraSlice(useCameraStore.setState, useCameraStore.getState, useCameraStore), true);
});

describe('camera slice — initial state', () => {
  it('pendingFacilityFunctionPanel and facilityFocusTarget default to null', () => {
    const state = useCameraStore.getState();
    expect(state.pendingFacilityFunctionPanel).toBeNull();
    expect(state.facilityFocusTarget).toBeNull();
  });
});

describe('camera slice — requestFacilityPanel', () => {
  it('sets pending + facility-focus + target + focusTarget + unsettles camera', () => {
    useCameraStore.getState().requestFacilityPanel('workshop', SAMPLE_FOCUS);

    const state = useCameraStore.getState();
    expect(state.pendingFacilityFunctionPanel).toBe('workshop');
    expect(state.cameraFocus).toBe('facility-focus');
    expect(state.cameraTarget).toEqual(SAMPLE_FOCUS);
    expect(state.facilityFocusTarget).toEqual(SAMPLE_FOCUS);
    expect(state.cameraSettled).toBe(false);
  });

  it('cameraTarget and facilityFocusTarget reference the same focusPos value', () => {
    useCameraStore.getState().requestFacilityPanel('tavern', SAMPLE_FOCUS);

    const state = useCameraStore.getState();
    expect(state.cameraTarget).toEqual(state.facilityFocusTarget);
  });
});

describe('camera slice — clearPendingFacilityFunctionPanel', () => {
  it('resets pendingFacilityFunctionPanel to null, leaving focus and target untouched', () => {
    useCameraStore.getState().requestFacilityPanel('alchemy-lab', SAMPLE_FOCUS);
    useCameraStore.getState().clearPendingFacilityFunctionPanel();

    const state = useCameraStore.getState();
    expect(state.pendingFacilityFunctionPanel).toBeNull();
    // Other fields set by requestFacilityPanel remain untouched.
    expect(state.cameraFocus).toBe('facility-focus');
    expect(state.facilityFocusTarget).toEqual(SAMPLE_FOCUS);
    expect(state.cameraTarget).toEqual(SAMPLE_FOCUS);
  });

  it('clearing from a fresh slice keeps pending null and other defaults intact', () => {
    useCameraStore.getState().clearPendingFacilityFunctionPanel();

    const state = useCameraStore.getState();
    expect(state.pendingFacilityFunctionPanel).toBeNull();
    expect(state.cameraFocus).toBe('default');
    expect(state.cameraTarget).toEqual(GUILD_HALL_CAMERA_TARGET);
  });
});
