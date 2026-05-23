"""
Pack per-frame sprite PNGs into one sheet PNG per (entity, animation).

Why: itch.io HTML5 rejects zips with >1000 entries (files AND dirs). The
per-frame layout `(entity)/animations/(anim)/(dir)/frame_NNN.png` is ~566 PNGs
across ~160 frame-folders. Packing each animation into a single sheet collapses
those folders and files, dropping the dist entry count well under the limit.
The runtime already animates via a packed atlas (sprite-atlas.ts) — this just
moves the packing offline so we ship one sheet instead of N frames.

Sheet layout (LOCKED): one sheet per (entity, anim). Directions = rows, frames =
columns. cols = max frames across the anim's directions; rows = number of dirs.
Row order is recorded per-sheet in the manifest (`dirRows`) — never assumed.
Rows with fewer frames than `cols` leave trailing cells transparent; the real
loop length per dir is recorded in `frameCounts` so the loader never samples a
blank cell. Flat anims (no dir subdir) → rows=1, dirRows=['flat'].

Usage:
    python scripts/pack-sprite-sheets.py                      # dry-run report
    python scripts/pack-sprite-sheets.py --apply              # write sheets + manifest
    python scripts/pack-sprite-sheets.py --apply --prune-frames  # + delete packed frame folders

Skips single-image sets (avatar/, rotations/) and any group with <=1 PNG.
Emits src/scene/sprites/sprite-sheet-manifest.ts (geometry only; do not edit).
"""

from __future__ import annotations

import argparse
import shutil
import sys
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image

SPRITES_ROOT = Path("public/sprites")
SCAN_SUBDIRS = ("characters", "enemies")
MANIFEST_TS = Path("src/scene/sprites/sprite-sheet-manifest.ts")
# Single-image sets that stay as individual files (packing 1 frame saves nothing).
SKIP_ANIMS = {"avatar", "rotations"}
# Preferred direction row order; any extra dirs are appended alphabetically.
DIR_ORDER = ("north", "south", "east", "west")
MAX_SHEET_PX = 2048  # warn if a sheet edge exceeds this (GPU texture safety)


@dataclass
class SheetPlan:
    """One packable animation: where its frames live and the grid they form."""
    key: str                       # 'characters/LS-SWORD-M/walking-8-frames'
    public_path: str               # '/sprites/.../walking-8-frames.png'
    sheet_file: Path               # public/sprites/.../animations/walking-8-frames.png
    anim_dir: Path                 # the (anim)/ folder to prune after packing
    dir_rows: list[str]            # ['north','south','east','west'] | ['flat']
    frames_by_dir: dict[str, list[Path]]
    cols: int = 0
    rows: int = 0
    frame_w: int = 0
    frame_h: int = 0
    errors: list[str] = field(default_factory=list)


def _frame_pngs(d: Path) -> list[Path]:
    return sorted(p for p in d.iterdir() if p.is_file() and p.suffix.lower() == ".png")


def _order_dirs(dirs: list[str]) -> list[str]:
    known = [d for d in DIR_ORDER if d in dirs]
    extra = sorted(d for d in dirs if d not in DIR_ORDER)
    return known + extra


