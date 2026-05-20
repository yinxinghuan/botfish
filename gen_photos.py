#!/usr/bin/env python3
"""
BOTFISH photo generator — txt2img via aiservice.wdabuliu.com.

Produces two pools:
  - CLEAN  : convincing dating-app portraits (the "real human" choice)
  - AI_TELL: portraits with deliberate AI artifacts (the trap)

Outputs to public/photos/ and writes public/photos/manifest.json:
  [{ "id": "p01", "kind": "clean"|"ai", "tells": [...], "name": "...", "age": 25, "prompt": "..." }]
"""

import json
import os
import ssl
import subprocess
import sys
import time
import urllib.request
import urllib.error

API_URL     = "http://aiservice.wdabuliu.com:8019/genl_image"
API_TIMEOUT = 360
RATE_WAIT   = 78
USER_ID     = 7019842   # numeric

OUT_DIR  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public/photos")
os.makedirs(OUT_DIR, exist_ok=True)

_SSL = ssl.create_default_context()
_SSL.check_hostname = False
_SSL.verify_mode = ssl.CERT_NONE


# ────────────────────────────────────────────────────────────────────────────
# Prompt fragments
# ────────────────────────────────────────────────────────────────────────────

CLEAN_BASE = (
    "natural candid iPhone photo, dating app profile selfie, "
    "soft daylight, ordinary background, casual outfit, "
    "neutral happy expression, looks real, NOT a portrait studio shot, "
    "amateur composition, slight imperfection, looks like a regular person, "
    "9:16 portrait crop"
)

# Each AI_TELL prompt explicitly hammers ONE visible glitch.
# We over-specify the artifact so the diffusion model commits to it.

AI_TELLS = [
    {
        "tag": "six_fingers",
        "label": "6 fingers on visible hand",
        "prompt": (
            "amateur selfie, woman waving at camera with one hand visible, the visible hand has "
            "six clearly distinct fingers, six finger glitch, anatomically wrong hand, "
            "all six fingers fully extended and spaced apart, daylight, casual setting"
        ),
    },
    {
        "tag": "fused_fingers",
        "label": "fingers melted together",
        "prompt": (
            "amateur selfie of a man holding a coffee cup, the hand holding the cup has "
            "fingers fused into a single blob of flesh, melted finger anatomy, no individual finger "
            "definition, distorted hand, soft skin merging into cup, daylight cafe"
        ),
    },
    {
        "tag": "asym_earrings",
        "label": "mismatched earrings",
        "prompt": (
            "selfie of a woman, large gold hoop earring on left ear, completely different small silver "
            "stud earring on right ear, obviously mismatched asymmetric earrings, both ears visible, "
            "casual outdoor light"
        ),
    },
    {
        "tag": "three_ears",
        "label": "extra ear behind hair",
        "prompt": (
            "selfie of a person with shoulder-length hair, three ears visible — one on each side of the "
            "head plus a third extra ear peeking through the hair on the left, anatomical glitch, "
            "subtle but obvious if you look, neutral expression"
        ),
    },
    {
        "tag": "garbled_text",
        "label": "garbled letters on shirt",
        "prompt": (
            "selfie of a man wearing a t-shirt with bold printed text, the text is COMPLETE NONSENSE "
            "— garbled fake letters that look almost like English but spell nothing, classic AI text "
            "glitch, jumbled characters, mall background"
        ),
    },
    {
        "tag": "background_merge",
        "label": "background object fused into body",
        "prompt": (
            "selfie of a woman at a park, a lamp post in the background is fused into her shoulder, "
            "metal pole merging into flesh, no clear boundary between body and background object, "
            "surreal AI artifact, otherwise normal daytime photo"
        ),
    },
    {
        "tag": "plastic_skin",
        "label": "uncanny plastic skin",
        "prompt": (
            "ultra-smooth plastic doll skin, hyper-real but uncanny, no pores, no skin texture, "
            "almost waxy mannequin face, dating app selfie pose, daylight, the person looks like a "
            "very expensive sex doll rather than a real human"
        ),
    },
    {
        "tag": "eyes_diff_color",
        "label": "eyes different colors / glitching irises",
        "prompt": (
            "close selfie, the left eye is bright blue, the right eye is brown, irises clearly "
            "mismatched colors, one pupil noticeably larger than the other, the second iris has a "
            "weird internal shape, subtle uncanny look"
        ),
    },
    {
        "tag": "extra_teeth",
        "label": "too many teeth",
        "prompt": (
            "amateur selfie of a smiling man, mouth slightly open showing too many teeth — about 14 "
            "upper teeth all crammed together, double row of front teeth, AI mouth glitch, otherwise "
            "normal happy expression"
        ),
    },
    {
        "tag": "shadow_wrong",
        "label": "shadow direction mismatched",
        "prompt": (
            "selfie outdoors at sunset, golden warm side lighting from the right of the frame, but "
            "the person's facial shadow falls on the OPPOSITE side (the right side of the face) — "
            "shadow direction does not match lighting, physically impossible illumination"
        ),
    },
    {
        "tag": "hair_blend",
        "label": "hair fused with background",
        "prompt": (
            "selfie of a woman with long dark hair against a dark wooden wall, the hair edges "
            "have no clean boundary and bleed/merge directly into the wood grain pattern, "
            "AI segmentation failure, soft melty hair-to-wood transition"
        ),
    },
    {
        "tag": "third_arm",
        "label": "extra limb partly visible",
        "prompt": (
            "amateur photo of a person at a cafe, an extra third arm visible faintly behind the "
            "shoulder, ghostly extra limb glitch, otherwise casual daylight dating-profile photo"
        ),
    },
]

