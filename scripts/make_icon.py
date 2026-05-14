"""
make_icon.py
스마일로고PNG.png (900x900 RGBA) 기반으로 앱 아이콘 생성.
배경: 살짝 입체적인 다크 그레이 (위→아래 그라데이션 + 미세한 비네트).
"""

from PIL import Image, ImageDraw, ImageFilter
import os

SIZE       = 1024
LOGO_RATIO = 0.85                 # 캔버스 대비 로고 크기

# 그라데이션 색상 (위 → 아래) — 살짝 입체감
BG_TOP    = (68, 68, 72)          # #444448 — 위쪽 밝게
BG_BOTTOM = (40, 40, 44)          # #28282C — 아래쪽 어둡게

SRC_PATH = "/Users/yoon/Library/CloudStorage/Dropbox/01. MAKE LEMONADE (법인)/00. 사업운영 ｜ 트렁크룸, 노브라블럼 ♥/1. 트렁크룸｜TRUNK ROOM/♥ 트렁크룸 B.I｜로고/1. 공식 로고/스마일로고PNG.png"


def make_gradient_bg(size, top, bottom):
    """위 → 아래 수직 그라데이션."""
    canvas = Image.new("RGB", (size, size), top)
    px = canvas.load()
    for y in range(size):
        t = y / (size - 1)
        r = int(top[0] * (1 - t) + bottom[0] * t)
        g = int(top[1] * (1 - t) + bottom[1] * t)
        b = int(top[2] * (1 - t) + bottom[2] * t)
        for x in range(size):
            px[x, y] = (r, g, b)
    return canvas


def add_vignette(img, strength=18):
    """모서리를 살짝 어둡게 만들어 입체감 부여."""
    w, h = img.size
    mask = Image.new("L", (w, h), 255)
    draw = ImageDraw.Draw(mask)
    # 가장자리 어둡게: 큰 흰색 원을 중앙에 그리고 블러
    margin = w // 8
    draw.ellipse([margin, margin, w - margin, h - margin], fill=255)
    draw.rectangle([0, 0, w, h], outline=0, width=margin // 2)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=w // 6))

    dark = Image.new("RGB", (w, h), (0, 0, 0))
    return Image.composite(img, dark, mask).convert("RGB").point(
        lambda v: v  # no-op, composite already done
    )


def add_top_highlight(img, intensity=22):
    """상단에 미세한 광택(highlight) 추가."""
    w, h = img.size
    highlight = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(highlight)
    # 위쪽 절반 살짝 밝게
    for y in range(h // 2):
        alpha = int(intensity * (1 - y / (h / 2)) ** 2)
        draw.line([(0, y), (w, y)], fill=alpha)
    highlight = highlight.filter(ImageFilter.GaussianBlur(radius=20))

    white = Image.new("RGB", (w, h), (255, 255, 255))
    return Image.composite(white, img, highlight)


# ─── Build ────────────────────────────────────────────────────────────────────

src    = Image.open(SRC_PATH).convert("RGBA")

# 1. 그라데이션 배경
bg = make_gradient_bg(SIZE, BG_TOP, BG_BOTTOM)

# 2. 상단 하이라이트 (광택)
bg = add_top_highlight(bg, intensity=22)

# 3. 비네트 생략 — 너무 어두워짐. 그라데이션 + 하이라이트만으로 충분히 입체감.

# 4. 로고 합성
canvas = bg.convert("RGBA")
logo_size = int(SIZE * LOGO_RATIO)
logo      = src.resize((logo_size, logo_size), Image.LANCZOS)
offset    = (SIZE - logo_size) // 2
canvas.paste(logo, (offset, offset), logo)

out = canvas.convert("RGB")

paths = [
    "/Users/yoon/Developer/trunkroom/public/app-icon-1024.png",
    "/Users/yoon/Developer/trunkroom/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
]
for p in paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    out.save(p, "PNG")
    print(f"✅ {p}")
