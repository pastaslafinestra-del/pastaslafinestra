#!/usr/bin/env python3
"""
scripts/generate_og_image.py
Generador de imagen Open Graph (1200x630) optimizada para WhatsApp, Telegram, Facebook y Twitter.
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import os

def create_og_image():
    W, H = 1200, 630

    # 1. Cargar fondo hero
    hero_path = 'assets/images/hero.webp'
    hero = Image.open(hero_path).convert('RGB')

    # Escalar hero manteniendo proporción para cubrir 1200x630
    scale = max(W / hero.width, H / hero.height)
    new_w = int(hero.width * scale)
    new_h = int(hero.height * scale)
    hero_scaled = hero.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Centrar recorte vertical hacia el plato
    offset_x = (new_w - W) // 2
    offset_y = int((new_h - H) * 0.45)
    bg = hero_scaled.crop((offset_x, offset_y, offset_x + W, offset_y + H))

    # Oscurecer ligeramente y aumentar calidez
    enhancer = ImageEnhance.Brightness(bg)
    bg = enhancer.enhance(0.55)

    # 2. Capa de oscurecimiento degradada (vignette radial y linear)
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw_overlay = ImageDraw.Draw(overlay)

    # Gradiente vertical de oscurecimiento central
    for y in range(H):
        alpha = int(120 + 70 * (abs(y - H / 2) / (H / 2)))
        draw_overlay.line([(0, y), (W, y)], fill=(10, 10, 10, min(220, alpha)))

    # Combinar fondo con overlay
    final_img = Image.alpha_composite(bg.convert('RGBA'), overlay)
    draw = ImageDraw.Draw(final_img)

    # 3. Franja Bandera Italiana en el borde superior (4px)
    flag_h = 5
    draw.rectangle([0, 0, W // 3, flag_h], fill=(0, 146, 70))       # Verde
    draw.rectangle([W // 3, 0, 2 * W // 3, flag_h], fill=(255, 255, 255)) # Blanco
    draw.rectangle([2 * W // 3, 0, W, flag_h], fill=(206, 43, 55))   # Rojo

    # 4. Colocar Logo oficial recortado
    logo_path = 'assets/images/lafinestra_logo.webp'
    if os.path.exists(logo_path):
        logo_full = Image.open(logo_path).convert('RGBA')
        bbox = logo_full.getbbox()
        if bbox:
            logo_cropped = logo_full.crop(bbox)
            # Escalar logo manteniendo proporción (ancho objetivo: 460px)
            target_w = 460
            target_h = int(logo_cropped.height * (target_w / logo_cropped.width))
            logo_resized = logo_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

            # Sombra suave detrás del logo
            shadow = Image.new('RGBA', (target_w + 20, target_h + 20), (0, 0, 0, 0))
            shadow.paste((0, 0, 0, 180), (10, 10), mask=logo_resized)
            shadow = shadow.filter(ImageFilter.GaussianBlur(6))

            pos_x = (W - target_w) // 2
            pos_y = 120

            final_img.paste(shadow, (pos_x - 10, pos_y - 10), mask=shadow)
            final_img.paste(logo_resized, (pos_x, pos_y), mask=logo_resized)

    # 5. Textos informativos con fuentes de alta calidad
    try:
        font_eyebrow = ImageFont.truetype('georgia.ttf', 20)
        font_sub = ImageFont.truetype('georgia.ttf', 24)
        font_wa = ImageFont.truetype('arial.ttf', 20)
    except:
        font_eyebrow = font_sub = font_wa = ImageFont.load_default()

    # Subtítulo 1: Pastas, Pizzas y Salsas
    txt_sub = "PASTAS · PIZZAS · SALSAS FRESCAS ARTESANALES"
    sub_bbox = draw.textbbox((0, 0), txt_sub, font=font_sub)
    sub_w = sub_bbox[2] - sub_bbox[0]
    draw.text(((W - sub_w) // 2, 340), txt_sub, fill=(240, 230, 210), font=font_sub)

    # Separador sutil
    draw.line([((W - 120) // 2, 385), ((W + 120) // 2, 385)], fill=(0, 146, 70), width=2)

    # Subtítulo 2: Origen y canal de venta
    txt_loc = "San Cristóbal, Táchira · Receta Original Italiana"
    loc_bbox = draw.textbbox((0, 0), txt_loc, font=font_eyebrow)
    loc_w = loc_bbox[2] - loc_bbox[0]
    draw.text(((W - loc_w) // 2, 405), txt_loc, fill=(200, 200, 200), font=font_eyebrow)

    # Botón/Pill de WhatsApp
    txt_wa = "💬 Ordena Directo por WhatsApp & Reserva Tu Mesa"
    wa_bbox = draw.textbbox((0, 0), txt_wa, font=font_wa)
    wa_w = wa_bbox[2] - wa_bbox[0]
    pill_w = wa_w + 50
    pill_h = 44
    pill_x = (W - pill_w) // 2
    pill_y = 480

    # Dibujar pill verde
    draw.rounded_rectangle([pill_x, pill_y, pill_x + pill_w, pill_y + pill_h], radius=22, fill=(27, 107, 48), outline=(76, 217, 123), width=1)
    draw.text(((W - wa_w) // 2, pill_y + 11), txt_wa, fill=(255, 255, 255), font=font_wa)

    # 6. Marco exterior tenue
    draw.rectangle([0, 0, W - 1, H - 1], outline=(255, 255, 255, 40), width=1)

    # 7. Guardar en formato JPG (progresivo) y PNG
    os.makedirs('assets/images', exist_ok=True)
    rgb_img = final_img.convert('RGB')
    rgb_img.save('assets/images/og-image.jpg', 'JPEG', quality=92, optimize=True, progressive=True)
    final_img.save('assets/images/og-image.png', 'PNG', optimize=True)

    print("[OK] Imagen Open Graph generada con exito:")
    print(f"   * assets/images/og-image.jpg ({os.path.getsize('assets/images/og-image.jpg') // 1024} KB)")
    print(f"   * assets/images/og-image.png ({os.path.getsize('assets/images/og-image.png') // 1024} KB)")

if __name__ == '__main__':
    create_og_image()
