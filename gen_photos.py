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

# More absurd batch — round 3 (a25-a36). New object-replacement concepts, no
# overlap with the previous batch (no head-swaps, no body-fused-to-furniture).
ABSURD_AI_TELLS_R3 = [
    {
        "tag": "egg_eyes",
        "label_en": "eyes are sunny-side-up eggs",
        "label_zh": "眼睛是两颗煎蛋",
        "prompt": (
            "amateur close-up selfie of a smiling man, both eyes are LITERAL SUNNY-SIDE-UP "
            "FRIED EGGS — white albumen and runny yellow yolks where the eyeballs should be, "
            "no actual eyes, otherwise normal face and skin, photorealistic, kitchen background"
        ),
    },
    {
        "tag": "zipper_mouth",
        "label_en": "mouth is a metal zipper",
        "label_zh": "嘴是一条金属拉链",
        "prompt": (
            "amateur dating-app selfie, where the mouth would be there is a CLOSED METAL ZIPPER "
            "running horizontally across the face, real metal teeth and pull-tab, no lips at all, "
            "rest of face normal, photorealistic, soft cafe lighting"
        ),
    },
    {
        "tag": "flame_hair",
        "label_en": "hair is literally on fire",
        "label_zh": "头发是真的火焰",
        "prompt": (
            "selfie of a woman, her hair is replaced by VIVID ORANGE-AND-YELLOW LITERAL FLAMES "
            "leaping upward — real fire physics, no human hair at all, neutral smiling expression "
            "as if nothing is wrong, photorealistic, blurry city background"
        ),
    },
    {
        "tag": "lobster_claws",
        "label_en": "hands are giant red lobster claws",
        "label_zh": "双手是巨大的红色龙虾钳",
        "prompt": (
            "amateur selfie of a man at a seafood restaurant, both visible hands are LARGE RED "
            "LOBSTER CLAWS — chitinous shell, hinged pincers, no human fingers — otherwise "
            "normal arms and shirt, photorealistic restaurant lighting"
        ),
    },
    {
        "tag": "long_neck",
        "label_en": "neck stretched two meters tall",
        "label_zh": "脖子被拉长到两米",
        "prompt": (
            "amateur selfie of a smiling woman, NORMAL HEAD on a NECK STRETCHED IMPOSSIBLY LONG "
            "— about two meters tall, like a giraffe, the rest of the body tiny far below, "
            "photorealistic skin, outdoor park background"
        ),
    },
    {
        "tag": "upside_face",
        "label_en": "face features rotated upside-down",
        "label_zh": "五官全是倒过来的",
        "prompt": (
            "amateur portrait, the head is normal but the FACIAL FEATURES ARE ROTATED 180 "
            "DEGREES — mouth where forehead should be, eyes near the chin, eyebrows pointing "
            "downward at the bottom of the face, photorealistic, soft natural light"
        ),
    },
    {
        "tag": "branch_arms",
        "label_en": "arms are tree branches with leaves",
        "label_zh": "胳膊是树枝、还长着叶子",
        "prompt": (
            "amateur selfie of a person, both visible arms are LITERAL WOODY TREE BRANCHES "
            "with bark and small green leaves growing out where fingers should be, otherwise "
            "normal torso and head, photorealistic, forest background"
        ),
    },
    {
        "tag": "jelly_body",
        "label_en": "body made of translucent jelly",
        "label_zh": "整个身体是半透明果冻",
        "prompt": (
            "amateur selfie of a person, the entire visible body (arms, torso, neck) is made "
            "of LIGHT-BLUE TRANSLUCENT JELLY you can see through, internal bones faintly visible, "
            "but the head is normal human, photorealistic kitchen background"
        ),
    },
    {
        "tag": "cake_hat",
        "label_en": "wearing an actual birthday cake on the head",
        "label_zh": "把整个生日蛋糕戴在头上",
        "prompt": (
            "amateur selfie, the person has an ENTIRE BIRTHDAY CAKE balanced directly on top "
            "of their head as if it were a hat — frosting, lit candles, sprinkles, no actual hat — "
            "smiling normally, photorealistic, party background"
        ),
    },
    {
        "tag": "caterpillar_brows",
        "label_en": "eyebrows are live caterpillars",
        "label_zh": "眉毛是两条活毛毛虫",
        "prompt": (
            "close-up amateur selfie, where the eyebrows should be there are TWO LIVE FUZZY "
            "CATERPILLARS — visible legs and bristles, distinctly bug-like, slightly crawling, "
            "otherwise normal face, photorealistic"
        ),
    },
    {
        "tag": "bread_torso",
        "label_en": "entire torso is a baguette",
        "label_zh": "整个躯干是一根法棍",
        "prompt": (
            "amateur kitchen selfie, the person's HEAD AND ARMS ARE NORMAL but the entire "
            "torso between shoulders and waist is a giant golden BAGUETTE with crusty surface, "
            "no fabric, photorealistic baked-bread texture"
        ),
    },
    {
        "tag": "mummy_wraps",
        "label_en": "wrapped head-to-toe in mummy bandages",
        "label_zh": "全身缠满木乃伊绷带",
        "prompt": (
            "amateur outdoor selfie, the entire body and face is wrapped tightly in dirty beige "
            "MUMMY BANDAGES — only eyes peeking through a slit — but holding a phone selfie and "
            "wearing a normal modern backpack, photorealistic museum background"
        ),
    },
]

