"""
Normalize concept-art extracted tiles into a fixed N×N grid square.

Reads PNGs from an input directory (e.g. docs/concept-art/extracted_tiles/<set>/)
and writes resized, center-cropped square copies into
public/tiles/2d/{N}px/<prefix>_{NNNN}.png.

Aspect handling: each input is downscaled so the SHORTER side equals N, then
center-cropped to N×N. This preserves texture density at the cost of trimming
the long axis. For tiles where this loses important detail, edit the source PNG
manually before running.

Output is straight-alpha RGBA (no premultiply) so it composes cleanly with the
combat scene's alphaTest pipeline.

Run:
  .claude\\skills\\.venv\\Scripts\\python.exe scripts\\normalize_concept_tiles.py \\
      --input docs/concept-art/extracted_tiles/tileset_rmbg \\
      --size 32 \\
      --prefix dirt-base
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT = REPO_ROOT / "public" / "tiles" / "2d"


def normalize_one(src: Path, size: int) -> Image.Image:
    """Resize so shorter side == size, then center-crop to size×size."""
    with Image.open(src) as raw:
        img = raw.convert("RGBA")
    w, h = img.size
    scale = size / min(w, h)
    new_w = max(size, int(round(w * scale)))
    new_h = max(size, int(round(h * scale)))
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - size) // 2
    top = (new_h - size) // 2
    return img.crop((left, top, left + size, top + size))


def run(input_dir: Path, size: int, prefix: str, out_root: Path, limit: int | None) -> int:
    if size not in (32, 64, 128):
        raise SystemExit(f"size must be 32, 64, or 128 (got {size})")
    if not input_dir.is_dir():
        raise SystemExit(f"input dir not found: {input_dir}")

    out_dir = out_root / f"{size}px"
    out_dir.mkdir(parents=True, exist_ok=True)

    sources = sorted(p for p in input_dir.glob("*.png") if p.is_file())
    if limit is not None:
        sources = sources[:limit]
    if not sources:
        print(f"no PNGs found in {input_dir}")
        return 0

    written = 0
    for idx, src in enumerate(sources, start=1):
        out = out_dir / f"{prefix}_{idx:04d}.png"
        normalize_one(src, size).save(out, "PNG")
        print(f"wrote {out.relative_to(REPO_ROOT)}")
        written += 1
    return written


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("--input", required=True, help="directory containing source PNGs")
    ap.add_argument("--size", type=int, default=32, help="target square size (32, 64, or 128)")
    ap.add_argument("--prefix", required=True, help="output filename prefix, e.g. dirt-base")
    ap.add_argument("--out-root", default=str(DEFAULT_OUT), help="output root (default: public/tiles/2d)")
    ap.add_argument("--limit", type=int, default=None, help="only process first N inputs")
    args = ap.parse_args()

    count = run(
        input_dir=Path(args.input),
        size=args.size,
        prefix=args.prefix,
        out_root=Path(args.out_root),
        limit=args.limit,
    )
    print(f"\n{count} tile(s) written.")


if __name__ == "__main__":
    main()