# ABSURD — deliberately surreal, model commits because the prompt doesn't ask for
# anatomically-correct-but-wrong; it asks for impossible/object-replacements.
ABSURD_AI_TELLS = [
    {
        "tag": "watermelon_head",
        "label_en": "head is a whole watermelon",
        "label_zh": "头是整颗西瓜",
        "prompt": (
            "amateur dating-app selfie of a person whose entire head has been replaced by a giant "
            "WHOLE WATERMELON — striped green rind, no face, no eyes, no mouth — sitting on the "
            "neck as if it were a normal head, body wearing a casual t-shirt, hand giving a peace "
            "sign, normal living-room background, photorealistic, watermelon clearly attached to neck"
        ),
    },
    {
        "tag": "bread_hands",
        "label_en": "hands are loaves of bread",
        "label_zh": "手是面包",
        "prompt": (
            "amateur smiling selfie, both visible hands are LITERAL LOAVES OF GOLDEN SOURDOUGH "
            "BREAD with crusty exteriors — no fingers at all, just whole bread loaves attached at "
            "the wrists, otherwise a normal person sitting in a brightly lit kitchen, photorealistic"
        ),
    },
    {
        "tag": "noodle_hair",
        "label_en": "hair is cooked spaghetti",
        "label_zh": "头发是煮熟的意大利面",
        "prompt": (
            "selfie of a woman, her hair is replaced by long COOKED SPAGHETTI NOODLES draping over "
            "her shoulders — pale yellow pasta strands, some glistening with marinara sauce, "
            "smiling normally, Italian restaurant background, photorealistic"
        ),
    },
    {
        "tag": "two_faces",
        "label_en": "two complete faces on one head",
        "label_zh": "一颗头上长着两张完整的脸",
        "prompt": (
            "portrait selfie, a single head with TWO COMPLETE FACES fused side by side like a "
            "Janus head — two noses, two mouths, four eyes total, both faces smiling, sunny park "
            "background, photorealistic skin, natural daylight"
        ),
    },
    {
        "tag": "cyclops",
        "label_en": "single eye in the forehead",
        "label_zh": "额头正中只有一只大眼睛",
        "prompt": (
            "amateur selfie of a man with a SINGLE LARGE EYE in the middle of his forehead — no "
            "other eyes anywhere — like a cyclops, normal nose and mouth below, photorealistic, "
            "otherwise totally normal coffee-shop selfie, daylight"
        ),
    },
    {
        "tag": "melting_face",
        "label_en": "face melting like a Dalí painting",
        "label_zh": "脸像达利画一样在融化",
        "prompt": (
            "dating-app selfie, the person's face is MELTING and dripping downward like wax in a "
            "Salvador Dalí painting — skin sliding off the skull, one eye drooping down to the "
            "chin, photorealistic but surreal, normal living-room lighting"
        ),
    },
    {
        "tag": "held_head",
        "label_en": "holding their own detached head",
        "label_zh": "拎着自己的脑袋",
        "prompt": (
            "amateur outdoor selfie, the person is HOLDING THEIR OWN DETACHED HEAD up next to their "
            "headless body — body wearing a casual hoodie, the held head is smiling normally, "
            "sunny garden background, photorealistic, no blood just clean impossibility"
        ),
    },
    {
        "tag": "shark_teeth",
        "label_en": "rows and rows of shark teeth",
        "label_zh": "一嘴密密麻麻鲨鱼牙",
        "prompt": (
            "selfie smiling wide open, mouth filled with THREE OVERLAPPING ROWS of jagged "
            "triangular SHARK TEETH — 40+ teeth visible, photorealistic, horror-uncanny, "
            "otherwise normal park background, casual outfit"
        ),
    },
    {
        "tag": "chest_arm",
        "label_en": "third arm growing from the chest",
        "label_zh": "胸口长出第三条胳膊",
        "prompt": (
            "selfie at a cafe, a fully formed THIRD ARM grows out from the center of the chest "
            "holding a coffee cup, both regular arms still visible at the sides, photorealistic "
            "skin, casual t-shirt, daylight cafe setting"
        ),
    },
    {
        "tag": "shoulder_faces",
        "label_en": "tiny copies of own face on both shoulders",
        "label_zh": "两个肩膀各长一张迷你版自己的脸",
        "prompt": (
            "amateur portrait selfie, two TINY MINIATURE COPIES of the person's own face are "
            "growing out of their shoulders like fleshy lumps with full eyes mouths and noses — "
            "all three faces share the same features, photorealistic skin, casual indoor lighting"
        ),
    },
    {
        "tag": "tile_skin",
        "label_en": "skin is hexagonal tiles",
        "label_zh": "皮肤是六边形瓷砖",
        "prompt": (
            "amateur indoor selfie, the person's face and arms are clearly made of small HEXAGONAL "
            "BEIGE PLASTIC TILES like a 3D mosaic, visible seams between hexagons, eyes still real, "
            "otherwise normal living-room background, photorealistic lighting"
        ),
    },
    {
        "tag": "chair_fused",
        "label_en": "body fused into the chair",
        "label_zh": "身体和椅子无缝融合",
        "prompt": (
            "selfie of a person at a desk, their legs and lower body SEAMLESSLY FUSED into the "
            "wooden chair — flesh becomes wood grain, no visible boundary, Cronenberg-style body "
            "horror, normal office background, photorealistic"
        ),
    },
]

