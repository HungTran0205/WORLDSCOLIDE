"""
Generate placeholder PNG decals for Phase 07 — FloorDecal atmospheric overlay.

Outputs:
- public/decals/floor/lamp-pool.png   — 256x256 radial soft warm-yellow gradient
- public/decals/floor/magic-rune-circle.png — 256x256 ring with cross + 4 ticks

Both PNGs use straight (non-premultiplied) alpha so the FloorDecal alphaTest
can clip soft edges cleanly without a halo.

Sibling generators:
- generate_aoe_decals.py     — AOE telegraph shapes (circle/cone/rect)
- generate_combat_decals.py  — combat-arena base tiles + tuft/moss/crack/pebble
                               /broken-edge decal palette (Phase 01 of the
                               combat-tiles + platformer redesign)

Run:
  .claude/skills/.venv/Scripts/python.exe scripts/generate_floor_decals.py
"""

from PIL import Image, ImageDraw
from pathlib import Path
import math

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "decals" / "floor"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SIZE = 256
CENTER = SIZE // 2


def make_lamp_pool() -> Image.Image:
    """Radial gradient: warm yellow (#ffd66a) center → fully transparent edge."""
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    px = img.load()
    max_r = SIZE / 2
    for y in range(SIZE):
        for x in range(SIZE):
            dx = x - CENTER + 0.5
            dy = y - CENTER + 0.5
            r = math.sqrt(dx * dx + dy * dy)
            if r >= max_r:
                continue
            t = r / max_r
            # Smooth falloff: t=0 alpha=255, t=1 alpha=0, soft tail near edge
            falloff = (1.0 - t) ** 1.8
            alpha = int(255 * falloff)
            # Slight color hue shift — hotter center, cooler ring
            r_c = int(255 - 8 * t)
            g_c = int(214 - 30 * t)
            b_c = int(106 + 10 * t)
            px[x, y] = (r_c, g_c, b_c, alpha)
    return img


def make_rune_circle() -> Image.Image:
    """Single ring + small ticks + inner cross. Purple (#a774ff) on transparent."""
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    purple = (167, 116, 255, 230)
    # Outer ring
    outer = SIZE - 16
    draw.ellipse(
        (8, 8, 8 + outer, 8 + outer),
        outline=purple,
        width=4,
    )
    # Inner ring
    inner = SIZE - 80
    inset = (SIZE - inner) // 2
    draw.ellipse(
        (inset, inset, inset + inner, inset + inner),
        outline=purple,
        width=2,
    )
    # 4 cardinal ticks
    tick_len = 14
    for ang_deg in (0, 90, 180, 270):
        ang = math.radians(ang_deg)
        cx = CENTER + math.cos(ang) * (outer / 2 + 4)
        cy = CENTER + math.sin(ang) * (outer / 2 + 4)
        ex = CENTER + math.cos(ang) * (outer / 2 + 4 + tick_len)
        ey = CENTER + math.sin(ang) * (outer / 2 + 4 + tick_len)
        draw.line((cx, cy, ex, ey), fill=purple, width=3)
    # Inner cross
    draw.line((CENTER, inset + 12, CENTER, inset + inner - 12), fill=purple, width=2)
    draw.line((inset + 12, CENTER, inset + inner - 12, CENTER), fill=purple, width=2)
    return img


def main() -> None:
    lamp_path = OUT_DIR / "lamp-pool.png"
    rune_path = OUT_DIR / "magic-rune-circle.png"

    make_lamp_pool().save(lamp_path, "PNG")
    print(f"wrote {lamp_path}")

    make_rune_circle().save(rune_path, "PNG")
    print(f"wrote {rune_path}")


if __name__ == "__main__":
    main()
