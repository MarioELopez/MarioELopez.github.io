#!/usr/bin/env python3
"""
generate_og.py — Genera imágenes Open Graph para marioelopez.github.io
Formatos: 1200x630 (estándar), 1200x1200 (cuadrado WhatsApp/Instagram)

Uso:
    python generate_og.py

Requiere:
    pip install Pillow
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import os, math, textwrap

# ── Rutas ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
FOTO_PATH    = os.path.join(SCRIPT_DIR, "FOTO_PERFIL.jpg")
OUT_STANDARD = os.path.join(SCRIPT_DIR, "og-image.png")
OUT_SQUARE   = os.path.join(SCRIPT_DIR, "og-image-square.png")

# ── Paleta ─────────────────────────────────────────────────────────────────────
BG_DARK    = (14, 14, 18)        # fondo principal
BG_CARD    = (22, 22, 30)        # tarjeta interna
ACCENT     = (212, 104, 42)      # naranja (#d4682a)
ACCENT2    = (255, 160, 80)      # naranja claro
WHITE      = (255, 255, 255)
GRAY_L     = (200, 200, 210)
GRAY_M     = (130, 130, 145)
GRAY_D     = (55, 55, 68)

# ── Textos ─────────────────────────────────────────────────────────────────────
INFO = {
    "name"     : "Mario E. López C.",
    "title"    : "Ingeniero Industrial",
    "subtitle" : "Automatización · Datos · Lean",
    "location" : "Santa Cruz de la Sierra, Bolivia",
    "url"      : "marioelopez.github.io",
    "initials" : "ML",
}


# ══════════════════════════════════════════════════════════════════════════════
#  Utilidades
# ══════════════════════════════════════════════════════════════════════════════

def load_font(size, bold=False):
    """Carga DejaVu Sans (incluida en Pillow) o fallback a default."""
    candidates = []
    if bold:
        candidates = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/calibrib.ttf",
        ]
    else:
        candidates = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/calibri.ttf",
        ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def circle_photo(path, size):
    """Recorta foto circular con borde de acento."""
    try:
        img = Image.open(path).convert("RGBA")
    except Exception:
        return None
    # Recorte cuadrado centrado
    w, h = img.size
    m = min(w, h)
    left = (w - m) // 2
    top  = (h - m) // 2
    img  = img.crop((left, top, left + m, top + m))
    img  = img.resize((size, size), Image.LANCZOS)

    # Máscara circular
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(img, mask=mask)
    return result


def draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=width)


def draw_dot_grid(draw, x0, y0, x1, y1, step=28, color=(40, 40, 55)):
    for gx in range(x0, x1, step):
        for gy in range(y0, y1, step):
            draw.ellipse((gx-1, gy-1, gx+1, gy+1), fill=color)


def glow_circle(canvas, cx, cy, radius, color, alpha_max=60):
    """Dibuja un círculo difuminado (glow) sobre canvas RGBA."""
    for r in range(radius, 0, -8):
        a = int(alpha_max * (1 - r / radius) ** 1.5)
        overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(overlay)
        d.ellipse((cx-r, cy-r, cx+r, cy+r), fill=(*color, a))
        canvas = Image.alpha_composite(canvas, overlay)
    return canvas


def text_bbox(draw, text, font):
    """Compatible Pillow ≥9 y <9."""
    try:
        bb = draw.textbbox((0, 0), text, font=font)
        return bb[2] - bb[0], bb[3] - bb[1]
    except AttributeError:
        return draw.textsize(text, font=font)


# ══════════════════════════════════════════════════════════════════════════════
#  Generador principal
# ══════════════════════════════════════════════════════════════════════════════

def make_image(width, height, out_path):
    canvas = Image.new("RGBA", (width, height), (*BG_DARK, 255))

    # ── Fondo: rejilla de puntos ───────────────────────────────────────────────
    draw = ImageDraw.Draw(canvas)
    draw_dot_grid(draw, 0, 0, width, height, step=32, color=(32, 32, 46))

    # ── Glows de fondo ────────────────────────────────────────────────────────
    canvas = glow_circle(canvas, int(width * 0.12), int(height * 0.88),
                         int(min(width, height) * 0.65), ACCENT, alpha_max=45)
    canvas = glow_circle(canvas, int(width * 0.82), int(height * 0.18),
                         int(min(width, height) * 0.45), (60, 80, 160), alpha_max=30)

    draw = ImageDraw.Draw(canvas)

    # ── Tarjeta interior ──────────────────────────────────────────────────────
    PAD = int(width * 0.038)
    card = (PAD, PAD, width - PAD, height - PAD)
    draw_rounded_rect(draw, card, radius=22,
                      fill=(*BG_CARD, 210), outline=(*GRAY_D, 180), width=1)

    # ── Barra superior de acento ──────────────────────────────────────────────
    bar_h = max(5, int(height * 0.008))
    draw.rounded_rectangle([card[0]+1, card[1]+1, card[2]-1, card[1]+bar_h+18],
                            radius=22, fill=(*ACCENT, 220))
    # suavizar la parte de abajo de la barra
    draw.rectangle([card[0]+1, card[1]+bar_h+2, card[2]-1, card[1]+bar_h+18],
                   fill=(*BG_CARD, 210))

    # ── Foto de perfil (derecha) ───────────────────────────────────────────────
    is_square = (width == height)
    if is_square:
        photo_size = int(height * 0.30)
        photo_cx   = width // 2
        photo_cy   = int(height * 0.30)
    else:
        photo_size = int(height * 0.52)
        photo_cx   = int(width * 0.815)
        photo_cy   = height // 2

    photo = circle_photo(FOTO_PATH, photo_size)

    # Anillo de acento detrás de la foto
    ring = photo_size + 10
    ring_img = Image.new("RGBA", (ring, ring), (0, 0, 0, 0))
    ImageDraw.Draw(ring_img).ellipse((0, 0, ring, ring), outline=(*ACCENT, 200), width=4)
    canvas.alpha_composite(ring_img,
                           (photo_cx - ring//2, photo_cy - ring//2))

    if photo:
        canvas.alpha_composite(photo,
                               (photo_cx - photo_size//2, photo_cy - photo_size//2))
    else:
        # Iniciales como fallback
        fallback = Image.new("RGBA", (photo_size, photo_size), (0, 0, 0, 0))
        fd = ImageDraw.Draw(fallback)
        fd.ellipse((0, 0, photo_size, photo_size), fill=(*ACCENT, 230))
        fi = load_font(int(photo_size * 0.36), bold=True)
        tw, th = text_bbox(fd, INFO["initials"], fi)
        fd.text(((photo_size-tw)//2, (photo_size-th)//2),
                INFO["initials"], font=fi, fill=WHITE)
        canvas.alpha_composite(fallback, (photo_cx - photo_size//2, photo_cy - photo_size//2))

    draw = ImageDraw.Draw(canvas)

    # ── Columna de texto ──────────────────────────────────────────────────────
    if is_square:
        tx = int(width * 0.08)
        ty = int(height * 0.50)
        max_text_w = int(width * 0.84)
    else:
        tx = int(width * 0.075)
        ty = int(height * 0.18)
        max_text_w = int(width * 0.56)

    # Fuentes base
    fn_med  = load_font(int(height * (0.062 if is_square else 0.068)), bold=False)
    fn_sm   = load_font(int(height * (0.050 if is_square else 0.055)), bold=False)
    fn_xs   = load_font(int(height * 0.042), bold=False)

    # Nombre — ajusta tamaño automáticamente para no salirse del ancho
    name_size_start = int(height * (0.115 if is_square else 0.125))
    fn_big = load_font(name_size_start, bold=True)
    while text_bbox(draw, INFO["name"], fn_big)[0] > max_text_w and name_size_start > 40:
        name_size_start -= 4
        fn_big = load_font(name_size_start, bold=True)

    # Dibuja nombre
    draw.text((tx, ty), INFO["name"], font=fn_big, fill=WHITE)
    ty += int(text_bbox(draw, INFO["name"], fn_big)[1] * 1.12)

    # Línea separadora
    draw.rectangle([tx, ty, tx + int(max_text_w * 0.42), ty + 3],
                   fill=(*ACCENT, 220))
    ty += 14

    # Título
    draw.text((tx, ty), INFO["title"], font=fn_med, fill=(*ACCENT2, 255))
    ty += int(text_bbox(draw, INFO["title"], fn_med)[1] * 1.2)

    # Subtítulo
    draw.text((tx, ty), INFO["subtitle"], font=fn_sm, fill=(*GRAY_L, 220))
    ty += int(text_bbox(draw, INFO["subtitle"], fn_sm)[1] * 1.6)

    # Ubicación con ícono
    loc_text = "📍 " + INFO["location"]
    draw.text((tx, ty), loc_text, font=fn_xs, fill=(*GRAY_M, 230))
    ty += int(text_bbox(draw, loc_text, fn_xs)[1] * 1.5)

    # URL con acento
    draw.text((tx, ty), "🔗 " + INFO["url"], font=fn_xs, fill=(*ACCENT, 240))

    # ── Logo / marca en esquina inferior ─────────────────────────────────────
    fn_logo = load_font(int(height * 0.038), bold=True)
    logo_txt = "✦ marioelopez.github.io"
    lw, lh = text_bbox(draw, logo_txt, fn_logo)
    draw.text((card[2] - lw - 18, card[3] - lh - 16),
              logo_txt, font=fn_logo, fill=(*ACCENT, 160))

    # ── Guardar ───────────────────────────────────────────────────────────────
    final = canvas.convert("RGB")
    final.save(out_path, "PNG", optimize=True)
    print(f"✅ Guardado: {out_path}  ({width}×{height})")


# ══════════════════════════════════════════════════════════════════════════════
#  Entrada
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("🎨 Generando imágenes OG…\n")
    make_image(1200, 630,  OUT_STANDARD)   # OG estándar / WhatsApp / Twitter
    make_image(1200, 1200, OUT_SQUARE)     # Instagram / WhatsApp cuadrado
    print("\n✨ Listo. Archivos generados en:", SCRIPT_DIR)
