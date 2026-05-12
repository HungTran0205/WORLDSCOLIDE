"""
Generate procedural combat-arena assets for Phase 01 of the
combat-tiles + platformer redesign.

Outputs (all PNG, straight (non-premultiplied) alpha):

Base tiles — public/tiles/2d/
  32px/dirt-base_0001.png         32x32, opaque earthy noise
  32px/grass-edge_0001.png        32x32, grass top fading to dirt below
  64px/wood-plank_0001.png        64x64, horizontal plank seams
  64px/cracked-stone-wall_0001.png 64x64, vertical-tileable stone with cracks

Combat decals — public/decals/combat/
  grass-tuft-{1..3}.png           32x32, randomized blade strokes
  moss-patch-{1..2}.png           32x32, mottled green dot cloud
  crack-{1..4}.png                32x32, jagged dark line w/ branches
  pebble-cluster-{1..2}.png       32x32, small ellipses
  broken-edge-tile-{1..3}.png     64x32, jagged tile fragment with chunks missing

These are placeholder art — visually coherent enough for the new combat scene
spec but expected to be replaced by hand-painted assets later. The procedural
side keeps phase 02+ unblocked when concept-art picks fall through.

All tiles/decals use straight alpha so the FloorDecal alphaTest pipeline can
clip soft edges without halo. See generate_floor_decals.py for the AOE/lamp
sibling generator and code-standards.md → floor-decal section.

Run:
  .claude\\skills\\.venv\\Scripts\\python.exe scripts\\generate_combat_decals.py
"""

from __future__ import annotations

import math
import random
from pathlib import Path
from typing import Tuple

from PIL import Image, ImageDraw


REPO = Path(__file__).resolve().parent.parent
TILES_OUT = REPO / "public" / "tiles" / "2d"
DECALS_OUT = REPO / "public" / "decals" / "combat"

SEED = 0xC0DE  # deterministic across runs

RGBA = Tuple[int, int, int, int]


# ----------------------------- helpers ------------------------------------ #

def _rng(salt: str) -> random.Random:
    return random.Random(f"{SEED}:{salt}")


def _ensure_straight_alpha(img: Image.Image) -> Image.Image:
    """Pillow saves RGBA as straight alpha by default; this is a guard.

    We never call Image.alpha_composite onto an opaque background or perform
    any premultiplication step, so the output is straight alpha as long as the
    mode stays RGBA.
    """
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    return img


def _save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    _ensure_straight_alpha(img).save(path, "PNG")
    print(f"wrote {path.relative_to(REPO)}")


def _value_noise_tileable(
    rng: random.Random,
    w: int,
    h: int,
    cells_x: int,
    cells_y: int,
    *,
    tile_y: bool = False,
) -> list[list[float]]:
    """Wrap-aware bilinearly-interpolated value noise. Returns w×h grid in [0,1].

    If tile_y=True, vertical edges match (top row == bottom row sample).
    """
    grid_w = cells_x + 1
    grid_h = cells_y + 1
    grid = [[rng.random() for _ in range(grid_w)] for _ in range(grid_h)]
    if tile_y:
        for x in range(grid_w):
            grid[grid_h - 1][x] = grid[0][x]

    out = [[0.0] * w for _ in range(h)]
    for y in range(h):
        gy = (y / h) * cells_y
        y0 = int(gy)
        y1 = min(y0 + 1, grid_h - 1)
        ty = gy - y0
        ty = ty * ty * (3 - 2 * ty)  # smoothstep
        for x in range(w):
            gx = (x / w) * cells_x
            x0 = int(gx)
            x1 = min(x0 + 1, grid_w - 1)
            tx = gx - x0
            tx = tx * tx * (3 - 2 * tx)
            a = grid[y0][x0] * (1 - tx) + grid[y0][x1] * tx
            b = grid[y1][x0] * (1 - tx) + grid[y1][x1] * tx
            out[y][x] = a * (1 - ty) + b * ty
    return out


def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def _mix_color(c1: RGBA, c2: RGBA, t: float) -> RGBA:
    return (
        int(_lerp(c1[0], c2[0], t)),
        int(_lerp(c1[1], c2[1], t)),
        int(_lerp(c1[2], c2[2], t)),
        int(_lerp(c1[3], c2[3], t)),
    )


