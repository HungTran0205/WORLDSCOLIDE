"""
Anchor sprite frames to bottom edge of canvas.

Scans every PNG sprite frame under public/sprites/{characters,enemies}/, groups
by directory (one group = one animation/direction), finds the deepest opaque row
across the group, and shifts ALL frames in the group down so that deepest row
touches the canvas bottom edge. Bobbing within an animation is preserved
because the shift is uniform per group, not per frame.

Usage:
    python scripts/anchor-sprites-bottom.py            # dry-run, prints report
    python scripts/anchor-sprites-bottom.py --apply    # actually writes files

Algorithm:
    For each leaf directory containing *.png frames:
        1. Load all frames as RGBA, find bottom-most opaque row per frame
           (alpha > ALPHA_THRESHOLD).
        2. group_max_bot = max(per-frame bottom)  -- the lowest pixel in the group
        3. shift = (canvasH - 1) - group_max_bot
        4. If shift > 0: re-paste each frame onto blank canvas at (0, shift)
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path

from PIL import Image

# --- Tunables ---
ALPHA_THRESHOLD = 8           # alpha > this counts as opaque (anti-alias safe)
SPRITES_ROOT = Path("public/sprites")
SCAN_SUBDIRS = ("characters", "enemies")


@dataclass
class GroupResult:
    directory: Path
    frame_count: int
    canvas_h: int
    group_max_bot: int        # deepest opaque row across all frames
    shift: int                # pixels to translate down


def find_bottom_opaque_row(img: Image.Image) -> int:
    """Return Y index of lowest opaque row, or -1 if fully transparent."""
    w, h = img.size
    px = img.load()
    for y in range(h - 1, -1, -1):
        for x in range(w):
            if px[x, y][3] > ALPHA_THRESHOLD:
                return y
    return -1


def collect_groups(root: Path) -> list[Path]:
    """Find every directory that directly contains *.png files."""
    groups: list[Path] = []
    for d in root.rglob("*"):
        if not d.is_dir():
            continue
        if any(p.suffix.lower() == ".png" for p in d.iterdir() if p.is_file()):
            groups.append(d)
    return groups


def analyze_group(directory: Path) -> GroupResult | None:
    """Scan a directory of PNG frames, compute the shift needed."""
    pngs = sorted(p for p in directory.iterdir() if p.is_file() and p.suffix.lower() == ".png")
    if not pngs:
        return None

    canvas_h = -1
    group_max_bot = -1
    for p in pngs:
        with Image.open(p) as src:
            img = src.convert("RGBA")
        if canvas_h < 0:
            canvas_h = img.size[1]
        bot = find_bottom_opaque_row(img)
        if bot > group_max_bot:
            group_max_bot = bot

    if group_max_bot < 0:
        return None  # all-transparent group

    shift = (canvas_h - 1) - group_max_bot
    return GroupResult(
        directory=directory,
        frame_count=len(pngs),
        canvas_h=canvas_h,
        group_max_bot=group_max_bot,
        shift=shift,
    )


def apply_shift(directory: Path, shift: int) -> int:
    """Shift every PNG in directory down by `shift` pixels. Returns count written."""
    if shift <= 0:
        return 0
    written = 0
    for p in sorted(directory.iterdir()):
        if not (p.is_file() and p.suffix.lower() == ".png"):
            continue
        with Image.open(p) as src:
            img = src.convert("RGBA")
        w, h = img.size
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        canvas.paste(img, (0, shift), img)
        canvas.save(p)
        written += 1
    return written


def main() -> int:
    ap = argparse.ArgumentParser(description="Bottom-anchor sprite frames")
    ap.add_argument("--apply", action="store_true",
                    help="Actually write files (default = dry-run)")
    ap.add_argument("--root", default=str(SPRITES_ROOT),
                    help="Sprites root path (default: public/sprites)")
    args = ap.parse_args()

    root = Path(args.root)
    if not root.exists():
        print(f"ERROR: {root} does not exist", file=sys.stderr)
        return 1

    targets: list[Path] = []
    for sub in SCAN_SUBDIRS:
        sub_path = root / sub
        if sub_path.exists():
            targets.extend(collect_groups(sub_path))

    print(f"Scanning {len(targets)} groups under {root}...")
    print()

    results: list[GroupResult] = []
    for d in targets:
        r = analyze_group(d)
        if r is None:
            continue
        results.append(r)

    # Sort by shift desc for the report
    results.sort(key=lambda r: -r.shift)

    shifted = [r for r in results if r.shift > 0]
    skipped = [r for r in results if r.shift <= 0]

    print(f"Groups analyzed: {len(results)}")
    print(f"  shift > 0   : {len(shifted)}")
    print(f"  shift = 0   : {len(skipped)}")
    print()

    if shifted:
        max_shift = max(r.shift for r in shifted)
        avg_shift = sum(r.shift for r in shifted) / len(shifted)
        total_frames = sum(r.frame_count for r in shifted)
        print(f"Max shift  : {max_shift}px")
        print(f"Avg shift  : {avg_shift:.1f}px")
        print(f"Frames affected: {total_frames}")
        print()
        print("Top 15 groups by shift:")
        for r in shifted[:15]:
            rel = r.directory.relative_to(root)
            print(f"  {r.shift:4d}px  ({r.canvas_h}h, {r.frame_count}f)  {rel}")
        print()

    if skipped:
        print(f"Skipped {len(skipped)} groups (already touching bottom or out of bounds)")
        print()

    if not args.apply:
        print("DRY-RUN. Re-run with --apply to write changes.")
        return 0

    print("APPLYING shifts...")
    total_written = 0
    for r in shifted:
        n = apply_shift(r.directory, r.shift)
        total_written += n
    print(f"Done. Wrote {total_written} files in {len(shifted)} groups.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
