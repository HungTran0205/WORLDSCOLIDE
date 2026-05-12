"""
Generate placeholder PNG decals for Phase 08 — AOE Telegraph.

Outputs (256x256, straight alpha):
- public/decals/floor/aoe-circle.png — radial border + crosshatch grid inside
- public/decals/floor/aoe-cone.png   — 90deg cone shape pointing +X axis
- public/decals/floor/aoe-rect.png   — rectangle border with crosshatch fill

Pattern strategy: dual ring + faint inner crosshatch grid.
Read at low opacity gives subtle "danger zone" feel; lock phase tints solid red
via mesh material color so PNG itself stays color-neutral (mostly white) for
tinting flexibility (red enemy attack vs blue ally heal AOE).

Run:
  .claude\\skills\\.venv\\Scripts\\python.exe scripts\\generate_aoe_decals.py
"""

from PIL import Image, ImageDraw
from pathlib import Path
import math

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "decals" / "floor"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SIZE = 256
CENTER = SIZE // 2
WHITE = (255, 255, 255, 230)
DIM = (255, 255, 255, 90)


def _crosshatch(draw: ImageDraw.ImageDraw, mask: callable, step: int = 16) -> None:
    """Draw light crosshatch lines inside region defined by mask(x,y) -> bool."""
    for d in range(-SIZE, SIZE * 2, step):
        # Diagonal /
        for t in range(0, SIZE, 2):
            x = d + t
            y = t
            if 0 <= x < SIZE and 0 <= y < SIZE and mask(x, y):
                draw.point((x, y), fill=DIM)
        # Diagonal \
        for t in range(0, SIZE, 2):
            x = d + t
            y = SIZE - 1 - t
            if 0 <= x < SIZE and 0 <= y < SIZE and mask(x, y):
                draw.point((x, y), fill=DIM)


def make_circle() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    outer_r = (SIZE // 2) - 6
    inner_r = outer_r - 6

    def in_ring(x: int, y: int) -> bool:
        dx = x - CENTER
        dy = y - CENTER
        return (dx * dx + dy * dy) <= (outer_r * outer_r)

    _crosshatch(draw, in_ring)
    # Outer ring
    draw.ellipse(
        (CENTER - outer_r, CENTER - outer_r, CENTER + outer_r, CENTER + outer_r),
        outline=WHITE, width=4,
    )
    # Inner faint ring
    draw.ellipse(
        (CENTER - inner_r, CENTER - inner_r, CENTER + inner_r, CENTER + inner_r),
        outline=DIM, width=2,
    )
    # Center crosshair
    cx_len = 18
    draw.line((CENTER - cx_len, CENTER, CENTER + cx_len, CENTER), fill=WHITE, width=2)
    draw.line((CENTER, CENTER - cx_len, CENTER, CENTER + cx_len), fill=WHITE, width=2)
    return img


def make_cone() -> Image.Image:
    """90-degree cone, apex at left edge, fans toward +X (right)."""
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    apex = (8, CENTER)
    half_angle = math.radians(45)
    far_x = SIZE - 8
    # Polygon: apex → top-right corner of cone → bottom-right corner of cone
    top = (far_x, CENTER - int(math.tan(half_angle) * (far_x - apex[0])))
    bot = (far_x, CENTER + int(math.tan(half_angle) * (far_x - apex[0])))

    poly = [apex, top, bot]

    def in_cone(x: int, y: int) -> bool:
        if x < apex[0]:
            return False
        dx = x - apex[0]
        if dx == 0:
            return False
        slope = abs(y - apex[1]) / dx
        return slope <= math.tan(half_angle) and x <= far_x

    _crosshatch(draw, in_cone)
    # Border
    draw.line([apex, top], fill=WHITE, width=4)
    draw.line([apex, bot], fill=WHITE, width=4)
    draw.line([top, bot], fill=WHITE, width=4)
    # Inner arc-style mid divider (faint)
    mid_far = (apex[0] + (far_x - apex[0]) // 2, CENTER)
    draw.line([apex, mid_far], fill=DIM, width=1)
    return img


def make_rect() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pad = 8
    inner_pad = pad + 6

    def in_rect(x: int, y: int) -> bool:
        return pad <= x < SIZE - pad and pad <= y < SIZE - pad

    _crosshatch(draw, in_rect)
    # Outer border
    draw.rectangle((pad, pad, SIZE - pad - 1, SIZE - pad - 1), outline=WHITE, width=4)
    # Inner faint border
    draw.rectangle(
        (inner_pad, inner_pad, SIZE - inner_pad - 1, SIZE - inner_pad - 1),
        outline=DIM, width=2,
    )
    # Corner brackets accent
    bracket = 22
    for cx, cy, dx, dy in [
        (pad, pad, 1, 1),
        (SIZE - pad - 1, pad, -1, 1),
        (pad, SIZE - pad - 1, 1, -1),
        (SIZE - pad - 1, SIZE - pad - 1, -1, -1),
    ]:
        draw.line((cx, cy, cx + dx * bracket, cy), fill=WHITE, width=4)
        draw.line((cx, cy, cx, cy + dy * bracket), fill=WHITE, width=4)
    return img


def main() -> None:
    out = {
        "aoe-circle.png": make_circle(),
        "aoe-cone.png": make_cone(),
        "aoe-rect.png": make_rect(),
    }
    for name, img in out.items():
        path = OUT_DIR / name
        img.save(path, "PNG")
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
