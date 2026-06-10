"""
Generate the Training Yard FOUNDATION side texture — the vertical face of the
raised earth plot, so the platform reads as a solid 3D foundation (grass on top,
soil, then rock cliff) instead of a flat cardboard plane.

Composition (top -> bottom of the strip):
- thin GRASS/ROOT fringe (sampled from the grass tile) where the turf caps the edge
- a band of packed SOIL (sampled from dirt-base_0001 — same brown as the dirt
  sparring circle, so it stays in palette)
- the ROCK CLIFF below it, sampled straight from the already-de-watermarked
  wall-cliff.png so the foundation matches the cliff WALL exactly
- darkened toward the bottom so it dissolves into the void the diorama floats in

Output:
  public/training-yard/LinhSon/foundation.png  (opaque, mapped onto the 2 front
  faces of the foundation box)

Run:
  python scripts/generate_training_yard_foundation.py
"""

from __future__ import annotations

import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
LS = ROOT / "public" / "training-yard" / "LinhSon"
TILE = ROOT / "public" / "tiles" / "2d" / "32px"
CLIFF = LS / "wall-cliff.png"
DIRT = TILE / "dirt-base_0001.png"
GRASS = TILE / "forest-grass-32_0003.png"

W, H = 1200, 360
SOIL_FRAC = 0.26          # top fraction that is grass-fringe + soil
SEED = 11
random.seed(SEED)
RNG = np.random.default_rng(SEED)


def avg_rgb(path: Path) -> np.ndarray:
    a = np.asarray(Image.open(path).convert("RGB")).reshape(-1, 3).astype("float32")
    return a.mean(0)


def build_soil(w: int, h: int) -> np.ndarray:
    """Packed-earth band: dirt-base brown (lifted) with per-pixel speckle."""
    base = np.clip(avg_rgb(DIRT) * 1.32, 0, 255)          # ~#5f4631
    arr = np.tile(base, (h, w, 1))
    speck = (RNG.random((h, w, 1)) - 0.5) * 26
    arr = np.clip(arr + speck, 0, 255)
    # darken toward the bottom of the soil band so it meets the rock
    grad = np.linspace(1.06, 0.82, h)[:, None, None]
    return np.clip(arr * grad, 0, 255)


def main() -> None:
    cliff = Image.open(CLIFF).convert("RGB")
    cw, ch = cliff.size
    soil_h = int(H * SOIL_FRAC)

    # Full-height soil and rock layers, then a smooth vertical blend so the
    # soil->rock transition (centred at soil_h, ±f px) is feathered, not a line.
    soil_full = build_soil(W, H)
    rock_full = np.asarray(
        cliff.crop((0, int(ch * 0.16), cw, int(ch * 0.94))).resize((W, H), Image.BILINEAR),
        dtype="float32",
    )
    f = 30
    ramp = np.clip((soil_h + f - np.arange(H)) / (2 * f), 0.0, 1.0)[:, None, None]  # 1 top → 0 bottom
    canvas = soil_full * ramp + rock_full * (1 - ramp)

    img = Image.fromarray(np.clip(canvas, 0, 255).astype("uint8"), "RGB")
    draw = ImageDraw.Draw(img)

    # Grass/root fringe along the very top edge — short green blades sampled from
    # the grass tile color, drooping over the soil lip.
    g = np.clip(avg_rgb(GRASS) * 1.15, 0, 255).astype(int)
    gcol = (int(g[0]), int(g[1]), int(g[2]))
    gdark = (int(g[0] * 0.6), int(g[1] * 0.65), int(g[2] * 0.55))
    for x in range(0, W, 3):
        blade = random.randint(6, 16)
        col = gcol if random.random() < 0.7 else gdark
        draw.line((x, 0, x + random.randint(-2, 2), blade), fill=col, width=2)

    # A few roots dangling from the soil into the rock.
    root = (60, 44, 30)
    for _ in range(14):
        x = random.randint(0, W - 1)
        y = soil_h - random.randint(0, 10)
        for _ in range(random.randint(4, 10)):
            x += random.randint(-3, 3)
            y += random.randint(4, 9)
            draw.line((x, y - 6, x, y), fill=root, width=2)

    # Darken the bottom quarter so the slab fades into the void.
    arr = np.asarray(img).astype("float32")
    grad = np.ones(H)
    q = int(H * 0.72)
    grad[q:] = np.linspace(1.0, 0.5, H - q)
    arr *= grad[:, None, None]
    out = Image.fromarray(np.clip(arr, 0, 255).astype("uint8"), "RGB")

    out_path = LS / "foundation.png"
    out.save(out_path)
    print(f"wrote {out_path}  ({out_path.stat().st_size // 1024} KB, {W}x{H})")


if __name__ == "__main__":
    main()