# CLEAN — keep prompts realistic, vary scene + look
CLEAN_SCENES = [
    "smiling at camera in a neighborhood coffee shop, latte on the table, warm window light",
    "outdoor selfie on a hiking trail, sunny midday, wearing a casual t-shirt",
    "rooftop bar at golden hour, holding a wine glass, cityscape behind",
    "kitchen selfie cooking pasta, apron on, kitchen lighting",
    "at a farmers market holding a bunch of carrots, daylight, smiling",
    "leaning on a brick wall, autumn leaves on the ground, denim jacket",
    "with a small dog (golden retriever puppy) in their lap on a park bench",
    "bookshop interior, casually holding a paperback, soft indoor light",
    "by the ocean at sunset, hair messy from wind, light hoodie",
    "at a music festival, lanyard around neck, daylight festival ground",
    "sitting on a couch at home, sweater, mug of tea, side window light",
    "gym mirror selfie, normal gym clothes, no fitness influencer pose, casual",
]

# Sample names + ages (mix of names; could expand)
PROFILES = [
    ("Maya", 26), ("Chloe", 24), ("Olivia", 29), ("Sara", 25),
    ("Ava", 27),  ("Lila", 23),  ("Noor", 28),   ("Iris", 30),
    ("Jordan", 26), ("Theo", 28), ("Marcus", 31), ("Eli", 25),
    ("Daniel", 27), ("Owen", 24), ("Leo", 30),    ("Sam", 29),
    ("Riya", 26), ("Mei", 25), ("Tasha", 29), ("Zoe", 23),
    ("Kai", 27), ("Felix", 28), ("Adrian", 30), ("Caleb", 25),
    # ABSURD batch (a13–a24)
    ("Nico", 28), ("Wren", 26), ("Aria", 24), ("Soren", 30),
    ("Hugo", 32), ("Vera", 27), ("Pablo", 29), ("Reese", 25),
    ("Otis", 28), ("Indie", 23), ("Bowen", 31), ("Cyrus", 26),
]


# ────────────────────────────────────────────────────────────────────────────
# API
# ────────────────────────────────────────────────────────────────────────────

def call_api(prompt: str) -> str | None:
    """txt2img — no url param. Returns image URL or None."""
    payload = json.dumps({
        "query": "",
        "params": {"prompt": prompt, "user_id": USER_ID},
    }).encode()
    req = urllib.request.Request(
        API_URL, data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=API_TIMEOUT) as r:
            result = json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            result = json.loads(body)
        except Exception:
            print(f"  HTTP {e.code} — {body[:120]}")
            return None
        result = json.loads(body)

    code = result.get("code")
    if code == 200:
        return result["url"]
    if code == 429:
        raise RuntimeError("rate_limit")
    print(f"  api code={code}: {result.get('msg','')}")
    return None


