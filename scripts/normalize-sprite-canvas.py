"""
Normalize sprite canvas to a target square size (default 128x128).

Handles BOTH crop (canvas > target) and pad (canvas < target) with a single
uniform algorithm: build a blank target-sized canvas and paste each source
frame at an offset that places the character's bbox bottom at the canvas
bottom and its bbox horizontal center at the canvas horizontal center.
PIL.Image.paste handles negative offsets (effective crop) and positive
offsets (effective pad) identically, so no branching needed.

Per-group (per leaf directory) processing:
    - Group bbox (union over all frames in the dir) defines the offset.
    - Same offset applied to every frame in the group → bobbing/animation
      relative motion preserved exactly.
    - Pixel data of the character is NEVER resampled — only translated.
      Lossless for character pixels.

Validation:
    - If group char width or height > target: ERROR, group skipped.
    - If group is fully transparent: skipped.

Usage:
    python scripts/normalize-sprite-canvas.py                 # dry-run
    python scripts/normalize-sprite-canvas.py --apply         # write files
    python scripts/normalize-sprite-canvas.py --target 144 --apply
    python scripts/normalize-sprite-canvas.py --root public/sprites/characters --apply
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path

from PIL import Image

# --- Tunables ---
ALPHA_THRESHOLD = 8           # alpha > this counts as opaque (anti-alias safe)
DEFAULT_TARGET = 128
DEFAULT_ROOT = Path("public/sprites")
DEFAULT_SCAN_SUBDIRS = ("characters",)


@dataclass
class GroupBBox:
    """Union bounding box across all frames in a group."""
    min_x: int
    min_y: int
    max_x: int
    max_y: int

    @property
    def width(self) -> int:
        return self.max_x - self.min_x + 1

    @property
    def height(self) -> int:
        return self.max_y - self.min_y + 1

    @property
    def center_x(self) -> int:
        return (self.min_x + self.max_x) // 2


@dataclass
class GroupResult:
    directory: Path
    frame_count: int
    src_canvas: tuple[int, int]
    bbox: GroupBBox | None
    paste_offset: tuple[int, int] | None  # (dx, dy) applied to every frame
    status: str  # 'ok' | 'noop' | 'oversized' | 'empty'
    note: str = ""


def find_frame_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    """Tighter bbox than getbbox() — uses ALPHA_THRESHOLD instead of >0."""
    w, h = img.size
    px = img.load()
    min_x, min_y = w, h
    max_x, max_y = -1, -1
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > ALPHA_THRESHOLD:
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
    if max_x < 0:
        return None
    return (min_x, min_y, max_x, max_y)


def collect_groups(root: Path) -> list[Path]:
    """Find every directory that directly contains *.png files."""
    groups: list[Path] = []
    for d in root.rglob("*"):
        if not d.is_dir():
            continue
        if any(p.suffix.lower() == ".png" for p in d.iterdir() if p.is_file()):
            groups.append(d)
    return groups


def analyze_group(directory: Path, target: int) -> GroupResult:
    """Compute group bbox and required paste offset to fit into target canvas."""
    pngs = sorted(p for p in directory.iterdir()
                  if p.is_file() and p.suffix.lower() == ".png")
    if not pngs:
        return GroupResult(directory, 0, (0, 0), None, None, "empty", "no PNGs")

    src_canvas: tuple[int, int] | None = None
    union_min_x = 10**9; union_min_y = 10**9
    union_max_x = -1;    union_max_y = -1

    for p in pngs:
        with Image.open(p) as src:
            img = src.convert("RGBA")
        if src_canvas is None:
            src_canvas = img.size
        elif img.size != src_canvas:
            return GroupResult(directory, len(pngs), src_canvas, None, None,
                               "empty",
                               f"mixed canvas in dir: {img.size} vs {src_canvas}")
        bb = find_frame_bbox(img)
        if bb is None:
            continue
        if bb[0] < union_min_x: union_min_x = bb[0]
        if bb[1] < union_min_y: union_min_y = bb[1]
        if bb[2] > union_max_x: union_max_x = bb[2]
        if bb[3] > union_max_y: union_max_y = bb[3]

    if union_max_x < 0 or src_canvas is None:
        return GroupResult(directory, len(pngs), src_canvas or (0, 0), None, None,
                           "empty", "all frames transparent")

    bbox = GroupBBox(union_min_x, union_min_y, union_max_x, union_max_y)

    if bbox.width > target or bbox.height > target:
        return GroupResult(directory, len(pngs), src_canvas, bbox, None,
                           "oversized",
                           f"char {bbox.width}x{bbox.height} > target {target}")

    # Compute uniform paste offset.
    #   New char_center_x should land at target // 2
    #   New char_max_y should land at target - 1
    dx = (target // 2) - bbox.center_x
    dy = (target - 1) - bbox.max_y

    # No-op detection: canvas already correct AND offset (0, 0).
    if src_canvas == (target, target) and dx == 0 and dy == 0:
        return GroupResult(directory, len(pngs), src_canvas, bbox, (0, 0),
                           "noop", "already normalized")

    return GroupResult(directory, len(pngs), src_canvas, bbox, (dx, dy), "ok")


def apply_group(directory: Path, target: int, offset: tuple[int, int]) -> int:
    """Re-paste every PNG in directory onto a target×target canvas at offset."""
    written = 0
    for p in sorted(directory.iterdir()):
        if not (p.is_file() and p.suffix.lower() == ".png"):
            continue
        with Image.open(p) as src:
            img = src.convert("RGBA")
        new = Image.new("RGBA", (target, target), (0, 0, 0, 0))
        new.paste(img, offset, img)
        new.save(p)
        written += 1
    return written


def main() -> int:
    ap = argparse.ArgumentParser(description="Normalize sprite canvas to target size")
    ap.add_argument("--apply", action="store_true",
                    help="Actually write files (default = dry-run)")
    ap.add_argument("--target", type=int, default=DEFAULT_TARGET,
                    help=f"Target canvas square size (default: {DEFAULT_TARGET})")
    ap.add_argument("--root", default=str(DEFAULT_ROOT),
                    help="Sprites root path")
    ap.add_argument("--subdir", action="append", default=None,
                    help="Subdir under root to scan (repeatable, default: characters)")
    args = ap.parse_args()

    root = Path(args.root)
    if not root.exists():
        print(f"ERROR: {root} does not exist", file=sys.stderr)
        return 1

    subdirs = args.subdir or list(DEFAULT_SCAN_SUBDIRS)
    targets: list[Path] = []
    for sub in subdirs:
        sub_path = root / sub if (root / sub).exists() else root
        targets.extend(collect_groups(sub_path))

    print(f"Target canvas: {args.target}x{args.target}")
    print(f"Scanning {len(targets)} groups...")
    print()

    results = [analyze_group(d, args.target) for d in targets]

    ok       = [r for r in results if r.status == "ok"]
    noop     = [r for r in results if r.status == "noop"]
    oversized = [r for r in results if r.status == "oversized"]
    empty    = [r for r in results if r.status == "empty"]

    print(f"Groups analyzed: {len(results)}")
    print(f"  ok        : {len(ok)}      (will be re-pasted)")
    print(f"  noop      : {len(noop)}    (already normalized)")
    print(f"  oversized : {len(oversized)} (skipped — char too big for target)")
    print(f"  empty     : {len(empty)}   (skipped — empty/mixed/transparent)")
    print()

    if oversized:
        print("OVERSIZED groups (need larger target or sprite trimming):")
        for r in oversized:
            rel = r.directory.relative_to(root)
            print(f"  {rel}  ->  {r.note}")
        print()

    if empty:
        print("EMPTY/INVALID groups:")
        for r in empty:
            rel = r.directory.relative_to(root)
            print(f"  {rel}  ->  {r.note}")
        print()

    if ok:
        print(f"Top changes (sorted by source canvas):")
        ok_sorted = sorted(ok, key=lambda r: -max(r.src_canvas))
        for r in ok_sorted[:20]:
            rel = r.directory.relative_to(root)
            sx, sy = r.src_canvas
            dx, dy = r.paste_offset  # type: ignore
            print(f"  {sx}x{sy} -> {args.target}x{args.target}  offset=({dx:+d},{dy:+d})  "
                  f"{r.frame_count}f  {rel}")
        print()

    if not args.apply:
        print("DRY-RUN. Re-run with --apply to write changes.")
        return 0

    if oversized:
        print("ABORT: oversized groups present. Resolve them first or use --target larger.",
              file=sys.stderr)
        return 2

    print("APPLYING normalization...")
    total_written = 0
    for r in ok:
        n = apply_group(r.directory, args.target, r.paste_offset)  # type: ignore
        total_written += n
    print(f"Done. Wrote {total_written} files in {len(ok)} groups.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