# More CLEAN scenes — round 3 (c13-c24). New environments + body language variety.
CLEAN_SCENES_R3 = [
    "candid laugh photo on a brownstone stoop, fall jacket, latte to go",
    "subway platform selfie, headphones, daylight from above",
    "yoga studio after class, sweaty hair, water bottle in hand",
    "wine bar high-top table, dim warm light, half-empty glass of red",
    "rock climbing gym, chalk on hands, harness still on",
    "in a thrift store holding a leather jacket up to camera",
    "kitchen island chopping onions, eyes squinted with steam",
    "bicycle ride pause at a red light, helmet on, smiling",
    "bookstore cafe corner, sweater, novel face-down on table",
    "ice cream cone in front of a mural wall in Brooklyn",
    "park bench reading the Sunday newspaper, dappled sunlight",
    "small dinner party at home, half-eaten plate, candles, friend laughing in background",
]

# Round-4 absurd batch (a37-a48). All-new object-replacement concepts; no overlap
# with rounds 1-3. Aim for things the model commits to literally.
ABSURD_AI_TELLS_R4 = [
    {
        "tag": "sunflower_head",
        "label_en": "head is a giant sunflower",
        "label_zh": "头是一朵巨大的向日葵",
        "prompt": (
            "amateur dating-app selfie, the person's head is replaced by a HUGE SUNFLOWER — "
            "bright yellow petals around a brown seeded center disc where the face should be, "
            "no human face at all, normal body in a t-shirt, photorealistic, garden background"
        ),
    },
    {
        "tag": "clock_hands",
        "label_en": "hands are working clock faces",
        "label_zh": "双手是真的钟表盘",
        "prompt": (
            "amateur selfie, both visible hands are LITERAL ROUND CLOCK FACES with numbers and "
            "ticking hands — no fingers, just clock dials attached at the wrists, otherwise normal "
            "arms and shirt, photorealistic, Salvador Dalí surrealism, indoor scene"
        ),
    },
    {
        "tag": "antlers",
        "label_en": "huge deer antlers growing from forehead",
        "label_zh": "额头长出大鹿角",
        "prompt": (
            "amateur outdoor selfie, the person has LARGE BRANCHING DEER ANTLERS growing directly "
            "out of their forehead like a stag — bone-textured, multiple points, the rest of the "
            "face is normal human, photorealistic, autumn forest background"
        ),
    },
    {
        "tag": "octopus_hair",
        "label_en": "hair is live octopus tentacles",
        "label_zh": "头发是活的章鱼触手",
        "prompt": (
            "amateur indoor selfie, the person's hair is replaced by LIVE PURPLE OCTOPUS "
            "TENTACLES — visible suckers, slimy texture, several tentacles draped over shoulders, "
            "smiling normally, photorealistic, aquarium-themed restaurant background"
        ),
    },
    {
        "tag": "tv_head",
        "label_en": "head is a CRT television showing static",
        "label_zh": "头是一台显示雪花的老电视",
        "prompt": (
            "amateur selfie, the person's head is replaced by a VINTAGE BOXY CRT TELEVISION SET "
            "balanced on the neck — screen showing black-and-white static noise, plastic body, "
            "antenna on top, normal human body wearing a sweater, photorealistic"
        ),
    },
    {
        "tag": "reptile_skin",
        "label_en": "skin is bright green reptile scales",
        "label_zh": "皮肤是鲜绿色的爬虫鳞片",
        "prompt": (
            "amateur close-up selfie, the person's face and visible neck/arms are clearly covered "
            "in BRIGHT GREEN REPTILIAN SCALES, lizard-like skin, visible scale pattern, otherwise "
            "human features and smiling, photorealistic, indoor lighting"
        ),
    },
    {
        "tag": "bubble_wrap_body",
        "label_en": "body is made of bubble wrap",
        "label_zh": "整个身体是泡泡纸做的",
        "prompt": (
            "amateur selfie at home, the person's torso and arms are entirely made of clear plastic "
            "BUBBLE WRAP with visible round air-filled bubbles, head is normal, photorealistic "
            "translucent plastic texture, living-room background"
        ),
    },
    {
        "tag": "pencil_fingers",
        "label_en": "fingers are yellow #2 pencils",
        "label_zh": "手指是黄色的二号铅笔",
        "prompt": (
            "amateur close-up selfie of a hand at a desk, every finger is a YELLOW WOODEN HEX "
            "PENCIL with a sharpened tip and pink eraser at the knuckle — no flesh fingers — "
            "otherwise normal palm and wrist, photorealistic, classroom background"
        ),
    },
    {
        "tag": "bee_mouth",
        "label_en": "live bees swarming out of the mouth",
        "label_zh": "嘴里飞出一群活蜜蜂",
        "prompt": (
            "amateur close-up selfie of a smiling person, dozens of LIVE HONEY BEES are visibly "
            "crawling out of the open mouth and flying around the face, photorealistic insect "
            "anatomy, otherwise normal human face, sunny outdoor background"
        ),
    },
    {
        "tag": "yarn_body",
        "label_en": "body is knit from yarn",
        "label_zh": "身体是毛线织的",
        "prompt": (
            "amateur selfie, the person's torso, arms, and clothing are clearly made of "
            "CHUNKY KNITTED YARN — visible stitches, multicolored wool, slightly fuzzy, head is "
            "normal human, photorealistic textile texture, cozy living-room background"
        ),
    },
    {
        "tag": "origami_body",
        "label_en": "body is folded origami paper",
        "label_zh": "身体是折纸做的",
        "prompt": (
            "amateur selfie, the person's entire body (arms, torso, legs) is made of FOLDED "
            "WHITE ORIGAMI PAPER — visible sharp creases, geometric paper planes, head is normal "
            "human, photorealistic paper texture, minimalist gallery background"
        ),
    },
    {
        "tag": "long_tongue",
        "label_en": "tongue is two meters long",
        "label_zh": "舌头有两米长",
        "prompt": (
            "amateur selfie of a man laughing, his TONGUE IS ABSURDLY LONG — about two meters, "
            "dangling down past his belt, like a lizard tongue, photorealistic wet tongue texture, "
            "otherwise normal face and body, outdoor park background"
        ),
    },
]

