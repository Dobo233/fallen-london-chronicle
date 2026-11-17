from PIL import Image, ImageDraw
import sys, pathlib
out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
S = 512
im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
d.rounded_rectangle([8, 8, S-8, S-8], radius=86, fill=(29, 29, 29, 255), outline=(137, 125, 103, 255), width=14)
# 纸页（带阴影）
d.rectangle([128, 92, 400, 432], fill=(145, 133, 110, 255))
d.polygon([(112, 80), (360, 80), (392, 112), (392, 420), (112, 420)], fill=(237, 227, 210, 255))
d.polygon([(360, 80), (360, 112), (392, 112)], fill=(189, 178, 158, 255))
# 墨迹行
for i, y in enumerate(range(150, 380, 38)):
    x2 = 350 if i % 3 != 2 else 270
    d.rounded_rectangle([150, y, x2, y + 12], radius=6, fill=(117, 107, 90, 255))
# 青色书签
d.polygon([(300, 60), (348, 60), (348, 200), (324, 176), (300, 200)], fill=(66, 104, 107, 255))
d.line([(300, 60), (300, 200)], fill=(95, 149, 155, 255), width=6)
for n in (16, 32, 48, 128):
    im.resize((n, n), Image.LANCZOS).save(out / f'icon{n}.png')
im.save(out / 'icon512.png')
