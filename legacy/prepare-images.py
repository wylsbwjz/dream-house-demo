from PIL import Image, ImageEnhance
from pathlib import Path

root = Path(r"E:/Codex/Projects/2026-10-28/dream-house")
out = root / "demo/public/img"

def save(im, name, max_w=1680, quality=86):
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    im.convert("RGB").save(out / name, "JPEG", quality=quality, optimize=True, progressive=True)
    print(name, im.size, (out / name).stat().st_size)

base = Image.open(root / "assets/p04-room-background-v1.png")
w, h = base.size

# C：干净的全景，作为主空间与对比基准
save(base, "room-c.jpg")

# A：偏左的采光与沙发，略暖、略亮
a = base.crop((0, 0, int(w * 0.72), h))
a = ImageEnhance.Brightness(a).enhance(1.04)
a = ImageEnhance.Color(a).enhance(1.04)
save(a, "room-a.jpg")

# B：偏右的餐桌与办公位，略冷、略收
b = base.crop((int(w * 0.30), 0, w, h))
b = ImageEnhance.Color(b).enhance(0.86)
b = ImageEnhance.Brightness(b).enhance(0.98)
b = ImageEnhance.Contrast(b).enhance(1.03)
save(b, "room-b.jpg")

# 灵感抽屉材质参考
sq = base.crop((int(w * 0.36), int(h * 0.08), int(w * 0.82), int(h * 0.62)))
sq = sq.resize((900, 900), Image.LANCZOS)
save(sq, "material-ref.jpg", max_w=900)
