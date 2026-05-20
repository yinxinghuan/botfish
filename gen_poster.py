#!/usr/bin/env python3
"""
BOTFISH — 1024×1024 poster.

Layout (top → bottom):
  1. BOTFISH wordmark + tagline pill
  2. Tilted photo card showing one of the AI-tell photos (a12 — cartoon ghost)
  3. Prompt card peeking out below
  4. X / heart buttons row
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT_PATH = os.path.join(ROOT, "public/poster.png")
PHOTO = os.path.join(ROOT, "public/photos/a12.jpg")
PLAYFAIR_ITAL = os.path.join(ROOT, "fonts/PlayfairDisplay-BlackItalic.ttf")

os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
W, H = 1024, 1024

# Palette
BG     = (243, 236, 223)
INK    = (26, 20, 16)
PAPER  = (253, 248, 237)
ACCENT = (246, 193, 74)
ROSE   = (216, 53, 85)
MUTED  = (122, 106, 74)


def font(path, size):
    if os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def sans(size):
    for p in ("/System/Library/Fonts/Avenir Next.ttc",
              "/System/Library/Fonts/HelveticaNeue.ttc",
              "/System/Library/Fonts/Helvetica.ttc"):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def text_w(f, t):
    bb = f.getbbox(t)
    return bb[2] - bb[0]


def rounded_rect(size, radius, fill, stroke=None, stroke_w=0):
    w, h = size
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w-1, h-1], radius=radius, fill=fill)
    if stroke and stroke_w:
        d.rounded_rectangle([0, 0, w-1, h-1], radius=radius, outline=stroke, width=stroke_w)
    return im


def build():
    canvas = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(canvas)

    # 1. Wordmark
    title_f = font(PLAYFAIR_ITAL, 160)
    title = "BOTFISH"
    tw = text_w(title_f, title)
    tx = (W - tw) // 2
    ty = 64
    draw.text((tx, ty), title, font=title_f, fill=INK)

    # Tagline pill
    tag_f = sans(24)
    tag = "Spot the AI before you swipe."
    tagw = text_w(tag_f, tag)
    pad_x, pad_y = 24, 12
    pill_w = tagw + pad_x * 2
    pill_h = 44
    px = (W - pill_w) // 2
    py = ty + 210
    chip = rounded_rect((pill_w, pill_h), pill_h // 2, INK)
    canvas.paste(chip, (px, py), chip)
    draw.text((px + pad_x, py + pad_y - 4), tag, font=tag_f, fill=ACCENT)

    # 2. Tilted photo card
    card_w, card_h = 560, 520
    card_radius = 36

    if os.path.exists(PHOTO):
        photo = Image.open(PHOTO).convert("RGB")
        ph_aspect = card_w / card_h
        sw, sh = photo.size
        sa = sw / sh
        if sa > ph_aspect:
            new_w = int(sh * ph_aspect)
            x0 = (sw - new_w) // 2
            photo = photo.crop((x0, 0, x0 + new_w, sh))
        else:
            new_h = int(sw / ph_aspect)
            y0 = int(sh * 0.0)
            photo = photo.crop((0, y0, sw, min(sh, y0 + new_h)))
        photo = photo.resize((card_w, card_h), Image.LANCZOS)
    else:
        photo = Image.new("RGB", (card_w, card_h), (90, 58, 34))

    card_im = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    photo_rgba = photo.convert("RGBA")
    mask = Image.new("L", (card_w, card_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, card_w-1, card_h-1], radius=card_radius, fill=255)
    card_im.paste(photo_rgba, (0, 0), mask)

    # Gradient overlay
    grad = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for i in range(card_h // 2, card_h):
        t = (i - card_h // 2) / (card_h // 2)
        a = int(195 * t * t)
        gd.line([(0, i), (card_w, i)], fill=(0, 0, 0, a))
    grad_masked = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    grad_masked.paste(grad, (0, 0), mask)
    card_im = Image.alpha_composite(card_im, grad_masked)

    # Name + loc
    name_f = font(PLAYFAIR_ITAL, 72)
    loc_f = sans(22)
    nd = ImageDraw.Draw(card_im)
    nd.text((36, card_h - 142), "Caleb, 25", font=name_f, fill=BG)
    dot_y = card_h - 58
    nd.ellipse([36, dot_y, 47, dot_y + 11], fill=ACCENT)
    nd.text((56, dot_y - 6), "4 miles away · Gowanus", font=loc_f, fill=BG)

    # Tilt card
    tilt = -4
    card_tilted = card_im.rotate(tilt, expand=True, resample=Image.BICUBIC)

    # Shadow
    sh_alpha = card_tilted.split()[3].filter(ImageFilter.GaussianBlur(radius=22))
    shadow = Image.new("RGBA", card_tilted.size, (0, 0, 0, 0))
    shadow.putalpha(sh_alpha)
    cx = (W - card_tilted.width) // 2
    cy = 340
    canvas.paste(shadow, (cx + 6, cy + 18), shadow)
    canvas.paste(card_tilted, (cx, cy), card_tilted)

    # 3. Prompt card peeking
    pc_w, pc_h = 540, 96
    pc = rounded_rect((pc_w, pc_h), 22, PAPER, INK, 3)
    pcd = ImageDraw.Draw(pc)
    pcd.text((24, 16), "MY ROLE IN THE FRIEND GROUP", font=sans(16), fill=MUTED)
    pcd.text((24, 44), "the one who books the airbnb", font=font(PLAYFAIR_ITAL, 30), fill=INK)
    pc_t = pc.rotate(3, expand=True, resample=Image.BICUBIC)
    canvas.paste(pc_t, ((W - pc_t.width) // 2, cy + card_tilted.height - 50), pc_t)

    # 4. Buttons row
    btn_y = 940
    x_cx, x_cy, x_r = 410, btn_y, 54
    draw.ellipse([x_cx - x_r, x_cy - x_r, x_cx + x_r, x_cy + x_r], fill=PAPER, outline=INK, width=5)
    draw.line([x_cx - 18, x_cy - 18, x_cx + 18, x_cy + 18], fill=ROSE, width=9)
    draw.line([x_cx - 18, x_cy + 18, x_cx + 18, x_cy - 18], fill=ROSE, width=9)

    h_cx, h_cy, h_r = 614, btn_y, 60
    draw.ellipse([h_cx - h_r, h_cy - h_r, h_cx + h_r, h_cy + h_r], fill=ACCENT, outline=INK, width=5)
    hr = 20
    draw.ellipse([h_cx - hr*1.3, h_cy - hr*1.1, h_cx - hr*0.2, h_cy + hr*0.1], fill=INK)
    draw.ellipse([h_cx + hr*0.2, h_cy - hr*1.1, h_cx + hr*1.3, h_cy + hr*0.1], fill=INK)
    draw.polygon([(h_cx - hr*1.2, h_cy - hr*0.2), (h_cx + hr*1.2, h_cy - hr*0.2), (h_cx, h_cy + hr*1.05)], fill=INK)

    canvas.save(OUT_PATH, "PNG")
    print(f"poster → {OUT_PATH}  ({W}×{H})")


if __name__ == "__main__":
    build()