def plan_anim(entity_rel: str, anim_dir: Path) -> SheetPlan | None:
    """Classify an anim folder (directional / single-dir / flat) and size its grid."""
    anim = anim_dir.name
    if anim in SKIP_ANIMS:
        return None

    flat_pngs = _frame_pngs(anim_dir)
    subdirs = sorted(p for p in anim_dir.iterdir() if p.is_dir())

    frames_by_dir: dict[str, list[Path]] = {}
    if flat_pngs and not subdirs:
        frames_by_dir["flat"] = flat_pngs
    elif subdirs:
        for sd in subdirs:
            pngs = _frame_pngs(sd)
            if pngs:
                frames_by_dir[sd.name] = pngs
    if not frames_by_dir:
        return None

    total = sum(len(v) for v in frames_by_dir)
    if total <= 1:
        return None  # single-image set — leave as individual file

    dir_rows = ["flat"] if "flat" in frames_by_dir else _order_dirs(list(frames_by_dir))
    key = f"{entity_rel}/{anim}"
    sheet_file = anim_dir.parent / f"{anim}.png"
    public_path = "/" + sheet_file.relative_to("public").as_posix()

    plan = SheetPlan(
        key=key,
        public_path=public_path,
        sheet_file=sheet_file,
        anim_dir=anim_dir,
        dir_rows=dir_rows,
        frames_by_dir=frames_by_dir,
    )

    # Size the grid + validate uniform frame dims within the anim.
    plan.cols = max(len(v) for v in frames_by_dir.values())
    plan.rows = len(dir_rows)
    with Image.open(frames_by_dir[dir_rows[0]][0]) as im0:
        plan.frame_w, plan.frame_h = im0.size
    for d, pngs in frames_by_dir.items():
        for p in pngs:
            with Image.open(p) as im:
                if im.size != (plan.frame_w, plan.frame_h):
                    plan.errors.append(f"{p.relative_to('public')} is {im.size}, expected {(plan.frame_w, plan.frame_h)}")
    return plan


def discover(root: Path) -> list[SheetPlan]:
    plans: list[SheetPlan] = []
    for sub in SCAN_SUBDIRS:
        sub_root = root / sub
        if not sub_root.exists():
            continue
        for entity_dir in sorted(p for p in sub_root.iterdir() if p.is_dir()):
            anim_root = entity_dir / "animations"
            if not anim_root.exists():
                continue
            entity_rel = f"{sub}/{entity_dir.name}"
            for anim_dir in sorted(p for p in anim_root.iterdir() if p.is_dir()):
                plan = plan_anim(entity_rel, anim_dir)
                if plan:
                    plans.append(plan)
    return plans


def compose(plan: SheetPlan) -> Image.Image:
    sheet = Image.new("RGBA", (plan.cols * plan.frame_w, plan.rows * plan.frame_h), (0, 0, 0, 0))
    for row, d in enumerate(plan.dir_rows):
        for col, frame_path in enumerate(plan.frames_by_dir[d]):
            with Image.open(frame_path) as src:
                sheet.paste(src.convert("RGBA"), (col * plan.frame_w, row * plan.frame_h))
    return sheet


def emit_manifest(plans: list[SheetPlan]) -> str:
    lines = [
        "// AUTO-GENERATED by scripts/pack-sprite-sheets.py — DO NOT EDIT.",
        "// Regenerate from the per-frame source tree (before pruning) via that script.",
        "//",
        "// Geometry only: which grid each sprite sheet uses. The combat manifest",
        "// (combat-sprite-resolver.ts) remains the source of anim AVAILABILITY.",
        "",
        "export interface SheetEntry {",
        "  /** sheet path relative to public root, leading slash (feed to assetUrl) */",
        "  path: string;",
        "  cols: number;",
        "  rows: number;",
        "  /** row index per direction; row r holds that dir's frames left-to-right */",
        "  dirRows: string[];",
        "  /** true loop length per direction (<= cols); loader uses this, not cols */",
        "  frameCounts: Record<string, number>;",
        "}",
        "",
        "export const SPRITE_SHEET_MANIFEST: Record<string, SheetEntry> = {",
    ]
    for plan in sorted(plans, key=lambda p: p.key):
        counts = ", ".join(f"{d!r}: {len(plan.frames_by_dir[d])}" for d in plan.dir_rows)
        dirs = ", ".join(repr(d) for d in plan.dir_rows)
        lines.append(f"  {plan.key!r}: {{")
        lines.append(f"    path: {plan.public_path!r},")
        lines.append(f"    cols: {plan.cols}, rows: {plan.rows},")
        lines.append(f"    dirRows: [{dirs}],")
        lines.append(f"    frameCounts: {{ {counts} }},")
        lines.append("  },")
    lines.append("};")
    lines.append("")
    lines.append("/** Look up sheet geometry by entity folder + anim, e.g. ('characters/LS-SWORD-M', 'attack'). */")
    lines.append("export function getSheetEntry(entityKey: string, anim: string): SheetEntry | undefined {")
    lines.append("  return SPRITE_SHEET_MANIFEST[`${entityKey}/${anim}`];")
    lines.append("}")
    lines.append("")
    # Use single quotes in TS output; convert Python repr's quoting.
    return "\n".join(lines).replace('"', "'")


