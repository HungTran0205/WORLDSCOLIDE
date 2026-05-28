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


def _bird(draw: ImageDraw.ImageDraw, x: float, y: float, ang: float, L: float, col) -> None:
    """Stylized Lạc heron silhouette (long beak + swept wing), flight axis = ang."""
    ca, sa = math.cos(ang), math.sin(ang)

    def P(fx: float, fy: float):
        return (x + fx * ca - fy * sa, y + fx * sa + fy * ca)

    body = [
        P(L, 0), P(L * 0.5, -L * 0.16), P(0, -L * 0.42),
        P(-L * 0.95, -L * 0.16), P(-L * 0.5, 0),
        P(-L * 0.95, L * 0.16), P(0, L * 0.22), P(L * 0.5, L * 0.1),
    ]
    draw.polygon(body, fill=col)
    draw.polygon([P(0, -L * 0.42), P(L * 0.22, -L * 0.9), P(-L * 0.18, -L * 0.28)], fill=col)


def make_dongson_drum() -> Image.Image:
    """Đông Sơn bronze-drum face — concentric Âu Lạc bands (central sun star,
    Lạc-bird ring, tangent-circle band, sawtooth + radial-tick borders). Gold on
    transparent with a faint glow base, for the ether-crystal floor seal.

    Supersampled 2× then downscaled for clean anti-aliased lines."""
    S = 512
    SS = 2
    size = S * SS
    cc = size / 2
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    GOLD = (230, 182, 96, 235)
    BRIGHT = (255, 214, 130, 248)
    DIM = (198, 148, 78, 205)
    R = cc * 0.96

    def ring(rf: float, w: int, col) -> None:
        r = R * rf
        draw.ellipse((cc - r, cc - r, cc + r, cc + r), outline=col, width=w * SS)

    # Outer double border
    ring(1.0, 3, GOLD)
    ring(0.965, 2, GOLD)

    # Band 1 — inward-pointing sawtooth
    teeth = 56
    r_out, r_in = R * 0.95, R * 0.86
    for i in range(teeth):
        a0 = 2 * math.pi * i / teeth
        a1 = 2 * math.pi * (i + 0.5) / teeth
        a2 = 2 * math.pi * (i + 1) / teeth
        draw.polygon([
            (cc + math.cos(a0) * r_out, cc + math.sin(a0) * r_out),
            (cc + math.cos(a1) * r_in, cc + math.sin(a1) * r_in),
            (cc + math.cos(a2) * r_out, cc + math.sin(a2) * r_out),
        ], fill=DIM)
    ring(0.86, 2, GOLD)
    ring(0.83, 2, GOLD)

    # Band 2 — ring of Lạc birds (clockwise flight)
    birds = 18
    r_bird = R * 0.745
    bl = R * 0.09
    for i in range(birds):
        a = 2 * math.pi * i / birds
        _bird(draw, cc + math.cos(a) * r_bird, cc + math.sin(a) * r_bird, a + math.pi / 2, bl, GOLD)
    ring(0.65, 2, GOLD)

    # Band 3 — tangent circles
    n_tc = 16
    r_tc = R * 0.57
    tcr = R * 0.045
    for i in range(n_tc):
        a = 2 * math.pi * i / n_tc
        x = cc + math.cos(a) * r_tc
        y = cc + math.sin(a) * r_tc
        draw.ellipse((x - tcr, y - tcr, x + tcr, y + tcr), outline=GOLD, width=2 * SS)
        draw.ellipse((x - tcr * 0.38, y - tcr * 0.38, x + tcr * 0.38, y + tcr * 0.38), fill=GOLD)
    ring(0.49, 2, GOLD)

    # Band 4 — radial ticks
    n_t = 48
    r_t0, r_t1 = R * 0.40, R * 0.47
    for i in range(n_t):
        a = 2 * math.pi * i / n_t
        draw.line((cc + math.cos(a) * r_t0, cc + math.sin(a) * r_t0,
                   cc + math.cos(a) * r_t1, cc + math.sin(a) * r_t1), fill=GOLD, width=2 * SS)
    ring(0.38, 2, GOLD)

    # Central sun star (14 rays)
    rays = 14
    r_so, r_si = R * 0.34, R * 0.145
    pts = []
    for i in range(rays * 2):
        a = math.pi * i / rays - math.pi / 2
        rr = r_so if i % 2 == 0 else r_si
        pts.append((cc + math.cos(a) * rr, cc + math.sin(a) * rr))
    draw.polygon(pts, fill=BRIGHT)
    hub = R * 0.07
    draw.ellipse((cc - hub, cc - hub, cc + hub, cc + hub), fill=GOLD)

    img = img.resize((S, S), Image.LANCZOS)

    # Faint warm glow base behind the pattern (center → transparent edge)
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gpx = glow.load()
    half = S / 2
    for y in range(S):
        for x in range(S):
            dx = x - half + 0.5
            dy = y - half + 0.5
            r = math.sqrt(dx * dx + dy * dy) / half
            if r >= 1.0:
                continue
            a = int(50 * (1.0 - r) ** 2.2)
            if a > 0:
                gpx[x, y] = (255, 200, 110, a)
    glow.alpha_composite(img)
    return glow


def main() -> None:
    lamp_path = OUT_DIR / "lamp-pool.png"
    rune_path = OUT_DIR / "magic-rune-circle.png"
    drum_path = OUT_DIR / "dongson-drum-seal.png"

    make_lamp_pool().save(lamp_path, "PNG")
    print(f"wrote {lamp_path}")

    make_rune_circle().save(rune_path, "PNG")
    print(f"wrote {rune_path}")

    make_dongson_drum().save(drum_path, "PNG")
    print(f"wrote {drum_path}")


if __name__ == "__main__":
    main()
