"""
Post-process the Gemini-generated training-yard wall panels:

1. Strip the Gemini visible watermark — a light neutral-grey "diamond/sparkle"
   baked into the BOTTOM-RIGHT corner. Detected by its low-saturation bright
   pixels and patched over by copying the equivalent region just to its left
   (textures continue seamlessly).
2. Cliff  -> opaque RGB panel (just de-watermarked).
3. Railing -> chroma-key the flat #FF00FF magenta to transparent (open top +
   gaps between posts), with edge despill so no pink fringe remains.

Inputs  (raw Gemini output, NOT shipped):
  d:/tmp/training-yard-concept/wall-cliff.png
  d:/tmp/training-yard-concept/wall-railing-raw.png
Outputs (shipped):
  public/training-yard/LinhSon/wall-cliff.png    (opaque)
  public/training-yard/LinhSon/wall-railing.png  (RGBA, keyed)

Run:
  python scripts/process_training_yard_walls.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path("d:/tmp/training-yard-concept")
OUT = ROOT / "public" / "training-yard" / "LinhSon"
OUT.mkdir(parents=True, exist_ok=True)


def find_watermark_bbox(rgb: np.ndarray) -> tuple[int, int, int, int] | None:
    """Locate the Gemini sparkle in a TIGHT bottom-right corner box: the only
    thing there with bright + neutral (near-zero saturation) pixels. Search is
    restricted to the corner so saturated art (tan timber, cyan crystal) can't
    false-trigger."""
    h, w, _ = rgb.shape
    x0, y0 = int(w * 0.84), int(h * 0.78)
    sub = rgb[y0:, x0:].astype("int32")
    r, g, b = sub[..., 0], sub[..., 1], sub[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    mask = (mx > 110) & ((mx - mn) < 35)           # bright + neutral grey sparkle
    if mask.sum() < 60:
        return None
    ys, xs = np.where(mask)
    pad = 16
    return (
        max(0, xs.min() - pad) + x0,
        max(0, ys.min() - pad) + y0,
        min(w, xs.max() + pad) + x0,
        min(h, ys.max() + pad) + y0,
    )


def strip_watermark(img: Image.Image, box: tuple[int, int, int, int], feather: int = 12) -> Image.Image:
    """Patch the watermark bbox by copying the same-height region to its left,
    blended with a feathered mask so no hard rectangle seam shows. The inner
    (fully-opaque) core stays larger than the sparkle; only the border cross-
    fades into the original texture."""
    rgb = np.asarray(img.convert("RGB")).astype("float32")
    bx0, by0, bx1, by1 = box
    bw, bh = bx1 - bx0, by1 - by0
    src_x1 = bx0 - 8
    src_x0 = src_x1 - bw
    if src_x0 < 0:                                  # fall back to a right-side source
        src_x0, src_x1 = bx1 + 8, bx1 + 8 + bw

    # Feather mask: 1 in the core, ramping to 0 across `feather` px at each edge.
    fx = np.clip(np.minimum(np.arange(bw), bw - 1 - np.arange(bw)) / feather, 0, 1)
    fy = np.clip(np.minimum(np.arange(bh), bh - 1 - np.arange(bh)) / feather, 0, 1)
    m = (fy[:, None] * fx[None, :])[..., None]      # (bh,bw,1)

    dst = rgb[by0:by1, bx0:bx1]
    src = rgb[by0:by1, src_x0:src_x1]
    rgb[by0:by1, bx0:bx1] = dst * (1 - m) + src * m
    return Image.fromarray(np.clip(rgb, 0, 255).astype("uint8"), "RGB")


def key_magenta(img: Image.Image) -> Image.Image:
    """#FF00FF -> transparent, with despill of pink edge fringe."""
    arr = np.asarray(img.convert("RGB")).astype("int32")
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    magenta = (r > 150) & (b > 150) & (g < 110)
    # Despill: anywhere magenta tints an edge (R&B both above G), pull R,B down
    # toward G so no pink halo survives the alpha cut.
    spill = (r > g + 25) & (b > g + 25) & ~magenta
    cap = (g * 1.1 + 28)
    out = arr.copy()
    out[..., 0] = np.where(spill, np.minimum(r, cap), r)
    out[..., 2] = np.where(spill, np.minimum(b, cap), b)
    rgba = np.dstack([out.astype("uint8"), np.where(magenta, 0, 255).astype("uint8")])
    return Image.fromarray(rgba, "RGBA")


def main() -> None:
    cliff_img = Image.open(SRC / "wall-cliff.png")
    rail_img = Image.open(SRC / "wall-railing-raw.png")

    # Detect on the cliff (clean neutral sparkle on dark rock); the railing is
    # the same model + size so the watermark sits at the identical spot — reuse
    # the box rather than re-detecting on busy timber.
    box = find_watermark_bbox(np.asarray(cliff_img.convert("RGB")))
    if box is None:
        raise SystemExit("watermark not found on cliff — inspect manually")
    print(f"watermark bbox {box} (shared by both, same image size)")

    cliff_path = OUT / "wall-cliff.png"
    strip_watermark(cliff_img, box).save(cliff_path)
    print(f"wrote {cliff_path}")

    rail_path = OUT / "wall-railing.png"
    key_magenta(strip_watermark(rail_img, box)).save(rail_path)
    print(f"wrote {rail_path}")


if __name__ == "__main__":
    main()
