"""
Build the bronze x parchment UI frame kit (GDD 12a UI design language).

Sources:
  - CHROME (frames / header / buttons / divider / card): Gemini (Nano Banana)
    generations on a flat #FF00FF magenta key background, prompted with the
    bible palette hexes. Raw files: d:/tmp/ui-frame-kit-gemini/ (not shipped).
  - ICONS: PixelLab map-objects (native transparent pixel art).
    Raw files: d:/tmp/ui-frame-kit-raw/icon-<name>.png (not shipped).

Chrome post-process per asset (Gemini requirements):
  1. strip the bottom-right sparkle watermark (precedent
     scripts/process_training_yard_walls.py) BEFORE keying, so no remnant
     survives as floating opaque pixels;
  2. chroma-key #FF00FF -> transparent with despill (no pink fringe);
  3. autocrop to content, resize to exact integer-sliceable dimensions;
  4. soft palette-snap toward the bible bronze/parchment/cyan ramp;
  5. record slice insets in public/ui/frames/slice-manifest.json.

Outputs (shipped):
  public/ui/frames/   panel-frame-bronze, header-bar-bronze, divider-bronze,
                      card-frame-bronze, slice-manifest.json
  public/ui/buttons/  button-bronze-{default,hover,active,disabled}
  public/ui/icons/ui/ quests roster facilities settings inventory combat
                      gold wood stone (24px)

Run:  python scripts/process_ui_frame_kit.py
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW_ICONS = Path("d:/tmp/ui-frame-kit-raw")
RAW_CHROME = Path("d:/tmp/ui-frame-kit-gemini")
FRAMES = ROOT / "public" / "ui" / "frames"
BUTTONS = ROOT / "public" / "ui" / "buttons"
ICONS = ROOT / "public" / "ui" / "icons" / "ui"

# ---- GDD 12a SS3 palette (verbatim hex) -------------------------------------
GLINT = (0xFF, 0xE8, 0x7C)         # --bp-bronze-glint  #ffe87c
BRONZE_LIGHT = (0xD4, 0xA8, 0x43)  # --bp-bronze-light  #d4a843
BRONZE_BASE = (0x8A, 0x6D, 0x2C)   # --bp-bronze-base   #8a6d2c
BRONZE_DARK = (0x5C, 0x4A, 0x20)   # --bp-bronze-dark   #5c4a20
PATINA = (0x52, 0x7A, 0x66)        # --bp-bronze-patina #527a66
SHADOW = (0x2A, 0x1F, 0x12)        # --bp-bronze-shadow #2a1f12
IRON = (0x3A, 0x30, 0x25)          # --bp-iron          #3a3025
HEADER_FILL = (0x3A, 0x2C, 0x14)   # --bp-header-fill   #3a2c14
CYAN_CORE = (0x46, 0xD8, 0xD0)     # --bp-cyan-core     #46d8d0
CYAN_DEEP = (0x1D, 0x7A, 0x80)     # --bp-cyan-deep     #1d7a80
CYAN_GLOW = (0x9F, 0xF2, 0xE6)     # --bp-cyan-glow     #9ff2e6
INK_RED = (0x8B, 0x2C, 0x1C)       # --bp-text-ink-red  #8b2c1c
PARCH_LIGHT = (0xF0, 0xE6, 0xD3)   # --bp-parch-light   #f0e6d3
PARCH_BASE = (0xE8, 0xD9, 0xB0)    # --bp-parch-base    #e8d9b0
PARCH_AGED = (0xC9, 0xB6, 0x87)    # --bp-parch-aged    #c9b687

CHROME_PALETTE = [GLINT, BRONZE_LIGHT, BRONZE_BASE, BRONZE_DARK, PATINA,
                  SHADOW, IRON, HEADER_FILL]
# Buttons carry the cyan active state (SS6) -> cyan targets allowed there.
BUTTON_PALETTE = CHROME_PALETTE + [CYAN_CORE, CYAN_DEEP, CYAN_GLOW]
# Icons keep material colors (wood browns, stone greys) -> soft snap; NO cyan
# targets: cyan is reserved for active/selected/magic states (SS3.4 cyan law),
# idle icons must not be nudged toward it.
ICON_PALETTE = CHROME_PALETTE + [INK_RED, PARCH_LIGHT, PARCH_BASE, PARCH_AGED]

MANIFEST: dict[str, dict[str, int]] = {}


# ---- shared helpers ----------------------------------------------------------

def load_rgba(path: Path) -> np.ndarray | None:
    if not path.exists():
        print(f"  !! missing raw input: {path} (asset skipped)")
        return None
    return np.asarray(Image.open(path).convert("RGBA")).copy()


def save(arr: np.ndarray, path: Path, slices: tuple[int, int, int, int] | None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(arr, "RGBA").save(path)
    h, w = arr.shape[:2]
    if slices is not None:
        t, r, b, l = slices
        MANIFEST[path.stem] = {"top": t, "right": r, "bottom": b, "left": l,
                               "width": w, "height": h}
    print(f"  wrote {path.relative_to(ROOT)} ({w}x{h})")


def snap_palette(arr: np.ndarray, palette: list[tuple[int, int, int]],
                 max_dist: float = 70.0) -> np.ndarray:
    """Snap opaque pixels to the nearest bible color when within max_dist
    (Euclidean RGB); farther pixels keep their color so the soft quantize
    never destroys hues it has no replacement for."""
    rgb = arr[..., :3].astype("float32")
    pal = np.asarray(palette, dtype="float32")
    d = np.linalg.norm(rgb[..., None, :] - pal[None, None, :, :], axis=-1)
    idx, dmin = d.argmin(-1), d.min(-1)
    take = (dmin <= max_dist)[..., None] & (arr[..., 3:4] > 0)
    out = arr.copy()
    out[..., :3] = np.where(take, pal[idx].astype("uint8"), arr[..., :3])
    return out


def alpha_bbox(arr: np.ndarray) -> tuple[int, int, int, int] | None:
    ys, xs = np.where(arr[..., 3] > 8)
    if len(xs) == 0:
        return None
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def crop_content(arr: np.ndarray) -> np.ndarray:
    box = alpha_bbox(arr)
    return arr if box is None else arr[box[1]:box[3], box[0]:box[2]]


# ---- Gemini chrome post-process (watermark strip + magenta key) ----------------

def find_watermark_bbox(rgb: np.ndarray) -> tuple[int, int, int, int] | None:
    """Locate the Gemini sparkle in the bottom-right corner: bright pixels
    with near-zero saturation (the surrounding magenta key and bronze art are
    both strongly saturated, so they cannot false-trigger)."""
    h, w, _ = rgb.shape
    x0, y0 = int(w * 0.84), int(h * 0.78)
    sub = rgb[y0:, x0:].astype("int32")
    r, g, b = sub[..., 0], sub[..., 1], sub[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    mask = (mx > 110) & ((mx - mn) < 35)
    if mask.sum() < 60:
        return None
    ys, xs = np.where(mask)
    pad = 16
    return (max(0, xs.min() - pad) + x0, max(0, ys.min() - pad) + y0,
            min(w, xs.max() + pad) + x0, min(h, ys.max() + pad) + y0)


def strip_watermark(rgb: np.ndarray) -> np.ndarray:
    """Patch the watermark bbox with the horizontally MIRRORED region from the
    opposite side of the canvas. Every chrome asset here is left-right
    symmetric, so the mirror is correct whether the sparkle landed on flat
    magenta or on the frame art itself (a left-copy patch corrupts the art in
    the latter case). Feather-blended so no seam shows."""
    box = find_watermark_bbox(rgb)
    if box is None:
        return rgb
    h, w, _ = rgb.shape
    bx0, by0, bx1, by1 = box
    if w - bx0 > bx0:                  # mirrored source intersects the bbox
        print(f"     watermark bbox {box} overlaps mirror source — left as-is")
        return rgb
    out = rgb.astype("float32")
    bw, bh = bx1 - bx0, by1 - by0
    src = out[by0:by1, w - bx1:w - bx0][:, ::-1]   # mirrored counterpart
    feather = 12
    fx = np.clip(np.minimum(np.arange(bw), bw - 1 - np.arange(bw)) / feather, 0, 1)
    fy = np.clip(np.minimum(np.arange(bh), bh - 1 - np.arange(bh)) / feather, 0, 1)
    m = (fy[:, None] * fx[None, :])[..., None]
    dst = out[by0:by1, bx0:bx1]
    out[by0:by1, bx0:bx1] = dst * (1 - m) + src * m
    print(f"     watermark stripped at {box} (mirror patch)")
    return np.clip(out, 0, 255).astype("uint8")


def key_magenta(rgb: np.ndarray) -> np.ndarray:
    """#FF00FF -> transparent with despill of pink edge fringe (handles JPEG
    compression noise around the key color)."""
    arr = rgb.astype("int32")
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    magenta = (r > 150) & (b > 150) & (g < 110)
    spill = (r > g + 25) & (b > g + 25) & ~magenta
    cap = (g * 1.1 + 28)
    out = arr.copy()
    out[..., 0] = np.where(spill, np.minimum(r, cap), r)
    out[..., 2] = np.where(spill, np.minimum(b, cap), b)
    return np.dstack([out.astype("uint8"),
                      np.where(magenta, 0, 255).astype("uint8")])


def resize_rgba(arr: np.ndarray, w: int, h: int) -> np.ndarray:
    """High-quality reduction + hard alpha (pixel-art edges, no halos)."""
    out = np.asarray(Image.fromarray(arr, "RGBA").resize((w, h), Image.LANCZOS)).copy()
    out[..., 3] = np.where(out[..., 3] >= 128, 255, 0)
    out[out[..., 3] == 0] = 0
    return out


def process_chrome(src: Path, dst: Path, target: tuple[int, int],
                   slices: tuple[int, int, int, int],
                   palette: list[tuple[int, int, int]]) -> None:
    raw = load_rgba(src)
    if raw is None:
        return
    rgba = key_magenta(strip_watermark(raw[..., :3]))
    content = crop_content(rgba)
    sized = resize_rgba(content, *target)
    save(snap_palette(sized, palette), dst, slices)


def process_divider(src: Path, dst: Path) -> None:
    """Divider scales by HEIGHT (medallion ~28px on a 192x32 canvas), then the
    uniform line is center-cropped/padded to width — never squeezed."""
    raw = load_rgba(src)
    if raw is None:
        return
    content = crop_content(key_magenta(strip_watermark(raw[..., :3])))
    ch, cw = content.shape[:2]
    H, W, med = 32, 192, 28
    scale = med / ch
    sized = resize_rgba(content, max(1, round(cw * scale)), med)
    canvas = np.zeros((H, W, 4), dtype="uint8")
    y0 = (H - med) // 2
    sw = sized.shape[1]
    if sw >= W:                                  # center-crop the line span
        x0 = (sw - W) // 2
        canvas[y0:y0 + med] = sized[:, x0:x0 + W]
    else:                                        # extend line by edge tiling
        x0 = (W - sw) // 2
        canvas[y0:y0 + med, x0:x0 + sw] = sized
    save(snap_palette(canvas, CHROME_PALETTE), dst, (0, 80, 0, 80))


def process_header(src: Path, dst: Path) -> None:
    """Header scales to --bp-header-h 40px tall, proportional width snapped to
    a multiple of 8; interior must stay the solid --bp-header-fill band."""
    raw = load_rgba(src)
    if raw is None:
        return
    content = crop_content(key_magenta(strip_watermark(raw[..., :3])))
    ch, cw = content.shape[:2]
    H = 40
    W = max(96, round(cw * H / ch / 8) * 8)
    sized = snap_palette(resize_rgba(content, W, H), CHROME_PALETTE)
    # HARD RULE (SS5): the band behind glyphs is perfectly flat
    # --bp-header-fill — kill residual generation noise in the tiling region
    # (dark pixels only; the top seam / bottom rule lines stay untouched).
    interior = sized[3:H - 5, 32:W - 32]
    dark = np.linalg.norm(interior[..., :3].astype("float32")
                          - np.asarray(HEADER_FILL, "float32"), axis=-1) < 60
    interior[..., :3][dark & (interior[..., 3] > 0)] = HEADER_FILL
    save(sized, dst, (0, 32, 0, 32))


# ---- icons (SS8: 24px grid, PixelLab source) -----------------------------------

ICON_NAMES = ["quests", "roster", "facilities", "settings", "inventory",
              "combat", "gold", "wood", "stone"]


def fit_square(arr: np.ndarray, size: int) -> np.ndarray:
    """Center content on a transparent size x size canvas; nearest-downscale
    only when content exceeds the canvas."""
    arr = crop_content(arr)
    h, w = arr.shape[:2]
    if max(h, w) > size:
        s = size / max(h, w)
        arr = np.asarray(Image.fromarray(arr, "RGBA").resize(
            (max(1, round(w * s)), max(1, round(h * s))), Image.NEAREST))
        h, w = arr.shape[:2]
    canvas = np.zeros((size, size, 4), dtype="uint8")
    y, x = (size - h) // 2, (size - w) // 2
    canvas[y:y + h, x:x + w] = arr
    return canvas


def warm_shift_blues(arr: np.ndarray) -> np.ndarray:
    """Remap blue-dominant pixels (stray cool glass/sky details) onto warm
    bible tones by luminance — cyan/blue may not appear on idle icons
    (SS3.4 cyan law), so the kit stays warm bronze + parchment."""
    r = arr[..., 0].astype(int)
    g = arr[..., 1].astype(int)
    b = arr[..., 2].astype(int)
    cool = (b > r + 15) & (b > g) & (arr[..., 3] > 0)
    if not cool.any():
        return arr
    warm_ramp = np.asarray([SHADOW, IRON, BRONZE_DARK, PARCH_AGED, PARCH_LIGHT],
                           dtype="uint8")
    lum = (0.299 * r + 0.587 * g + 0.114 * b)
    bins = np.clip((lum / 256.0 * len(warm_ramp)).astype(int), 0,
                   len(warm_ramp) - 1)
    out = arr.copy()
    out[..., :3][cool] = warm_ramp[bins][cool]
    return out


def desaturate_warm(arr: np.ndarray) -> np.ndarray:
    """Collapse hue to a slightly warm grey (stone material: 'desaturated
    grey tones' per SS8 — kills any green/teal tint the generator added)."""
    lum = arr[..., :3].astype("float32") @ np.array([0.299, 0.587, 0.114])
    out = arr.copy()
    out[..., 0] = np.clip(lum * 1.05, 0, 255).astype("uint8")
    out[..., 1] = np.clip(lum, 0, 255).astype("uint8")
    out[..., 2] = np.clip(lum * 0.88, 0, 255).astype("uint8")
    out[arr[..., 3] == 0] = 0
    return out


def build_icons() -> None:
    no_patina = [c for c in ICON_PALETTE if c != PATINA]
    for name in ICON_NAMES:
        raw = load_rgba(RAW_ICONS / f"icon-{name}.png")
        if raw is None:
            continue
        if name == "stone":      # neutral grey material — never patina-teal
            icon = snap_palette(desaturate_warm(raw), no_patina, max_dist=45.0)
        else:
            icon = warm_shift_blues(snap_palette(raw, ICON_PALETTE, max_dist=55.0))
        save(fit_square(icon, 24), ICONS / f"{name}.png", None)


# ---- main ----------------------------------------------------------------------

def main() -> None:
    print("frame kit build:")
    process_chrome(RAW_CHROME / "panel-frame-gemini.png",
                   FRAMES / "panel-frame-bronze.png",
                   (128, 128), (32, 32, 32, 32), CHROME_PALETTE)
    process_chrome(RAW_CHROME / "card-frame-gemini.png",
                   FRAMES / "card-frame-bronze.png",
                   (64, 64), (16, 16, 16, 16), CHROME_PALETTE)
    process_header(RAW_CHROME / "header-bar-gemini.png",
                   FRAMES / "header-bar-bronze.png")
    process_divider(RAW_CHROME / "divider-gemini.png",
                    FRAMES / "divider-bronze.png")
    for state in ("default", "hover", "active", "disabled"):
        process_chrome(RAW_CHROME / f"button-{state}-gemini.png",
                       BUTTONS / f"button-bronze-{state}.png",
                       (48, 48), (16, 16, 16, 16), BUTTON_PALETTE)
    build_icons()

    FRAMES.mkdir(parents=True, exist_ok=True)
    manifest_path = FRAMES / "slice-manifest.json"
    manifest_path.write_text(json.dumps(MANIFEST, indent=2) + "\n")
    print(f"  wrote {manifest_path.relative_to(ROOT)} ({len(MANIFEST)} entries)")


if __name__ == "__main__":
    main()
