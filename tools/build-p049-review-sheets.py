from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"C:\CodexWork\kalm-archive-p050-review")
REPORT = ROOT / "reports" / "KS-ACTIVE-ARCHIVE" / "P049-RIB-CONTOUR-LEGGING"
SOURCE = ROOT / "assets" / "images" / "review-only" / "ks-active" / "p049-rib-contour-legging" / "source-reference" / "supplier-main.jpg"
GENERATED = ROOT / "assets" / "images" / "review-only" / "ks-active" / "p049-rib-contour-legging" / "generated"

BG, INK, MUTED, LINE = "#F7F3ED", "#20201D", "#706B62", "#D9D2C7"
SOURCE_TAG, GENERATED_TAG = "#8A4E36", "#355D5D"
FONT, FONT_BOLD = r"C:\Windows\Fonts\arial.ttf", r"C:\Windows\Fonts\arialbd.ttf"


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def contain(image, size):
    copy = image.convert("RGB").copy()
    copy.thumbnail(size, Image.Resampling.LANCZOS)
    panel = Image.new("RGB", size, "#FFFFFF")
    panel.paste(copy, ((size[0] - copy.width) // 2, (size[1] - copy.height) // 2))
    return panel


def detail(image):
    w, h = image.size
    return image.crop((int(w * .20), int(h * .34), int(w * .80), int(h * .76)))


def pill(draw, x, y, label, source=False, small=False):
    text_font = font(16 if small else 21, True)
    bbox = draw.textbbox((0, 0), label, font=text_font)
    width = bbox[2] - bbox[0] + (20 if small else 26)
    height = 32 if small else 40
    draw.rounded_rectangle((x, y, x + width, y + height), radius=8, fill=SOURCE_TAG if source else GENERATED_TAG)
    draw.text((x + (10 if small else 13), y + (7 if small else 9)), label, font=text_font, fill="white")


items = [
    ("1. Exact unaltered supplier reference", Image.open(SOURCE), True),
    ("2. Generated hero / three-quarter", Image.open(GENERATED / "white-hero-three-quarter.png"), False),
    ("3. Generated back", Image.open(GENERATED / "white-back.png"), False),
    ("4. Generated side", Image.open(GENERATED / "white-side.png"), False),
    ("5. Generated front", Image.open(GENERATED / "white-front.png"), False),
]


def contact_sheet():
    canvas = Image.new("RGB", (3400, 2240), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((100, 70), "P049  |  KS ACTIVE RIB CONTOUR LEGGING", font=font(58, True), fill=INK)
    draw.text((100, 150), "WHITE / M × 1 · REPRESENTATIVE REVIEW ONLY · PRICE PENDING · NOT FOR PUBLICATION", font=font(28, True), fill=MUTED)
    draw.text((100, 198), "Source first: the unaltered supplier reference. All model images are generated construction checks, not storefront assets.", font=font(23), fill=MUTED)
    positions = [(100, 300), (1190, 300), (2280, 300), (645, 1250), (1735, 1250)]
    for (title, image, is_source), (x, y) in zip(items, positions):
        canvas.paste(contain(image, (1020, 760)), (x, y))
        pill(draw, x + 16, y + 16, "SOURCE REFERENCE - NOT FOR PUBLICATION" if is_source else "GENERATED MODEL REVIEW", is_source)
        draw.text((x, y + 790), title, font=font(25, True), fill=INK)
        if is_source:
            draw.text((x, y + 828), "Supplier composition: White legging is at right; folded colours are not selected variants.", font=font(18), fill=MUTED)
    canvas.save(REPORT / "P049-WHITE-REVIEW.jpg", quality=94, subsampling=0)


def comparison():
    canvas = Image.new("RGB", (3400, 2430), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((100, 70), "P049 WHITE — SOURCE-LOCKED CONSTRUCTION COMPARISON", font=font(53, True), fill=INK)
    draw.text((100, 140), "Check high waistband, continuous vertical rib, plain ankle, White colour and absence of scrunch, panels, logos or ombré.", font=font(24), fill=MUTED)
    for idx, (title, image, is_source) in enumerate(items):
        x = 100 + (idx % 3) * 1080
        y = 260 + (idx // 3) * 1060
        canvas.paste(contain(image, (980, 700)), (x, y))
        pill(draw, x + 15, y + 15, "SOURCE REFERENCE" if is_source else "GENERATED REVIEW", is_source)
        draw.text((x, y + 725), title, font=font(23, True), fill=INK)
        canvas.paste(contain(detail(image), (980, 210)), (x, y + 780))
        draw.text((x, y + 1010), "100% construction-detail crop", font=font(18), fill=MUTED)
    canvas.save(REPORT / "SIDE-BY-SIDE-COMPARISON.jpg", quality=94, subsampling=0)


def mobile():
    canvas = Image.new("RGB", (1240, 4880), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((55, 50), "P049 | KS ACTIVE RIB CONTOUR LEGGING", font=font(34, True), fill=INK)
    draw.text((55, 99), "WHITE / M × 1 · REPRESENTATIVE REVIEW · DRAFT ONLY", font=font(20, True), fill=MUTED)
    draw.text((55, 132), "Source first. No purchase or public catalogue integration.", font=font(18), fill=MUTED)
    y = 205
    for title, image, is_source in items:
        draw.rounded_rectangle((50, y, 1190, y + 875), radius=18, fill="#FBF9F5", outline=LINE, width=2)
        canvas.paste(contain(image, (1050, 690)), (95, y + 100))
        pill(draw, 110, y + 118, "SOURCE REFERENCE" if is_source else "GENERATED MODEL REVIEW", is_source, small=True)
        draw.text((95, y + 810), title, font=font(22, True), fill=INK)
        y += 920
    canvas.save(REPORT / "MOBILE-REVIEW.jpg", quality=94, subsampling=0)


contact_sheet()
comparison()
mobile()
(REPORT / "DESKTOP-REVIEW.jpg").write_bytes((REPORT / "P049-WHITE-REVIEW.jpg").read_bytes())
