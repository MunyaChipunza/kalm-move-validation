from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from hashlib import sha256
import json

ROOT = Path(r"C:\CodexWork\kalm-archive-p050-review")
REPORT = ROOT / "reports" / "KS-ACTIVE-ARCHIVE" / "P049-RIB-CONTOUR-LEGGING"
SOURCE = ROOT / "assets" / "images" / "review-only" / "ks-active" / "p049-rib-contour-legging" / "source-reference" / "supplier-main.jpg"
GENERATED = ROOT / "assets" / "images" / "review-only" / "ks-active" / "p049-rib-contour-legging" / "generated"

BG, INK, MUTED, LINE = "#F7F3ED", "#20201D", "#706B62", "#D9D2C7"
SOURCE_TAG, GENERATED_TAG = "#8A4E36", "#355D5D"
FONT, FONT_BOLD = r"C:\Windows\Fonts\arial.ttf", r"C:\Windows\Fonts\arialbd.ttf"

COLORS = [
    {"slug": "bright-green", "name": "Bright Green", "stock": "S × 1", "model": "Adult Black African model · charcoal cropped technical jacket", "source_note": "Supplier construction source · manual Bright Green physical-stock label"},
    {"slug": "white", "name": "White", "stock": "M × 1", "model": "Adult model · grey sleeveless studio top", "source_note": "Exact supplier construction source · White garment at right"},
    {"slug": "peach-yellow", "name": "Peach Yellow", "stock": "M × 1", "model": "Adult South Asian model · ivory cropped knit top", "source_note": "Supplier construction source · manual Peach Yellow physical-stock label"},
    {"slug": "egyptian-blue", "name": "Egyptian Blue", "stock": "M × 1", "model": "Adult East Asian model · soft-grey cropped polo", "source_note": "Supplier construction source · manual Egyptian Blue physical-stock label"},
    {"slug": "gray", "name": "Gray", "stock": "M × 1", "model": "Adult auburn-curled model · deep-plum cropped half-zip", "source_note": "Supplier construction source · manual Gray physical-stock label"},
    {"slug": "red", "name": "Red", "stock": "M × 2", "model": "Adult Middle Eastern model · black mock-neck crop top", "source_note": "Supplier construction source · manual Red physical-stock label"},
]


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


def pill(draw, x, y, label, is_source=False, small=False):
    text_font = font(15 if small else 19, True)
    bbox = draw.textbbox((0, 0), label, font=text_font)
    width = bbox[2] - bbox[0] + (18 if small else 24)
    height = 30 if small else 38
    draw.rounded_rectangle((x, y, x + width, y + height), radius=8, fill=SOURCE_TAG if is_source else GENERATED_TAG)
    draw.text((x + (9 if small else 12), y + (7 if small else 8)), label, font=text_font, fill="white")


def source_image():
    return Image.open(SOURCE)


def generated(slug, view):
    return Image.open(GENERATED / f"{slug}-{view}.png")


def asset_record(path, role, colour=None, view=None):
    image = Image.open(path)
    data = {
        "role": role,
        "path": str(path.relative_to(ROOT)).replace("\\", "/"),
        "sha256": sha256(path.read_bytes()).hexdigest().upper(),
        "dimensions": {"width": image.width, "height": image.height},
    }
    image.close()
    if colour:
        data["colour"] = colour
    if view:
        data["view"] = view
    return data