# Round-4 clean scenes (c25-c36). New environments + body languages.
CLEAN_SCENES_R4 = [
    "concert with glow sticks waving, candid laughing mid-song",
    "train station goodbye scene, rolling suitcase, waving",
    "karaoke booth selfie, mic in hand, neon backdrop",
    "skate park sitting on the lip of a bowl, helmet propped on knee",
    "antique shop, holding up an old polaroid camera curiously",
    "outdoor public pool, sunscreen smudge on nose, towel around neck",
    "lakeside camping, beanie and flannel, mug of camp coffee",
    "grocery store aisle, basket of vegetables, mild self-conscious smile",
    "pottery class, clay on hands and apron, focused face",
    "art-gallery opening with a glass of champagne, soft hall lighting",
    "kneeling with a beagle at a dog park, both looking at the camera",
    "after a long run on an outdoor track, flushed face, water bottle",
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
    # Clean batch r1 (c01–c12)
    ("Maya", 26), ("Chloe", 24), ("Olivia", 29), ("Sara", 25),
    ("Ava", 27),  ("Lila", 23),  ("Noor", 28),   ("Iris", 30),
    ("Jordan", 26), ("Theo", 28), ("Marcus", 31), ("Eli", 25),
    # Subtle AI batch (a01–a12)
    ("Daniel", 27), ("Owen", 24), ("Leo", 30),    ("Sam", 29),
    ("Riya", 26), ("Mei", 25), ("Tasha", 29), ("Zoe", 23),
    ("Kai", 27), ("Felix", 28), ("Adrian", 30), ("Caleb", 25),
    # Absurd AI batch r2 (a13–a24)
    ("Nico", 28), ("Wren", 26), ("Aria", 24), ("Soren", 30),
    ("Hugo", 32), ("Vera", 27), ("Pablo", 29), ("Reese", 25),
    ("Otis", 28), ("Indie", 23), ("Bowen", 31), ("Cyrus", 26),
    # Absurd AI batch r3 (a25–a36)
    ("Beau", 29), ("Maple", 26), ("Lux", 24), ("Quinn", 28),
    ("Roman", 31), ("Sage", 27), ("Atlas", 30), ("Cleo", 25),
    ("Dexter", 28), ("Bea", 23), ("Tobias", 32), ("Juno", 26),
    # Clean batch r2 (c13–c24)
    ("Skye", 25), ("Holly", 28), ("Diana", 30), ("Aria", 27),
    ("Tom", 29), ("Naomi", 26), ("Casey", 24), ("Ezra", 31),
    ("Mira", 25), ("Joel", 28), ("Hana", 30), ("Ren", 27),
    # Absurd AI batch r4 (a37–a48)
    ("Mateo", 28), ("Astrid", 26), ("Knox", 30), ("Yuki", 27),
    ("Rory", 29), ("Sasha", 24), ("Wes", 31), ("Lior", 25),
    ("Brody", 28), ("Pia", 26), ("Ines", 23), ("Olek", 30),
    # Clean batch r3 (c25–c36)
    ("Talia", 25), ("Boaz", 29), ("Mara", 27), ("Levi", 31),
    ("Ines", 26), ("Hugo", 28), ("Etta", 24), ("Nora", 30),
    ("Jules", 27), ("Anders", 32), ("Yara", 25), ("Bram", 29),
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

    # Absurd batch r3 — a25–a36
    for i, tell in enumerate(ABSURD_AI_TELLS_R3):
        idx = i + 25
        name, age = PROFILES[36 + i]
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

    # Clean batch r2 — c13–c24
    for i, scene in enumerate(CLEAN_SCENES_R3):
        idx = i + 13
        name, age = PROFILES[48 + i]
        plan.append({
            "id":   f"c{idx:02d}",
            "kind": "clean",
            "tells": [],
            "name": name,
            "age":  age,
            "prompt": f"{CLEAN_BASE}, {scene}",
        })

    # Absurd batch r4 — a37–a48
    for i, tell in enumerate(ABSURD_AI_TELLS_R4):
        idx = i + 37
        name, age = PROFILES[60 + i]
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

    # Clean batch r3 — c25–c36
    for i, scene in enumerate(CLEAN_SCENES_R4):
        idx = i + 25
        name, age = PROFILES[72 + i]
        plan.append({
            "id":   f"c{idx:02d}",
            "kind": "clean",
            "tells": [],
            "name": name,
            "age":  age,
            "prompt": f"{CLEAN_BASE}, {scene}",
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