# ----------------------------- base tiles --------------------------------- #

def make_dirt_base() -> Image.Image:
    """32x32 opaque earthy noise — dark brown speckled with a few lighter pebbles."""
    rng = _rng("dirt-base")
    size = 32
    img = Image.new("RGBA", (size, size))
    px = img.load()
    n = _value_noise_tileable(rng, size, size, 6, 6)
    n2 = _value_noise_tileable(rng, size, size, 12, 12)
    base_dark = (52, 38, 28, 255)
    base_light = (96, 72, 50, 255)
    for y in range(size):
        for x in range(size):
            t = 0.65 * n[y][x] + 0.35 * n2[y][x]
            px[x, y] = _mix_color(base_dark, base_light, t)
    # Sprinkle a few darker pits + lighter granules
    for _ in range(8):
        x, y = rng.randrange(size), rng.randrange(size)
        px[x, y] = (28, 22, 18, 255)
    for _ in range(10):
        x, y = rng.randrange(size), rng.randrange(size)
        px[x, y] = (130, 100, 70, 255)
    return img


def make_grass_edge() -> Image.Image:
    """32x32 grass band on top fading to dirt below — readable as platform top."""
    rng = _rng("grass-edge")
    size = 32
    img = Image.new("RGBA", (size, size))
    px = img.load()
    n = _value_noise_tileable(rng, size, size, 8, 8)
    grass_dark = (54, 96, 38, 255)
    grass_light = (110, 168, 64, 255)
    dirt_dark = (52, 38, 28, 255)
    dirt_light = (96, 72, 50, 255)
    grass_band = 12  # top 12 rows = grass, then transition, then dirt
    transition = 6
    for y in range(size):
        for x in range(size):
            t = n[y][x]
            if y < grass_band:
                col = _mix_color(grass_dark, grass_light, t)
            elif y < grass_band + transition:
                blend = (y - grass_band) / transition
                grass_col = _mix_color(grass_dark, grass_light, t)
                dirt_col = _mix_color(dirt_dark, dirt_light, t)
                col = _mix_color(grass_col, dirt_col, blend)
            else:
                col = _mix_color(dirt_dark, dirt_light, t)
            px[x, y] = col
    # Spiky grass blade tips on the topmost rows
    draw = ImageDraw.Draw(img)
    for x in range(0, size, 2):
        h = rng.randint(1, 3)
        shade = rng.choice([grass_light, (140, 200, 90, 255), grass_dark])
        draw.line((x, 0, x, h), fill=shade, width=1)
    return img


def make_wood_plank() -> Image.Image:
    """64x64 horizontal wooden planks with seams + grain noise."""
    rng = _rng("wood-plank")
    size = 64
    img = Image.new("RGBA", (size, size))
    px = img.load()
    n = _value_noise_tileable(rng, size, size, 4, 16)  # more vertical bands → grain
    base_dark = (78, 52, 30, 255)
    base_light = (138, 96, 56, 255)
    for y in range(size):
        for x in range(size):
            t = n[y][x]
            px[x, y] = _mix_color(base_dark, base_light, t)
    # Plank seams (horizontal dark lines every ~16px)
    draw = ImageDraw.Draw(img)
    for seam_y in (15, 31, 47, 63):
        draw.line((0, seam_y, size - 1, seam_y), fill=(34, 22, 14, 255), width=1)
    # Sparse nail dots near seams
    for seam_y in (15, 31, 47):
        for nail_x in (4, size - 5):
            draw.point((nail_x, seam_y - 1), fill=(20, 14, 10, 255))
            draw.point((nail_x, seam_y + 1), fill=(20, 14, 10, 255))
    return img


