from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(r"C:\CodexWork\kalm-archive-p050-review")
REPORT = ROOT / "reports" / "KS-ACTIVE-ARCHIVE" / "P050-RACER-KNIT-BRA"
SOURCE = ROOT / "assets" / "images" / "review-only" / "ks-active" / "p050-racer-knit-bra" / "source-reference"
GENERATED = ROOT / "assets" / "images" / "review-only" / "ks-active" / "p050-racer-knit-bra" / "generated"

BG, INK, MUTED = "#F7F3ED", "#20201D", "#706B62"
SOURCE_TAG, GENERATED_TAG, LINE = "#8A4E36", "#355D5D", "#D9D2C7"
FONT, FONT_BOLD = r"C:\Windows\Fonts\arial.ttf", r"C:\Windows\Fonts\arialbd.ttf"


def f(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def contain(image, size):
    copy = image.convert("RGB").copy()
    copy.thumbnail(size, Image.Resampling.LANCZOS)
    panel = Image.new("RGB", size, "#FFFFFF")
    panel.paste(copy, ((size[0] - copy.width) // 2, (size[1] - copy.height) // 2))
    return panel


def crop_detail(image):
    w, h = image.size
    return image.crop((int(w * .16), int(h * .16), int(w * .84), int(h * .56)))


def pill(draw, x, y, text, source=False):
    box = draw.textbbox((0, 0), text, font=f(20, True))
    width = box[2] - box[0] + 24
    draw.rounded_rectangle((x, y, x + width, y + 38), radius=8, fill=SOURCE_TAG if source else GENERATED_TAG)
    draw.text((x + 12, y + 8), text, font=f(20, True), fill="white")


COLORS = [
    {
        "name": "Espresso", "stock": "M × 1 · L × 1", "model": "Representative approved construction standard",
        "source": "espresso-front.png", "source_note": "Exact Drive source · Espresso front",
        "views": [("Hero / three-quarter", "espresso-hero-three-quarter.png"), ("Back", "espresso-back.png"), ("Side", "espresso-side.png"), ("Front", "espresso-front.png")],
        "manual": False,
    },
    {
        "name": "Dark Green", "stock": "S × 1", "model": "Adult Black African model · short natural coils",
        "source": "espresso-front.png", "source_note": "Exact Drive construction source · manual Dark Green stock label",
        "views": [("Hero / three-quarter", "dark-green-hero.png"), ("Back", "dark-green-back.png"), ("Side", "dark-green-side.png"), ("Front", "dark-green-front.png")],
        "manual": True,
    },
    {
        "name": "Iron Blue", "stock": "S × 1 · M × 1 · L × 1", "model": "Adult East Asian model · denim styling",
        "source": "espresso-front.png", "source_note": "Exact Drive construction source · manual Iron Blue stock label",
        "views": [("Hero / three-quarter", "iron-blue-hero.png"), ("Back", "iron-blue-back.png"), ("Side", "iron-blue-side.png"), ("Front", "iron-blue-front.png")],
        "manual": True,
    },
    {
        "name": "Plum", "stock": "M × 1 · L × 1", "model": "Adult South Asian model · retained review set",
        "source": "plum-back.jpg", "source_note": "Exact historical Drive source · Plum back",
        "views": [("Hero / three-quarter", "plum-front-full.png"), ("Back", "plum-back-full.png"), ("Side", "plum-side-full.png"), ("Front", "plum-front.png")],
        "manual": False,
    },
    {
        "name": "Violet", "stock": "S × 1 · M × 1 · L × 1", "model": "Adult auburn-curled model · tailored-trouser styling",
        "source": "espresso-front.png", "source_note": "Exact Drive construction source · manual Violet stock label",
        "views": [("Hero / three-quarter", "violet-hero.png"), ("Back", "violet-back.png"), ("Side", "violet-side.png"), ("Front", "violet-front.png")],
        "manual": True,
    },
]


def load_source(filename):
    return Image.open(SOURCE / filename)


def load_generated(filename):
    return Image.open(GENERATED / filename)


def sheet_for_colour(spec):
    canvas = Image.new("RGB", (3240, 1880), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((90, 62), f"P050  |  KS ACTIVE RACER KNIT BRA  |  {spec['name'].upper()}", font=f(48, True), fill=INK)
    subtitle = f"Confirmed manual stock: {spec['stock']}  •  {spec['model']}"
    draw.text((90, 128), subtitle, font=f(24), fill=MUTED)
    if spec["manual"]:
        draw.text((90, 164), "Colour shown is a draft review representation from the manual stock label; Espresso Drive images remain the construction authority.", font=f(22), fill=MUTED)
    items = [("1. " + spec["source_note"], load_source(spec["source"]), True)] + [
        (f"{index + 2}. {title}", load_generated(filename), False) for index, (title, filename) in enumerate(spec["views"])
    ]
    positions = [(90, 240), (1130, 240), (2170, 240), (610, 1030), (1650, 1030)]
    for (title, image, source), (x, y) in zip(items, positions):
        canvas.paste(contain(image, (960, 680)), (x, y))
        pill(draw, x + 18, y + 18, "SOURCE REFERENCE - NOT FOR PUBLICATION" if source else "GENERATED MODEL REVIEW", source)
        draw.text((x, y + 712), title, font=f(25, True), fill=INK)
    canvas.save(REPORT / f"{spec['name'].upper().replace(' ', '-')}-REVIEW.jpg", quality=94, subsampling=0)


def complete_range():
    canvas = Image.new("RGB", (3500, 5120), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((110, 74), "P050  |  KS ACTIVE RACER KNIT BRA", font=f(58, True), fill=INK)
    draw.text((110, 154), "COMPLETE STOCKED-COLOUR REVIEW · DRAFT ONLY · NO STOREFRONT INTEGRATION", font=f(30, True), fill=MUTED)
    draw.text((110, 204), "Five confirmed colours · 11 physical units · generated once per stocked colour, not per size", font=f(25), fill=MUTED)
    for row, spec in enumerate(COLORS):
        y = 310 + row * 950
        draw.rounded_rectangle((80, y - 22, 3420, y + 860), radius=18, fill="#FBF9F5", outline=LINE, width=3)
        draw.text((115, y + 12), spec["name"], font=f(40, True), fill=INK)
        draw.text((115, y + 62), f"Stock: {spec['stock']}  |  {spec['model']}", font=f(23), fill=MUTED)
        image_items = [("Source", load_source(spec["source"]), True)] + [(title, load_generated(filename), False) for title, filename in spec["views"]]
        for col, (title, image, source) in enumerate(image_items):
            x = 110 + col * 670
            canvas.paste(contain(image, (610, 650)), (x, y + 125))
            pill(draw, x + 14, y + 141, "SOURCE REFERENCE" if source else "GENERATED REVIEW", source)
            draw.text((x, y + 792), title, font=f(21, True), fill=INK)
    canvas.save(REPORT / "COMPLETE-P050-REVIEW.jpg", quality=94, subsampling=0)
    canvas.save(REPORT / "DESKTOP-REVIEW.jpg", quality=94, subsampling=0)


def mobile_review():
    canvas = Image.new("RGB", (1240, 6460), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((70, 54), "P050 | KS ACTIVE RACER KNIT BRA", font=f(35, True), fill=INK)
    draw.text((70, 104), "COMPLETE STOCKED-COLOUR REVIEW · DRAFT ONLY", font=f(22, True), fill=MUTED)
    y = 175
    for spec in COLORS:
        draw.rounded_rectangle((55, y, 1185, y + 1190), radius=18, fill="#FBF9F5", outline=LINE, width=2)
        draw.text((85, y + 28), spec["name"], font=f(40, True), fill=INK)
        draw.text((85, y + 78), f"Stock: {spec['stock']}", font=f(22, True), fill=MUTED)
        if spec["manual"]:
            draw.text((85, y + 110), "Manual stock-colour representation · Espresso source locks construction", font=f(19), fill=MUTED)
        tiles = [("Source", load_source(spec["source"]), True)] + [(title, load_generated(filename), False) for title, filename in spec["views"]]
        for i, (title, image, source) in enumerate(tiles):
            x = 85 + (i % 2) * 550
            ty = y + 160 + (i // 2) * 320
            canvas.paste(contain(image, (510, 260)), (x, ty))
            pill(draw, x + 10, ty + 10, "SOURCE" if source else "GENERATED", source)
            draw.text((x, ty + 270), title, font=f(18, True), fill=INK)
        y += 1250
    canvas.save(REPORT / "P050-MOBILE-COMPLETE-REVIEW.jpg", quality=94, subsampling=0)
    canvas.save(REPORT / "MOBILE-REVIEW.jpg", quality=94, subsampling=0)


def construction_comparison():
    canvas = Image.new("RGB", (3260, 2220), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((100, 75), "P050 CONSTRUCTION COMPARISON", font=f(55, True), fill=INK)
    draw.text((100, 150), "Unaltered Espresso Drive construction reference alongside one generated hero per confirmed stocked colour.", font=f(26), fill=MUTED)
    source = load_source("espresso-front.png")
    entries = [("SOURCE REFERENCE - NOT FOR PUBLICATION", "Exact Espresso Drive construction", source, True)]
    entries += [("GENERATED MODEL REVIEW", spec["name"], load_generated(spec["views"][0][1]), False) for spec in COLORS]
    for index, (tag, title, image, is_source) in enumerate(entries):
        x = 100 + (index % 3) * 1050
        y = 270 + (index // 3) * 930
        canvas.paste(contain(image, (900, 650)), (x, y))
        pill(draw, x + 18, y + 18, tag, is_source)
        draw.text((x, y + 680), title, font=f(29, True), fill=INK)
        canvas.paste(contain(crop_detail(image), (900, 180)), (x, y + 730))
    canvas.save(REPORT / "SIDE-BY-SIDE-COMPARISON.jpg", quality=94, subsampling=0)


for color in COLORS:
    sheet_for_colour(color)
complete_range()
mobile_review()
construction_comparison()
