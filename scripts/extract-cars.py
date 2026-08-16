"""Cut the fifteen cars out of the 525 price sheets into PNGs for the app.

The sheets are flat marketing images: three cars stacked down the left, pricing
tables on the right. Cutting the cars free of their background is not worth
attempting here - several of them are black bodywork on near-black navy, and any
keying either eats the car or leaves a halo. Instead each car is cropped with its
own navy intact and its edges faded to transparent, so it drops onto the app's
navy panels invisibly.

Backgrounds are sampled per row from a car-free strip at the right of the crop
region, which keeps the car detection honest on the two sheets whose background
is graduated rather than flat.

Run:  python3 scripts/extract-cars.py
"""

from __future__ import annotations

import os

from PIL import Image

ASSETS = "/Users/wkl/.cursor/projects/Users-wkl-Desktop-JEREMY-S-APP/assets"
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "cars")

# Cars never intrude past this fraction of the sheet width; the pricing table starts after it.
CAR_REGION = 0.44
# How far a pixel must sit from its row's background before it counts as car.
CAR_THRESHOLD = 34
# The Exceed / Tiggo / MG sheet has leftover navy on the left that looks like
# car at the default threshold, which shoved those three to the right.
SHEET_THRESHOLD = {
    "image-74bd1fc2-351f-44a6-bcbe-8dbfd838ee24.png": 55,
}
# Breathing room kept around the detected car, in pixels.
PAD = 14
# Width of the alpha ramp that melts the crop edge into the app background.
FEATHER = 16

SHEETS: list[tuple[str, list[str]]] = [
    (
        "image-ee6db4b6-c7b7-428a-acbf-6f2ddbfb70a2.png",
        ["cadillac-escalade-2025", "toyota-land-cruiser-vxr-2025", "jetour-t2-2025"],
    ),
    (
        "image-6e0cd402-2861-4d85-90f0-eabc774d00bc.png",
        ["lexus-lx700h", "byd-leopard-5", "range-rover-sport-2021"],
    ),
    (
        "image-77a54403-fa85-42d0-86ce-1c3c7e629774.png",
        ["toyota-fortuner-2025", "haval-jolion-2026", "dengfang-mage-2026"],
    ),
    (
        "image-74bd1fc2-351f-44a6-bcbe-8dbfd838ee24.png",
        ["exceed-lx-2025", "chery-tiggo-7", "mg-zs"],
    ),
    (
        "image-8d299446-b9a7-495b-963b-85a536e5227b.png",
        ["byd-qin-plus", "mg-5", "mg-3"],
    ),
]


def distance(a, b) -> float:
    return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5


def row_backgrounds(px, width: int, height: int) -> list[tuple[int, int, int]]:
    """Background colour for each row, read from a strip that never contains car."""
    strip = range(max(0, width - 12), width)
    backgrounds = []
    for y in range(height):
        samples = sorted(px[x, y] for x in strip)
        backgrounds.append(samples[len(samples) // 2])
    return backgrounds


def find_bands(im: Image.Image, threshold: int) -> list[tuple[int, int]]:
    """Locate the three horizontal strips that each contain one car."""
    width = int(im.width * CAR_REGION)
    region = im.crop((0, 0, width, im.height))
    px = region.load()
    backgrounds = row_backgrounds(px, width, im.height)

    filled = [
        sum(1 for x in range(0, width - 14, 3) if distance(px[x, y], backgrounds[y]) > threshold)
        for y in range(im.height)
    ]

    bands, start = [], None
    for y, count in enumerate(filled):
        if count > 3 and start is None:
            start = y
        elif count <= 3 and start is not None:
            if y - start > 40:
                bands.append((start, y))
            start = None
    if start is not None and im.height - start > 40:
        bands.append((start, im.height))
    return bands


def car_columns(im: Image.Image, top: int, bottom: int, threshold: int) -> tuple[int, int]:
    """Horizontal extent of the car inside one band."""
    width = int(im.width * CAR_REGION)
    region = im.crop((0, top, width, bottom))
    px = region.load()
    backgrounds = row_backgrounds(px, width, region.height)

    columns = [
        sum(1 for y in range(region.height) if distance(px[x, y], backgrounds[y]) > threshold)
        for x in range(width - 14)
    ]
    hits = [x for x, count in enumerate(columns) if count > 2]
    if not hits:
        return 0, width
    return min(hits), max(hits)


def feather(tile: Image.Image) -> Image.Image:
    """Ramp the outer edge of the crop to transparent so it melts into the page."""
    tile = tile.convert("RGBA")
    width, height = tile.size
    ramp = [round(255 * (i + 1) / (FEATHER + 1)) for i in range(FEATHER)]

    alpha = Image.new("L", (width, height), 255)
    px = alpha.load()
    for i, value in enumerate(ramp):
        for x in range(width):
            px[x, i] = min(px[x, i], value)
            px[x, height - 1 - i] = min(px[x, height - 1 - i], value)
        for y in range(height):
            px[i, y] = min(px[i, y], value)
            px[width - 1 - i, y] = min(px[width - 1 - i, y], value)

    tile.putalpha(alpha)
    return tile


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    produced: list[tuple[str, Image.Image]] = []

    for filename, slugs in SHEETS:
        sheet = Image.open(os.path.join(ASSETS, filename)).convert("RGB")
        threshold = SHEET_THRESHOLD.get(filename, CAR_THRESHOLD)
        bands = find_bands(sheet, threshold)
        if len(bands) != len(slugs):
            raise SystemExit(f"{filename}: expected {len(slugs)} cars, found {len(bands)} bands {bands}")

        for (top, bottom), slug in zip(bands, slugs):
            left, right = car_columns(sheet, top, bottom, threshold)
            box = (
                max(0, left - PAD),
                max(0, top - PAD),
                min(sheet.width, right + PAD),
                min(sheet.height, bottom + PAD),
            )
            car = feather(sheet.crop(box))
            car.save(os.path.join(OUT_DIR, f"{slug}.png"))
            produced.append((slug, car))
            print(f"  {slug:32s} {car.width}x{car.height}")

    contact_sheet(produced)
    print(f"\n{len(produced)} cars written to {OUT_DIR}")


def contact_sheet(cars: list[tuple[str, Image.Image]]) -> None:
    """Proof sheet on the app's navy, which is how these will actually be seen."""
    cell_w, cell_h, cols = 330, 210, 5
    rows = (len(cars) + cols - 1) // cols
    board = Image.new("RGBA", (cell_w * cols, cell_h * rows), (17, 22, 41, 255))

    for index, (_slug, car) in enumerate(cars):
        scaled = car.copy()
        scaled.thumbnail((cell_w - 24, cell_h - 24))
        x = (index % cols) * cell_w + (cell_w - scaled.width) // 2
        y = (index // cols) * cell_h + (cell_h - scaled.height) // 2
        board.alpha_composite(scaled, (x, y))

    proof = os.path.join(os.path.dirname(os.path.abspath(__file__)), "contact-sheet.png")
    board.convert("RGB").save(proof)
    print(f"proof sheet: {proof}")


if __name__ == "__main__":
    main()
