"""Turn the raw generated art in assets/raw/ into web-ready images in assets/img/.

Scenes (hero, about) are copied as-is. Sticker-style art (cats, trees, ice frame)
was generated on a flat sky-blue background; that background is flood-filled from
the image border and made transparent.

Usage: python3 scripts/process_images.py
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets" / "raw"
OUT = ROOT / "assets" / "img"

SCENES = ["hero", "about"]
CUTOUTS = {"wave": 46, "coin": 46, "trees": 46, "frame": 40}


def find_raw(name):
    for ext in (".png", ".jpg", ".jpeg", ".webp"):
        p = RAW / f"{name}{ext}"
        if p.exists():
            return p
    raise FileNotFoundError(name)


def cut_background(im, tol):
    rgb = np.asarray(im.convert("RGB")).astype(np.int16)
    h, w, _ = rgb.shape
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, axis=0)
    close = np.sqrt(((rgb - bg) ** 2).sum(axis=2)) < tol
    seen = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if close[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if close[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < h and 0 <= nx < w and close[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    alpha = Image.fromarray(np.where(seen, 0, 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert("RGBA")
    out.putalpha(alpha)
    return out.crop(out.getbbox())


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name in SCENES:
        Image.open(find_raw(name)).convert("RGB").save(OUT / f"{name}.jpg", quality=88)
    for name, tol in CUTOUTS.items():
        cut_background(Image.open(find_raw(name)), tol).save(OUT / f"{name}.png", optimize=True)
    logo = Image.open(ROOT / "assets" / "logo.jpg").convert("RGB")
    logo.resize((256, 256), Image.LANCZOS).save(OUT / "logo.png", optimize=True)
    print("wrote", sorted(p.name for p in OUT.iterdir()))


if __name__ == "__main__":
    main()
