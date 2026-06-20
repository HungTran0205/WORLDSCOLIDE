"""
Generate the Training Yard ground decal — a worn packed-earth sparring CIRCLE
that overlays the grass <TiledFloor> (grass shows through the feathered rim).

Color sync: the dirt palette is sampled DIRECTLY from the existing dirt tile
(tiles/2d/32px/dirt-base_0001.png) — the same brown already in the forest-grass
dirt-patch variants — then lifted for the daylight yard. The surface itself is
NOT tiled (tiling read as an obvious checkerboard); it is painted from a chunky
value-noise field so it looks like one organic, seamless patch of earth.

Output:
- public/decals/floor/training-yard-dirt-circle.png  (512², straight alpha)
- (preview) scripts/_preview-training-yard-ground.png (grass + circle composite,
  NOT shipped — eyeball the look without launching the game)

Run:
  python scripts/generate_training_yard_ground.py
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
TILE_DIR = ROOT / "public" / "tiles" / "2d" / "32px"
OUT_DIR = ROOT / "public" / "decals" / "floor"
OUT_DIR.mkdir(parents=True, exist_ok=True)

DIRT_TILE = TILE_DIR / "dirt-base_0001.png"
GRASS_MAIN = TILE_DIR / "forest-grass-32_0003.png"
GRASS_VARIANTS = [
    TILE_DIR / "forest-grass-32_0001.png",
    TILE_DIR / "forest-grass-32_0004.png",
    TILE_DIR / "forest-grass-32_0005.png",
]

SIZE = 512          # decal resolution
NOISE_RES = 128     # chunky noise cells (4px blocks at 512) → pixel-art feel
LIFT = 1.42         # brighten the sampled dirt for the daylight yard
SEED = 7

random.seed(SEED)
RNG = np.random.default_rng(SEED)


def dirt_palette() -> np.ndarray:
    """5 browns (dark→light) sampled from the real dirt tile, then lifted.
    Keeps the patch in exact hue-sync with the floor's dirt while reading
    bright enough for an unlit decal under daylight."""
    src = np.asarray(Image.open(DIRT_TILE).convert("RGB")).reshape(-1, 3).astype("float32")
    lum = src @ np.array([0.299, 0.587, 0.114], dtype="float32")
    order = np.argsort(lum)
    srt = src[order]
    n = len(srt)
    stops = (0.10, 0.32, 0.52, 0.72, 0.92)
    pal = np.stack([srt[int(s * (n - 1))] for s in stops])
    # Widen the range a touch so the noise has real light/dark to play with.
    mid = pal[2]
    pal = mid + (pal - mid) * 1.35
    return np.clip(pal * LIFT, 0, 255)


def value_noise(res: int, octaves: int) -> np.ndarray:
    """fBm value-noise in [0,1] — low octaves give big organic blotches that
    span the whole patch (no tile seams)."""
    acc = np.zeros((res, res), dtype="float32")
    amp = 1.0
    total = 0.0
    for o in range(octaves):
        f = 2 ** o + 1
        grid = RNG.random((f, f)).astype("float32")
        up = np.asarray(
            Image.fromarray((grid * 255).astype("uint8")).resize((res, res), Image.BILINEAR),
            dtype="float32",
        ) / 255.0
        acc += amp * up
        total += amp
        amp *= 0.5
    return acc / total


def build_dirt(size: int) -> Image.Image:
    """Paint the dirt from the palette via fBm noise, upscaled chunky."""
    pal = dirt_palette()                       # (5,3)
    t = value_noise(NOISE_RES, octaves=4)      # (128,128) in [0,1]
    # contrast curve so most of it is mid-tone with occasional dark/light
    t = np.clip((t - 0.5) * 1.25 + 0.5, 0, 1)
    idx = t * (len(pal) - 1)
    lo = np.floor(idx).astype(int)
    hi = np.clip(lo + 1, 0, len(pal) - 1)
    frac = (idx - lo)[..., None]
    col = pal[lo] * (1 - frac) + pal[hi] * frac      # (128,128,3)
    small = Image.fromarray(col.astype("uint8"), "RGB")
    img = small.resize((size, size), Image.NEAREST)  # 4px chunky blocks
    img = scatter_detail(img, size, pal)
    return radial_dish(img, size)


def scatter_detail(img: Image.Image, size: int, pal: np.ndarray) -> Image.Image:
    """Pebbles + hairline cracks so the surface reads as trodden earth, not a
    flat fill. Colors derive from the same palette (dark cracks, pale pebbles)."""
    draw = ImageDraw.Draw(img)
    dark = tuple(int(c) for c in np.clip(pal[0] * 0.7, 0, 255))
    pale = tuple(int(c) for c in np.clip(pal[4] * 1.12, 0, 255))
    mid = tuple(int(c) for c in pal[1])
    block = size // NOISE_RES  # 4

    # Pebble clusters
    for _ in range(46):
        cx = random.randint(0, size - 1)
        cy = random.randint(0, size - 1)
        for _ in range(random.randint(1, 4)):
            ox = cx + random.randint(-3, 3) * block
            oy = cy + random.randint(-3, 3) * block
            s = block * random.randint(1, 2)
            col = pale if random.random() < 0.6 else mid
            draw.rectangle((ox, oy, ox + s, oy + s), fill=col)

    # Hairline cracks — short jagged chains of dark blocks
    for _ in range(7):
        x = random.randint(size // 5, size * 4 // 5)
        y = random.randint(size // 5, size * 4 // 5)
        ang = random.random() * 2 * math.pi
        for _ in range(random.randint(8, 18)):
            ang += random.uniform(-0.5, 0.5)
            x += math.cos(ang) * block * 1.5
            y += math.sin(ang) * block * 1.5
            draw.rectangle((x, y, x + block, y + block), fill=dark)
    return img


def radial_dish(img: Image.Image, size: int) -> Image.Image:
    """Very subtle bowl shading: faintly brighter trodden center, slightly
    darker damp rim. Kept gentle so it never bands."""
    arr = np.asarray(img).astype("float32")
    cc = size / 2.0
    ys, xs = np.mgrid[0:size, 0:size]
    r = np.sqrt((xs - cc) ** 2 + (ys - cc) ** 2) / cc
    mult = np.clip(1.08 - 0.16 * r, 0.92, 1.08)[..., None]
    return Image.fromarray(np.clip(arr * mult, 0, 255).astype("uint8"), "RGB")


def build_alpha(size: int) -> Image.Image:
    """Radial alpha: solid core, feathered worn rim, irregular wobbly edge."""
    cc = size / 2.0
    r_solid, r_edge = 0.66, 0.93
    ys, xs = np.mgrid[0:size, 0:size]
    dx = xs - cc + 0.5
    dy = ys - cc + 0.5
    r = np.sqrt(dx * dx + dy * dy) / cc
    theta = np.arctan2(dy, dx)
    w = (
        0.060 * np.sin(theta * 3 + 0.7)
        + 0.038 * np.sin(theta * 5 + 2.1)
        + 0.025 * np.sin(theta * 8 + 4.3)
        + 0.018 * np.sin(theta * 13 + 1.2)
    )
    edge = r_edge * (1.0 + w)
    solid = r_solid * (1.0 + w)
    t = np.clip((edge - r) / np.maximum(edge - solid, 1e-4), 0.0, 1.0)
    a = t * t * (3 - 2 * t)
    noise = RNG.random((size, size))
    rim = (r > solid) & (r < edge + 0.05)
    a = np.where(rim & (noise < 0.20), a * 0.30, a)
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype("uint8"), "L")


def make_dirt_circle() -> Image.Image:
    out = build_dirt(SIZE).convert("RGBA")
    out.putalpha(build_alpha(SIZE))
    return out


def make_preview(circle: Image.Image) -> Image.Image:
    """Eyeball check: tile grass to a field, drop the circle + tufts in."""
    field_tiles = 14
    cell = 32 * 4
    field = field_tiles * cell
    grass_imgs = [Image.open(GRASS_MAIN).convert("RGB")] + [
        Image.open(p).convert("RGB") for p in GRASS_VARIANTS
    ]
    cells = [g.resize((cell, cell), Image.NEAREST) for g in grass_imgs]
    out = Image.new("RGB", (field, field))
    for ty in range(field_tiles):
        for tx in range(field_tiles):
            g = cells[0] if random.random() > 0.25 else random.choice(cells[1:])
            out.paste(g, (tx * cell, ty * cell))
    d = int(field * 4 / 7)
    c = circle.resize((d, d), Image.NEAREST)
    off = (field - d) // 2
    out = out.convert("RGBA")
    out.alpha_composite(c, (off, off))

    tuft_imgs = []
    for p in ("grass-tuft-1.png", "grass-tuft-2.png", "grass-tuft-3.png"):
        tp = ROOT / "public" / "decals" / "combat" / p
        if tp.exists():
            tuft_imgs.append(Image.open(tp).convert("RGBA"))
    if tuft_imgs:
        cx0 = cy0 = field / 2
        hole = d / 2 * 0.9
        for _ in range(150):
            ang = random.random() * 2 * math.pi
            rad = (0.30 + 0.68 * random.random()) * (field / 2)
            tx = cx0 + math.cos(ang) * rad
            ty = cy0 + math.sin(ang) * rad
            if math.hypot(tx - cx0, ty - cy0) < hole:
                continue
            t = random.choice(tuft_imgs)
            s = int(cell * (0.45 + 0.4 * random.random()))
            tw = int(s * t.width / t.height)
            ts = t.resize((tw, s), Image.NEAREST)
            out.alpha_composite(ts, (int(tx - tw / 2), int(ty - s)))
    return out.convert("RGB")


def main() -> None:
    circle = make_dirt_circle()
    out_path = OUT_DIR / "training-yard-dirt-circle.png"
    circle.save(out_path, "PNG")
    print(f"wrote {out_path}  ({out_path.stat().st_size // 1024} KB)")

    prev_path = Path(__file__).resolve().parent / "_preview-training-yard-ground.png"
    make_preview(circle).save(prev_path, "PNG")
    print(f"wrote {prev_path}  (preview, not shipped)")


if __name__ == "__main__":
    main()
