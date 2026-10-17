"""Genera los íconos PNG de la PWA (requiere Pillow: pip install pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)
BRAND = (79, 70, 229)
WHITE = (255, 255, 255)


def icono(size: int, maskable: bool = False, radius_ratio: float = 0.22) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if maskable:
        d.rectangle([0, 0, size, size], fill=BRAND)
        pad = size * 0.22
    else:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * radius_ratio), fill=BRAND)
        pad = size * 0.16
    # Birrete (gorro de graduación) estilizado
    cx, s = size / 2, size - 2 * pad
    top = pad + s * 0.18
    d.polygon([(cx, top), (pad + s, top + s * 0.22), (cx, top + s * 0.44), (pad, top + s * 0.22)], fill=WHITE)
    d.polygon(
        [(pad + s * 0.22, top + s * 0.34), (cx, top + s * 0.48), (pad + s * 0.78, top + s * 0.34),
         (pad + s * 0.78, top + s * 0.6), (cx, top + s * 0.72), (pad + s * 0.22, top + s * 0.6)],
        fill=WHITE,
    )
    w = max(2, int(s * 0.035))
    d.line([(pad + s * 0.9, top + s * 0.26), (pad + s * 0.9, top + s * 0.62)], fill=WHITE, width=w)
    d.ellipse([pad + s * 0.9 - w * 1.4, top + s * 0.62 - w, pad + s * 0.9 + w * 1.4, top + s * 0.62 + w * 1.8], fill=WHITE)
    return img


icono(192).save(OUT / "icon-192.png")
icono(512).save(OUT / "icon-512.png")
icono(512, maskable=True).save(OUT / "icon-maskable-512.png")
apple = Image.new("RGB", (180, 180), BRAND)
apple.paste(icono(180, maskable=True), (0, 0))
apple.save(OUT / "apple-touch-icon.png")
print("Íconos generados en", OUT)