def make_cracked_stone_wall() -> Image.Image:
    """64x64 stone wall, vertically tileable.

    Used for platform side faces. Tiles cleanly along Y so a tall wall stack
    has no visible seam between repeats.
    """
    rng = _rng("cracked-stone-wall")
    size = 64
    img = Image.new("RGBA", (size, size))
    px = img.load()
    n = _value_noise_tileable(rng, size, size, 6, 6, tile_y=True)
    n2 = _value_noise_tileable(rng, size, size, 14, 14, tile_y=True)
    stone_dark = (52, 50, 48, 255)
    stone_light = (118, 114, 108, 255)
    for y in range(size):
        for x in range(size):
            t = 0.7 * n[y][x] + 0.3 * n2[y][x]
            px[x, y] = _mix_color(stone_dark, stone_light, t)
    # Brick-style horizontal mortar lines (offset per row pair)
    draw = ImageDraw.Draw(img)
    mortar = (28, 26, 24, 255)
    rows = [10, 26, 42, 58]  # all multiples that keep top/bottom seam-clean
    for ry in rows:
        draw.line((0, ry, size - 1, ry), fill=mortar, width=1)
    # Vertical mortar half-stagger.
    # The brick row below the last mortar line wraps around to the top of the
    # tile, so we also draw its companion segment from y=0 down to the FIRST
    # mortar row using the SAME column offset — keeps top/bottom row pixels
    # matched for vertical tiling.
    for i, ry in enumerate(rows):
        offset = 0 if i % 2 == 0 else 32
        is_last = i == len(rows) - 1
        for vx in (offset, offset + 32 - 1):
            vx_w = vx % size
            top = ry
            bot = rows[i + 1] if not is_last else size - 1
            draw.line((vx_w, top, vx_w, bot), fill=mortar, width=1)
            if is_last:
                # Wrap segment: y=0 down to first mortar row, same column
                draw.line((vx_w, 0, vx_w, rows[0]), fill=mortar, width=1)
    # Couple of cracks (jagged polylines). Clamp y to [2, size-3] so crack pixels
    # never touch the wrap rows — keeps vertical tiling seam-clean.
    crack_min_y, crack_max_y = 2, size - 3
    for _ in range(2):
        cx = rng.randint(8, size - 8)
        cy = rng.randint(crack_min_y, crack_max_y)
        pts = [(cx, cy)]
        for _ in range(6):
            cx += rng.randint(-3, 3)
            cy += rng.randint(2, 5)
            pts.append((cx, max(crack_min_y, min(crack_max_y, cy))))
            if cy >= crack_max_y:
                break
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            draw.line((x0, y0, x1, y1), fill=(20, 18, 16, 255), width=1)
    return img


# ----------------------------- decals ------------------------------------- #

DECAL_SIZE = 32


def _new_decal(w: int = DECAL_SIZE, h: int = DECAL_SIZE) -> Image.Image:
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def make_grass_tuft(variant: int) -> Image.Image:
    """Cluster of grass blades, transparent background.

    Variants: 1 — small upright tuft. 2 — wider lean-left tuft. 3 — sparse trio.
    """
    rng = _rng(f"grass-tuft-{variant}")
    img = _new_decal()
    draw = ImageDraw.Draw(img)
    base_x = DECAL_SIZE // 2
    base_y = DECAL_SIZE - 4
    blade_count = (8, 14, 6)[variant - 1]
    spread = (5, 9, 11)[variant - 1]
    lean = (0, -2, 0)[variant - 1]
    blade_h_range = ((6, 12), (8, 14), (10, 16))[variant - 1]
    for _ in range(blade_count):
        bx = base_x + rng.randint(-spread, spread)
        bh = rng.randint(*blade_h_range)
        tip_x = bx + lean + rng.randint(-1, 1)
        tip_y = base_y - bh
        col = rng.choice([
            (54, 96, 38, 255),
            (78, 132, 50, 255),
            (110, 168, 64, 255),
            (140, 200, 90, 240),
        ])
        draw.line((bx, base_y, tip_x, tip_y), fill=col, width=1)
        # Small highlight tip
        draw.point((tip_x, tip_y), fill=(180, 220, 130, 255))
    return img


