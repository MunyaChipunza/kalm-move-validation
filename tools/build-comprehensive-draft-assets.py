"""Create review contact sheets and responsive WebP derivatives for the KALM comprehensive draft."""
from __future__ import annotations

import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
FONT = ImageFont.load_default()


def load(path: Path, size: tuple[int, int]) -> Image.Image:
    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        return ImageOps.contain(image, size, Image.Resampling.LANCZOS)


def contact_sheet(paths: list[Path], labels: list[str], output: Path, columns: int = 3) -> None:
    cell_w, cell_h, label_h, gap = 420, 520, 68, 20
    rows = (len(paths) + columns - 1) // columns
    canvas = Image.new("RGB", (columns * cell_w + (columns + 1) * gap, rows * (cell_h + label_h) + (rows + 1) * gap), "#f5f3ef")
    draw = ImageDraw.Draw(canvas)
    for index, (path, label) in enumerate(zip(paths, labels)):
        col, row = index % columns, index // columns
        x, y = gap + col * (cell_w + gap), gap + row * (cell_h + label_h + gap)
        frame = Image.new("RGB", (cell_w, cell_h), "#ffffff")
        image = load(path, (cell_w - 24, cell_h - 24))
        frame.paste(image, ((cell_w - image.width) // 2, (cell_h - image.height) // 2))
        canvas.paste(frame, (x, y))
        draw.multiline_text((x, y + cell_h + 10), label, fill="#151515", font=FONT, spacing=3)
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, quality=92)


def make_derivatives(source: Path, desktop: Path, tablet: Path | None, mobile: Path) -> None:
    with Image.open(source) as raw:
        image = ImageOps.exif_transpose(raw).convert("RGB")
        for target, size in [(desktop, (1920, 1080)), (tablet, (1440, 1080)) if tablet else (None, None), (mobile, (960, 1280))]:
            if not target:
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            ImageOps.fit(image, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.42)).save(target, "WEBP", quality=91, method=6)


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    board = sub.add_parser("reference-board")
    board.add_argument("--output", type=Path, required=True)
    board.add_argument("paths", nargs="+", type=Path)
    derivatives = sub.add_parser("derivatives")
    derivatives.add_argument("--source", type=Path, required=True)
    derivatives.add_argument("--desktop", type=Path, required=True)
    derivatives.add_argument("--tablet", type=Path)
    derivatives.add_argument("--mobile", type=Path, required=True)
    sheet = sub.add_parser("contact-sheet")
    sheet.add_argument("--output", type=Path, required=True)
    sheet.add_argument("paths", nargs="+", type=Path)
    args = parser.parse_args()
    if args.command == "reference-board":
        labels = [f"{path.parent.parent.name.replace('-', ' ')}\n{path.parent.name.replace('-', ' ')}" for path in args.paths]
        contact_sheet(args.paths, labels, args.output)
    elif args.command == "contact-sheet":
        contact_sheet(args.paths, [path.stem.replace("-", " ") for path in args.paths], args.output, columns=min(3, len(args.paths)))
    else:
        make_derivatives(args.source, args.desktop, args.tablet, args.mobile)


if __name__ == "__main__":
    main()
