from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(r"C:\CodexWork\kalm-archive-p050-review")
REPORT = ROOT / "reports" / "KS-ACTIVE-ARCHIVE" / "P050-RACER-KNIT-BRA"
SOURCE = ROOT / "assets" / "images" / "review-only" / "ks-active" / "p050-racer-knit-bra" / "source-reference"
GENERATED = ROOT / "assets" / "images" / "review-only" / "ks-active" / "p050-racer-knit-bra" / "generated"

BG = "#F7F3ED"
INK = "#20201D"
MUTED = "#706B62"
SOURCE_TAG = "#8A4E36"
GENERATED_TAG = "#355D5D"
LINE = "#D9D2C7"
FONT = r"C:\Windows\Fonts\arial.ttf"
FONT_BOLD = r"C:\Windows\Fonts\arialbd.ttf"


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def cover(image, size):
    return ImageOps.fit(image.convert("RGB"), size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.4))


def contain(image, size):
    copy = image.convert("RGB").copy()
    copy.thumbnail(size, Image.Resampling.LANCZOS)
    panel = Image.new("RGB", size, "#FFFFFF")
    panel.paste(copy, ((size[0] - copy.width) // 2, (size[1] - copy.height) // 2))
    return panel


def label(draw, xy, text, kind):
    x, y = xy
    fill = SOURCE_TAG if kind == "source" else GENERATED_TAG
    box = draw.textbbox((0, 0), text, font=font(22, True))
    width = (box[2] - box[0]) + 28
    draw.rounded_rectangle((x, y, x + width, y + 42), radius=8, fill=fill)
    draw.text((x + 14, y + 9), text, font=font(22, True), fill="white")


def caption(draw, x, y, title, note):
    draw.text((x, y), title, font=font(31, True), fill=INK)
    draw.text((x, y + 39), note, font=font(23), fill=MUTED)


assets = {
    "source_front": Image.open(SOURCE / "espresso-front.png"),
    "source_back": Image.open(SOURCE / "espresso-back.png"),
    "hero": Image.open(GENERATED / "espresso-hero-three-quarter.png"),
    "back": Image.open(GENERATED / "espresso-back.png"),
    "side": Image.open(GENERATED / "espresso-side.png"),
    "front": Image.open(GENERATED / "espresso-front.png"),
}


def crop_garment(name):
    img = assets[name]
    boxes = {
        "hero": (180, 390, 825, 940),
        "back": (135, 390, 835, 1055),
        "side": (175, 410, 760, 1030),
        "front": (175, 470, 800, 1040),
    }
    return img.crop(boxes[name])


def build_comparison():
    width, height = 3200, 5000
    canvas = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((100, 85), "P050  |  KS ACTIVE RACER KNIT BRA", font=font(56, True), fill=INK)
    draw.text((100, 160), "ESPRESSO REPRESENTATIVE COLOUR  •  DRAFT-ONLY SOURCE-LOCKED REVIEW", font=font(30, True), fill=MUTED)
    draw.text((100, 211), "Left: unaltered Drive source reference. Centre: generated model review. Right: 100% garment-detail crop.", font=font(25), fill=MUTED)
    col_w, panel_h = 900, 900
    x_positions = [100, 1150, 2200]
    rows = [340, 1500, 2660, 3820]
    specs = [
        ("hero", "MODEL HERO / THREE-QUARTER", "source_front"),
        ("back", "MODEL BACK", "source_back"),
        ("side", "MODEL SIDE", "source_front"),
        ("front", "MODEL FRONT", "source_front"),
    ]
    for row_y, (generated_key, title, source_key) in zip(rows, specs):
        draw.rounded_rectangle((80, row_y - 24, 3120, row_y + 1055), radius=20, outline=LINE, width=3, fill="#FBF9F5")
        entries = [
            (assets[source_key], "SOURCE REFERENCE - NOT FOR PUBLICATION", "source", "Exact unaltered Drive copy"),
            (assets[generated_key], "GENERATED MODEL REVIEW", "generated", title),
            (crop_garment(generated_key), "100% GARMENT DETAIL CROP", "generated", "Construction QA crop"),
        ]
        for x, (img, tag, kind, note) in zip(x_positions, entries):
            panel = contain(img, (col_w, panel_h))
            canvas.paste(panel, (x, row_y + 80))
            label(draw, (x + 20, row_y + 100), tag, kind)
            caption(draw, x, row_y + 1005, note, "P050 · Espresso")
    canvas.save(REPORT / "SIDE-BY-SIDE-COMPARISON.jpg", quality=94, subsampling=0)


def tile(canvas, draw, x, y, image, tag, title, kind, tile_size=(960, 690)):
    panel = contain(image, tile_size)
    canvas.paste(panel, (x, y))
    label(draw, (x + 18, y + 18), tag, kind)
    draw.text((x, y + tile_size[1] + 18), title, font=font(28, True), fill=INK)


def build_desktop():
    width, height = 3240, 1880
    canvas = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((100, 65), "P050  |  KS ACTIVE RACER KNIT BRA  |  ESPRESSO", font=font(48, True), fill=INK)
    draw.text((100, 128), "Representative-colour review only · no storefront integration · no sale state", font=font(25), fill=MUTED)
    tiles = [
        (assets["source_front"], "SOURCE REFERENCE - NOT FOR PUBLICATION", "Exact Drive source · front", "source"),
        (assets["source_back"], "SOURCE REFERENCE - NOT FOR PUBLICATION", "Exact Drive source · back", "source"),
        (assets["hero"], "GENERATED MODEL REVIEW", "Hero / three-quarter", "generated"),
        (assets["back"], "GENERATED MODEL REVIEW", "Back", "generated"),
        (assets["side"], "GENERATED MODEL REVIEW", "Side", "generated"),
        (assets["front"], "GENERATED MODEL REVIEW", "Front", "generated"),
    ]
    positions = [(100, 230), (1140, 230), (2180, 230), (100, 1030), (1140, 1030), (2180, 1030)]
    for pos, data in zip(positions, tiles):
        tile(canvas, draw, pos[0], pos[1], data[0], data[1], data[2], data[3])
    canvas.save(REPORT / "DESKTOP-REVIEW.jpg", quality=94, subsampling=0)


def mobile_tile(canvas, draw, y, image, tag, title, kind):
    x = 70
    w, h = 1060, 690
    panel = contain(image, (w, h))
    canvas.paste(panel, (x, y + 68))
    label(draw, (x + 20, y + 88), tag, kind)
    draw.text((x, y + 18), title, font=font(34, True), fill=INK)
    return y + 820


def build_mobile():
    width, height = 1200, 5350
    canvas = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((70, 56), "P050 | KS ACTIVE RACER KNIT BRA", font=font(36, True), fill=INK)
    draw.text((70, 106), "ESPRESSO · REPRESENTATIVE COLOUR", font=font(25, True), fill=MUTED)
    draw.text((70, 145), "Swipe-style review sheet. Draft only.", font=font(24), fill=MUTED)
    y = 220
    tiles = [
        (assets["source_front"], "SOURCE REFERENCE - NOT FOR PUBLICATION", "1. Exact Drive source · front", "source"),
        (assets["source_back"], "SOURCE REFERENCE - NOT FOR PUBLICATION", "2. Exact Drive source · back", "source"),
        (assets["hero"], "GENERATED MODEL REVIEW", "3. Hero / three-quarter", "generated"),
        (assets["back"], "GENERATED MODEL REVIEW", "4. Back", "generated"),
        (assets["side"], "GENERATED MODEL REVIEW", "5. Side", "generated"),
        (assets["front"], "GENERATED MODEL REVIEW", "6. Front", "generated"),
    ]
    for item in tiles:
        y = mobile_tile(canvas, draw, y, *item)
    canvas.save(REPORT / "MOBILE-REVIEW.jpg", quality=94, subsampling=0)


build_comparison()
build_desktop()
build_mobile()