def make_moss_patch(variant: int) -> Image.Image:
    """Mottled green dot cloud — soft organic patch.

    Variants: 1 — round dense. 2 — elongated sparse.
    """
    rng = _rng(f"moss-patch-{variant}")
    img = _new_decal()
    draw = ImageDraw.Draw(img)
    cx, cy = DECAL_SIZE // 2, DECAL_SIZE // 2
    if variant == 1:
        rx, ry = 11, 10
        dot_count = 70
    else:
        rx, ry = 14, 7
        dot_count = 55
    for _ in range(dot_count):
        # Sample inside ellipse
        u = rng.random()
        ang = rng.uniform(0, 2 * math.pi)
        r = math.sqrt(u)
        x = int(cx + r * rx * math.cos(ang))
        y = int(cy + r * ry * math.sin(ang))
        if not (0 <= x < DECAL_SIZE and 0 <= y < DECAL_SIZE):
            continue
        col = rng.choice([
            (52, 90, 40, 230),
            (74, 120, 50, 220),
            (96, 148, 64, 220),
            (120, 170, 80, 200),
            (40, 70, 32, 230),
        ])
        size_d = rng.choice([1, 1, 1, 2])
        if size_d == 1:
            draw.point((x, y), fill=col)
        else:
            draw.ellipse((x, y, x + 1, y + 1), fill=col)
    # No blur: GaussianBlur on RGBA averages color and alpha together which
    # yields effectively-premultiplied soft edges. The dot density already
    # produces a mottled cluster; soft edges come from the dot ellipse falloff.
    return img