def main() -> int:
    ap = argparse.ArgumentParser(description="Pack sprite frames into per-anim sheets")
    ap.add_argument("--apply", action="store_true", help="Write sheet PNGs + manifest (default = dry-run)")
    ap.add_argument("--prune-frames", action="store_true", help="Delete packed frame folders after writing sheets (implies --apply)")
    ap.add_argument("--force", action="store_true", help="Re-encode sheets even if they already exist")
    ap.add_argument("--root", default=str(SPRITES_ROOT), help="Sprites root (default: public/sprites)")
    args = ap.parse_args()
    if args.prune_frames:
        args.apply = True

    root = Path(args.root).resolve()
    repo = Path.cwd().resolve()
    if not str(root).startswith(str(repo)):
        print(f"ERROR: --root {root} resolves outside repo {repo}", file=sys.stderr)
        return 1
    if not Path(args.root).exists():
        print(f"ERROR: {args.root} does not exist", file=sys.stderr)
        return 1

    plans = discover(Path(args.root))
    bad = [p for p in plans if p.errors]
    good = [p for p in plans if not p.errors]

    print(f"Discovered {len(plans)} packable animations.")
    frames_total = sum(sum(len(v) for v in p.frames_by_dir.values()) for p in good)
    framedirs_total = sum(len(p.frames_by_dir) for p in good)
    print(f"  frames packed  : {frames_total}")
    print(f"  frame-folders  : {framedirs_total} (collapse to {len(good)} sheets)")
    print(f"  entry delta    : ~-{frames_total - len(good)} files, ~-{framedirs_total + len(good)} dirs")
    print()
    print("Sample grids:")
    for p in good[:8]:
        cnt = ", ".join(f"{d}:{len(p.frames_by_dir[d])}" for d in p.dir_rows)
        print(f"  {p.cols}x{p.rows}  [{cnt}]  {p.key}")
    if any(p.cols * p.frame_w > MAX_SHEET_PX or p.rows * p.frame_h > MAX_SHEET_PX for p in good):
        print()
        for p in good:
            w, h = p.cols * p.frame_w, p.rows * p.frame_h
            if w > MAX_SHEET_PX or h > MAX_SHEET_PX:
                print(f"  WARN large sheet {w}x{h}px: {p.key}")
    if bad:
        print()
        print(f"SKIPPING {len(bad)} anim(s) with mismatched frame dims (frames kept):")
        for p in bad:
            print(f"  {p.key}: {p.errors[0]}")
    print()

    if not args.apply:
        print("DRY-RUN. Re-run with --apply to write sheets + manifest.")
        return 0

    if not good:
        print("No packable animations found — leaving existing manifest untouched (already migrated?).")
        return 0

    written = skipped = 0
    for p in good:
        if p.sheet_file.exists() and not args.force:
            skipped += 1
            continue
        compose(p).save(p.sheet_file)
        written += 1
    print(f"Sheets: wrote {written}, skipped {skipped} (already present).")

    MANIFEST_TS.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_TS.write_text(emit_manifest(good), encoding="utf-8")
    print(f"Manifest: wrote {MANIFEST_TS} ({len(good)} entries).")

    if args.prune_frames:
        pruned = 0
        for p in good:
            if p.anim_dir.exists():
                shutil.rmtree(p.anim_dir)
                pruned += 1
        print(f"Pruned {pruned} frame folders.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
