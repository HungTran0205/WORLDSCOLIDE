/**
 * CoachConfig — shared type contract between the coachmark component (Phase 01)
 * and the tutorial step machine (Phase 06).
 *
 * Keep this file pure-type (no runtime dependencies) so it can be imported
 * from both the R3F layer and the DOM layer without side effects.
 */

/**
 * Configuration for a single coachmark step.
 *
 * @property targetType - 'world' = 3D world-space point projected each frame;
 *                        'dom' = CSS selector tracked via getBoundingClientRect
 * @property target     - [x,y,z] tuple for world targets; CSS selector string for dom targets
 * @property caption    - Short instruction text (≤ 1 sentence per GDD anti-goals)
 * @property spotlight  - Dims the rest of the screen with a cutout around the target
 * @property arrow      - Renders a bouncing arrow pointing at the target
 * @property pulse      - Adds the tutorialPulse gold-ring animation around the target
 * @property blockOutside - When true (with spotlight), pointer-events outside the
 *                          cutout are swallowed so the player is funnelled to the target
 * @property advanceOn  - Event/action string consumed by Phase 06 state machine;
 *                        Phase 01 just types it — no coupling yet
 */
export interface CoachConfig {
  targetType: 'world' | 'dom';
  target: [number, number, number] | string;
  caption: string;
  spotlight?: boolean;
  arrow?: boolean;
  pulse?: boolean;
  blockOutside?: boolean;
  /** Phase 06 concern — typed here for the shared contract, not consumed yet. */
  advanceOn?: string;
}