def make_crack(variant: int) -> Image.Image:
    """Jagged dark crack with optional branches.

    Variants 1-4 — different orientations and branch counts.
    """
    rng = _rng(f"crack-{variant}")
    img = _new_decal()
    draw = ImageDraw.Draw(img)
    # Choose start/end based on variant (different crack orientations)
    starts = [
        (4, 4),
        (DECAL_SIZE - 5, 6),
        (6, DECAL_SIZE - 5),
        (DECAL_SIZE // 2, 4),
    ]
    ends = [
        (DECAL_SIZE - 5, DECAL_SIZE - 5),
        (5, DECAL_SIZE - 6),
        (DECAL_SIZE - 6, 6),
        (DECAL_SIZE // 2 + 4, DECAL_SIZE - 5),
    ]
    sx, sy = starts[variant - 1]
    ex, ey = ends[variant - 1]

    def jagged_segments(x0: int, y0: int, x1: int, y1: int, jitter: int, steps: int) -> list[tuple[int, int]]:
        pts = [(x0, y0)]
        for i in range(1, steps):
            t = i / steps
            mx = int(_lerp(x0, x1, t)) + rng.randint(-jitter, jitter)
            my = int(_lerp(y0, y1, t)) + rng.randint(-jitter, jitter)
            pts.append((mx, my))
        pts.append((x1, y1))
        return pts

    main = jagged_segments(sx, sy, ex, ey, jitter=2, steps=10)
    crack_col = (28, 22, 20, 235)
    for (x0, y0), (x1, y1) in zip(main, main[1:]):
        draw.line((x0, y0, x1, y1), fill=crack_col, width=1)
    # Add 1-2 branches
    branches = rng.randint(1, 2)
    for _ in range(branches):
        bi = rng.randint(2, len(main) - 2)
        bx, by = main[bi]
        bex = bx + rng.randint(-8, 8)
        bey = by + rng.randint(-8, 8)
        bex = max(2, min(DECAL_SIZE - 3, bex))
        bey = max(2, min(DECAL_SIZE - 3, bey))
        bpts = jagged_segments(bx, by, bex, bey, jitter=1, steps=5)
        for (x0, y0), (x1, y1) in zip(bpts, bpts[1:]):
            draw.line((x0, y0, x1, y1), fill=crack_col, width=1)
    return img


def make_pebble_cluster(variant: int) -> Image.Image:
    """Small ellipses — 4-7 pebbles in a clump.

    Variants: 1 — tight cluster. 2 — scattered.
    """
    rng = _rng(f"pebble-cluster-{variant}")
    img = _new_decal()
    draw = ImageDraw.Draw(img)
    cx, cy = DECAL_SIZE // 2, DECAL_SIZE // 2 + 2
    spread = 4 if variant == 1 else 9
    count = rng.randint(4, 7)
    for _ in range(count):
        px = cx + rng.randint(-spread, spread)
        py = cy + rng.randint(-spread // 2, spread // 2)
        rx = rng.randint(1, 2)
        ry = rng.randint(1, 2)
        body = rng.choice([
            (110, 100, 90, 230),
            (130, 118, 100, 230),
            (88, 80, 70, 230),
            (148, 138, 120, 220),
        ])
        draw.ellipse((px - rx, py - ry, px + rx, py + ry), fill=body)
        # Highlight pixel
        draw.point((px - rx + 1, py - ry), fill=(190, 180, 160, 220))
        # Shadow pixel below
        sx_, sy_ = px, py + ry + 1
        if 0 <= sx_ < DECAL_SIZE and 0 <= sy_ < DECAL_SIZE:
            draw.point((sx_, sy_), fill=(40, 32, 24, 120))
    return img


def make_broken_edge_tile(variant: int) -> Image.Image:
    """64x32 jagged tile fragment with chunks missing — sits on platform edge.

    The PNG's bottom edge is mostly opaque (the surviving fragment); the top is
    jagged with chunks bitten out. Variants offset the bite pattern.
    """
    rng = _rng(f"broken-edge-tile-{variant}")
    w, h = 64, 32
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = img.load()
    n = _value_noise_tileable(rng, w, h, 8, 4)
    stone_dark = (74, 70, 64, 255)
    stone_light = (148, 142, 132, 255)
    # Fill rectangle with stone tint
    for y in range(h):
        for x in range(w):
            t = n[y][x]
            px[x, y] = _mix_color(stone_dark, stone_light, t)
    # Carve jagged top edge
    bite_offset = (variant - 1) * 12
    bite_xs = [bite_offset, bite_offset + 24, bite_offset + 48]
    for y in range(h):
        for x in range(w):
            jagged_top = 4 + int(3 * math.sin((x + variant * 7) * 0.6))
            # Add deeper bites
            for bx in bite_xs:
                bx_w = bx % w
                if abs(x - bx_w) < 4:
                    jagged_top += 6
            if y < jagged_top + rng.randint(-1, 1):
                px[x, y] = (0, 0, 0, 0)
    # Carve a missing chunk on the right side of fragment
    chunk_cx = (w - 8 + variant * 4) % w
    chunk_cy = h - 4
    for y in range(h):
        for x in range(w):
            dx = x - chunk_cx
            dy = y - chunk_cy
            if dx * dx + dy * dy < 18:
                px[x, y] = (0, 0, 0, 0)
    # Add a crack across the fragment
    draw = ImageDraw.Draw(img)
    cx0 = rng.randint(8, w - 8)
    cy0 = rng.randint(10, h - 6)
    cx1 = cx0 + rng.randint(-6, 6)
    cy1 = h - 1
    draw.line((cx0, cy0, cx1, cy1), fill=(30, 26, 24, 230), width=1)
    return img


# ----------------------------- driver ------------------------------------- #

def main() -> None:
    # Base tiles
    _save(make_dirt_base(), TILES_OUT / "32px" / "dirt-base_0001.png")
    _save(make_grass_edge(), TILES_OUT / "32px" / "grass-edge_0001.png")
    _save(make_wood_plank(), TILES_OUT / "64px" / "wood-plank_0001.png")
    _save(make_cracked_stone_wall(), TILES_OUT / "64px" / "cracked-stone-wall_0001.png")

    # Decals
    DECALS_OUT.mkdir(parents=True, exist_ok=True)
    for v in (1, 2, 3):
        _save(make_grass_tuft(v), DECALS_OUT / f"grass-tuft-{v}.png")
    for v in (1, 2):
        _save(make_moss_patch(v), DECALS_OUT / f"moss-patch-{v}.png")
    for v in (1, 2, 3, 4):
        _save(make_crack(v), DECALS_OUT / f"crack-{v}.png")
    for v in (1, 2):
        _save(make_pebble_cluster(v), DECALS_OUT / f"pebble-cluster-{v}.png")
    for v in (1, 2, 3):
        _save(make_broken_edge_tile(v), DECALS_OUT / f"broken-edge-tile-{v}.png")


if __name__ == "__main__":
    main()