def sheet_for_colour(spec):
    canvas = Image.new("RGB", (3300, 2110), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((90, 58), f"P049  |  KS ACTIVE RIB CONTOUR LEGGING  |  {spec['name'].upper()}", font=font(48, True), fill=INK)
    draw.text((90, 122), f"Confirmed physical stock: {spec['stock']}  •  {spec['model']}", font=font(23), fill=MUTED)
    draw.text((90, 158), "Source is construction authority. Every generated model view is DRAFT REVIEW ONLY and requires final physical-stock confirmation.", font=font(20), fill=MUTED)
    items = [("1. " + spec["source_note"], source_image(), True)] + [
        (f"{i + 2}. {title}", generated(spec["slug"], filename), False)
        for i, (title, filename) in enumerate([
            ("Hero / three-quarter", "hero-three-quarter"), ("Back", "back"), ("Side", "side"), ("Front", "front")
        ])
    ]
    positions = [(90, 255), (1130, 255), (2170, 255), (610, 1120), (1650, 1120)]
    for (title, image, is_source), (x, y) in zip(items, positions):
        canvas.paste(contain(image, (960, 680)), (x, y))
        pill(draw, x + 16, y + 16, "SOURCE REFERENCE - NOT FOR PUBLICATION" if is_source else "GENERATED MODEL REVIEW", is_source)
        draw.text((x, y + 710), title, font=font(23, True), fill=INK)
    out = REPORT / f"{spec['slug'].upper()}-REVIEW.jpg"
    canvas.save(out, quality=94, subsampling=0)


def complete_range():
    canvas = Image.new("RGB", (3500, 6200), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((100, 65), "P049  |  KS ACTIVE RIB CONTOUR LEGGING", font=font(57, True), fill=INK)
    draw.text((100, 145), "COMPLETE STOCKED-COLOUR REVIEW · DRAFT ONLY · NO STOREFRONT INTEGRATION", font=font(29, True), fill=MUTED)
    draw.text((100, 195), "Six confirmed colours · seven physical units · source first for every colour · sizes not generated separately", font=font(24), fill=MUTED)
    for row, spec in enumerate(COLORS):
        y = 295 + row * 970
        draw.rounded_rectangle((70, y - 18, 3430, y + 885), radius=18, fill="#FBF9F5", outline=LINE, width=3)
        draw.text((108, y + 12), spec["name"], font=font(40, True), fill=INK)
        draw.text((108, y + 62), f"Stock: {spec['stock']}  |  {spec['model']}", font=font(22), fill=MUTED)
        tiles = [("Source", source_image(), True)] + [
            (title, generated(spec["slug"], filename), False)
            for title, filename in [("Hero", "hero-three-quarter"), ("Back", "back"), ("Side", "side"), ("Front", "front")]
        ]
        for col, (title, image, is_source) in enumerate(tiles):
            x = 105 + col * 670
            canvas.paste(contain(image, (610, 650)), (x, y + 125))
            pill(draw, x + 14, y + 140, "SOURCE" if is_source else "GENERATED", is_source, small=True)
            draw.text((x, y + 795), title, font=font(20, True), fill=INK)
    canvas.save(REPORT / "COMPLETE-P049-REVIEW.jpg", quality=94, subsampling=0)
    canvas.save(REPORT / "DESKTOP-REVIEW.jpg", quality=94, subsampling=0)


def mobile_review():
    canvas = Image.new("RGB", (1240, 7460), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((60, 52), "P049 | KS ACTIVE RIB CONTOUR LEGGING", font=font(34, True), fill=INK)
    draw.text((60, 100), "COMPLETE STOCKED-COLOUR REVIEW · DRAFT ONLY", font=font(21, True), fill=MUTED)
    draw.text((60, 133), "Source first · 6 colours · 7 physical units · no purchase controls", font=font(17), fill=MUTED)
    y = 195
    for spec in COLORS:
        canvas_draw = ImageDraw.Draw(canvas)
        canvas_draw.rounded_rectangle((48, y, 1192, y + 1170), radius=18, fill="#FBF9F5", outline=LINE, width=2)
        canvas_draw.text((80, y + 26), spec["name"], font=font(37, True), fill=INK)
        canvas_draw.text((80, y + 74), f"Stock: {spec['stock']}", font=font(21, True), fill=MUTED)
        tiles = [("Source", source_image(), True)] + [
            (title, generated(spec["slug"], filename), False)
            for title, filename in [("Hero", "hero-three-quarter"), ("Back", "back"), ("Side", "side"), ("Front", "front")]
        ]
        for i, (title, image, is_source) in enumerate(tiles):
            x = 80 + (i % 2) * 555
            ty = y + 132 + (i // 2) * 318
            canvas.paste(contain(image, (520, 260)), (x, ty))
            pill(canvas_draw, x + 9, ty + 9, "SOURCE" if is_source else "GENERATED", is_source, small=True)
            canvas_draw.text((x, ty + 270), title, font=font(17, True), fill=INK)
        y += 1210
    canvas.save(REPORT / "P049-MOBILE-COMPLETE-REVIEW.jpg", quality=94, subsampling=0)
    canvas.save(REPORT / "MOBILE-REVIEW.jpg", quality=94, subsampling=0)


def comparison():
    canvas = Image.new("RGB", (3500, 3380), BG)
    draw = ImageDraw.Draw(canvas)
    draw.text((92, 62), "P049 — SOURCE-LOCKED CONSTRUCTION COMPARISON", font=font(52, True), fill=INK)
    draw.text((92, 132), "Check high waistband, continuous vertical rib, plain ankle, colour label and absence of logo, pockets, panels, scrunch or ombré.", font=font(22), fill=MUTED)
    entries = [("SOURCE REFERENCE", "Supplier construction source", source_image(), True)] + [
        ("GENERATED MODEL REVIEW", spec["name"], generated(spec["slug"], "hero-three-quarter"), False) for spec in COLORS
    ]
    for i, (tag, title, image, is_source) in enumerate(entries):
        x = 92 + (i % 3) * 1120
        y = 245 + (i // 3) * 1020
        canvas.paste(contain(image, (990, 700)), (x, y))
        pill(draw, x + 16, y + 16, tag, is_source)
        draw.text((x, y + 728), title, font=font(25, True), fill=INK)
        canvas.paste(contain(detail(image), (990, 190)), (x, y + 775))
    canvas.save(REPORT / "SIDE-BY-SIDE-COMPARISON.jpg", quality=94, subsampling=0)


def write_manifest():
    assets = [asset_record(SOURCE, "supplier_construction_reference")]
    for spec in COLORS:
        for view in ["hero-three-quarter", "back", "side", "front"]:
            path = GENERATED / f"{spec['slug']}-{view}.png"
            assets.append(asset_record(path, "generated_model_review", spec["name"], view.replace("-", "_")))
    data = {
        "schemaVersion": 1,
        "productCode": "P049",
        "status": "complete_stocked_colour_review_awaiting_final_munya_approval",
        "workingName": "KS Active Rib Contour Legging",
        "sourcePolicy": "The unaltered supplier listing image is the exact construction authority. White is visibly present at right; other colours are manual physical-stock label representations pending physical comparison.",
        "confirmedStock": [
            {"colour": "Bright Green", "size": "S", "quantity": 1},
            {"colour": "White", "size": "M", "quantity": 1},
            {"colour": "Peach Yellow", "size": "M", "quantity": 1},
            {"colour": "Egyptian Blue", "size": "M", "quantity": 1},
            {"colour": "Gray", "size": "M", "quantity": 1},
            {"colour": "Red", "size": "M", "quantity": 2}
        ],
        "totalPhysicalUnits": 7,
        "galleryOrder": ["source_reference", "hero_three_quarter", "back", "side", "front"],
        "assets": assets,
        "storefrontIntegration": False,
        "zohoUpdated": False,
        "intranetUpdated": False,
        "productionDeployed": False
    }
    (REPORT / "P049-COMPLETE-ASSET-MANIFEST.json").write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8", newline="\n")


for colour in COLORS:
    sheet_for_colour(colour)
complete_range()
mobile_review()
comparison()
write_manifest()
