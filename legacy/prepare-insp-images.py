from PIL import Image, ImageEnhance, ImageFilter
from pathlib import Path

root = Path(r"E:/Codex/Projects/2026-10-28/dream-house")
out = root / "demo/public/img"

def save(im, name, max_w=1200, quality=84):
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    im.convert("RGB").save(out / name, "JPEG", quality=quality, optimize=True, progressive=True)
    print(name, im.size, (out / name).stat().st_size)

a = Image.open(root / "assets/p04-room-background-v1.png")  # 干净房间全景
c = Image.open(root / "assets/p04-room-selected-v3.png")
w, h = a.size

# 灵感封面 1：浅木色小户型（暖亮）
i1 = a.crop((0, int(h * 0.06), int(w * 0.82), h))
i1 = ImageEnhance.Brightness(i1).enhance(1.07)
i1 = ImageEnhance.Color(i1).enhance(1.05)
save(i1, "insp-nordic.jpg")

# 灵感封面 2：木质餐桌近景（暖棕）
i2 = a.crop((int(w * 0.28), int(h * 0.18), w, h))
i2 = ImageEnhance.Brightness(i2).enhance(0.99)
i2 = ImageEnhance.Color(i2).enhance(1.1)
save(i2, "insp-wood.jpg")

# 灵感封面 3：绿植与阳光（橄榄调）
i3 = a.crop((0, 0, int(w * 0.68), int(h * 0.86)))
i3 = ImageEnhance.Brightness(i3).enhance(1.0)
i3 = ImageEnhance.Color(i3).enhance(0.9)
i3 = ImageEnhance.Contrast(i3).enhance(1.06)
save(i3, "insp-olive.jpg")

# 灵感封面 4：奶油侘寂（材质近景，柔化）
i4 = c.crop((int(c.width * 0.30), int(c.height * 0.06), int(c.width * 0.86), int(c.height * 0.84)))
i4 = i4.filter(ImageFilter.GaussianBlur(1.1))
i4 = ImageEnhance.Brightness(i4).enhance(1.06)
i4 = ImageEnhance.Color(i4).enhance(0.92)
save(i4, "insp-cream.jpg")