def download(url: str, out_path: str) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60, context=_SSL) as r:
            data = r.read()
        src_ext = os.path.splitext(url.split("?")[0])[1].lower() or ".jpg"
        dst_ext = os.path.splitext(out_path)[1].lower()
        tmp = out_path if src_ext == dst_ext else out_path + src_ext
        with open(tmp, "wb") as f:
            f.write(data)
        if tmp != out_path:
            fmt = "png" if dst_ext == ".png" else "jpeg"
            subprocess.run(["sips", "-s", "format", fmt, tmp, "--out", out_path],
                           check=True, capture_output=True)
            os.remove(tmp)
        kb = os.path.getsize(out_path) // 1024
        print(f"  saved {os.path.basename(out_path)} ({kb} KB)")
        return True
    except Exception as e:
        print(f"  download failed: {e}")
        return False


def generate_one(prompt: str, out_path: str, attempt: int = 1) -> bool:
    print(f"\n→ {os.path.basename(out_path)}")
    print(f"  prompt: {prompt[:90]}{'…' if len(prompt)>90 else ''}")
    while True:
        try:
            url = call_api(prompt)
        except RuntimeError as e:
            if str(e) == "rate_limit":
                print(f"  rate limited, sleeping {RATE_WAIT}s")
                time.sleep(RATE_WAIT)
                continue
            raise
        break
    if not url:
        if attempt < 2:
            time.sleep(5)
            return generate_one(prompt, out_path, attempt + 1)
        return False
    return download(url, out_path)


# ────────────────────────────────────────────────────────────────────────────
# Plan + run
# ────────────────────────────────────────────────────────────────────────────

def build_plan():
    """Plan 24 photos: 12 clean + 12 ai-tell (one per tell)."""
    plan = []

    for i, scene in enumerate(CLEAN_SCENES):
        name, age = PROFILES[i]
        plan.append({
            "id":   f"c{i+1:02d}",
            "kind": "clean",
            "tells": [],
            "name": name,
            "age":  age,
            "prompt": f"{CLEAN_BASE}, {scene}",
        })

    for i, tell in enumerate(AI_TELLS):
        name, age = PROFILES[12 + i]
        plan.append({
            "id":   f"a{i+1:02d}",
            "kind": "ai",
            "tells": [tell["tag"]],
            "tell_label": tell["label"],
            "name": name,
            "age":  age,
            "prompt": tell["prompt"],
        })

    # Absurd batch — a13–a24
    for i, tell in enumerate(ABSURD_AI_TELLS):
        idx = i + 13
        name, age = PROFILES[24 + i]
        plan.append({
            "id":   f"a{idx:02d}",
            "kind": "ai",
            "tells": [tell["tag"]],
            "tell_label_en": tell["label_en"],
            "tell_label_zh": tell["label_zh"],
            "name": name,
            "age":  age,
            "prompt": tell["prompt"],
        })

    return plan


def main():
    plan = build_plan()
    manifest_path = os.path.join(OUT_DIR, "manifest.json")
    print(f"Plan: {len(plan)} photos → {OUT_DIR}")

    # resume support — skip already-generated files
    done = {f for f in os.listdir(OUT_DIR) if f.endswith(".jpg") or f.endswith(".png")}
    print(f"Already on disk: {len(done)} files")

    results = []
    start = time.time()
    for i, item in enumerate(plan, 1):
        fname = f"{item['id']}.jpg"
        out_path = os.path.join(OUT_DIR, fname)
        elapsed = int(time.time() - start)
        print(f"\n[{i}/{len(plan)}] {item['kind'].upper()} {item['id']} (elapsed {elapsed}s)")
        if fname in done:
            print(f"  exists, skipping")
            item["file"] = fname
            results.append(item)
            continue

        if generate_one(item["prompt"], out_path):
            item["file"] = fname
            results.append(item)
            # rewrite manifest incrementally so partial runs are recoverable
            with open(manifest_path, "w") as f:
                json.dump(results, f, indent=2)
            # respect rate limit between calls
            if i < len(plan):
                print(f"  pacing {RATE_WAIT}s before next…")
                time.sleep(RATE_WAIT)
        else:
            print(f"  ✗ FAILED {item['id']}")

    with open(manifest_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nDone. {len(results)}/{len(plan)} ok. Manifest → {manifest_path}")


if __name__ == "__main__":
    main()
