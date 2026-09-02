"""Draw assets/og.png, the 1200x630 share card.

Built from the same primitives as the page: the ground line with its notch, the
engineering floor converging into the opening, and the three recessed orders of
the gateway. No text is drawn here, so one card serves both languages; the
headline a platform shows comes from the meta tags.
"""

import os

from PIL import Image, ImageDraw

W, H = 1200, 630
BG = (7, 8, 11)
LINE = (255, 255, 255, 30)
LINE_STRONG = (255, 255, 255, 61)
GRID_MINOR = (214, 222, 236, 14)
GRID_MAJOR = (214, 222, 236, 30)
ACCENT = (53, 224, 194, 255)
EDGES = [(255, 255, 255, 26), (255, 255, 255, 43), (255, 255, 255, 71)]

card = Image.new("RGB", (W, H), BG)
layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
draw = ImageDraw.Draw(layer)

DATUM_Y = 470
GATE_CX = 880

# ---- floor: engineering paper in perspective, converging into the opening ----
floor = Image.new("RGBA", (W, H), (0, 0, 0, 0))
fd = ImageDraw.Draw(floor)
for step in range(1, 34):                      # lines running away from the viewer
    t = step / 34
    y = DATUM_Y + (H - DATUM_Y) * (t ** 2.1)
    colour = GRID_MAJOR if step % 4 == 0 else GRID_MINOR
    fd.line([(0, y), (W, y)], fill=colour, width=1)
for i in range(-26, 27):                       # lines running toward the opening
    colour = GRID_MAJOR if i % 4 == 0 else GRID_MINOR
    fd.line([(GATE_CX + i * 15, DATUM_Y), (GATE_CX + i * 190, H)], fill=colour, width=1)

# fade the floor out at the bottom edge
mask = Image.new("L", (W, H), 0)
md = ImageDraw.Draw(mask)
for y in range(DATUM_Y, H):
    md.line([(0, y), (W, y)], fill=int(255 * max(0.0, 1 - ((y - DATUM_Y) / (H - DATUM_Y)) ** 1.6)))
floor.putalpha(Image.composite(floor.getchannel("A"), Image.new("L", (W, H), 0), mask))
layer.alpha_composite(floor)

# ---- gateway: three orders, each stepped in and down ----
for order, edge in enumerate(EDGES):
    inset = order * 26
    half = 200 - inset
    top = 92 + inset
    left, right = GATE_CX - half, GATE_CX + half
    spring = top + half                        # where the arc meets the jambs
    draw.arc([left, top, right, top + 2 * half], start=180, end=360, fill=edge, width=2)
    draw.line([(left, spring), (left, DATUM_Y)], fill=edge, width=2)
    draw.line([(right, spring), (right, DATUM_Y)], fill=edge, width=2)

# Light falling through the opening, brightest at the crown. It is masked to the
# silhouette of the innermost order, so no rectangle edge ever shows.
inner = 200 - 2 * 26
inner_top = 92 + 52
shape = Image.new("L", (W, H), 0)
sd = ImageDraw.Draw(shape)
sd.pieslice(
    [GATE_CX - inner, inner_top, GATE_CX + inner, inner_top + 2 * inner],
    start=180, end=360, fill=255,
)
sd.rectangle([GATE_CX - inner, inner_top + inner, GATE_CX + inner, DATUM_Y], fill=255)

ramp = Image.new("L", (W, H), 0)
rd = ImageDraw.Draw(ramp)
for y in range(inner_top, DATUM_Y):
    fade = max(0.0, 1 - (y - inner_top) / (DATUM_Y - inner_top) * 1.4)
    rd.line([(0, y), (W, y)], fill=int(34 * fade))

glow = Image.new("RGBA", (W, H), (190, 206, 255, 0))
glow.putalpha(Image.composite(ramp, Image.new("L", (W, H), 0), shape))
layer.alpha_composite(glow)

# ---- the ground line, carrying the signature notch and its light ----
draw.line([(0, DATUM_Y), (W, DATUM_Y)], fill=LINE, width=1)
NOTCH_X, NOTCH_W, NOTCH_H = 88, 46, 23
draw.arc(
    [NOTCH_X, DATUM_Y - NOTCH_H, NOTCH_X + NOTCH_W, DATUM_Y + NOTCH_H],
    start=180, end=360, fill=LINE_STRONG, width=2,
)
draw.line([(NOTCH_X, DATUM_Y - NOTCH_H // 2), (NOTCH_X, DATUM_Y)], fill=LINE_STRONG, width=2)
draw.line(
    [(NOTCH_X + NOTCH_W, DATUM_Y - NOTCH_H // 2), (NOTCH_X + NOTCH_W, DATUM_Y)],
    fill=LINE_STRONG, width=2,
)
draw.rectangle(
    [NOTCH_X + NOTCH_W // 2 - 4, DATUM_Y - 9, NOTCH_X + NOTCH_W // 2 + 4, DATUM_Y - 1],
    fill=ACCENT,
)

card.paste(Image.alpha_composite(Image.new("RGBA", (W, H), BG + (255,)), layer).convert("RGB"))

# ---- the lockup, standing on the ground line ----
lockup = Image.open("assets/logo-lockup.webp").convert("RGBA")
target_w = 470
lockup = lockup.resize(
    (target_w, round(lockup.height * target_w / lockup.width)), Image.LANCZOS
)
card.paste(lockup, (88, DATUM_Y - 60 - lockup.height), lockup)

card.save("assets/og.png", optimize=True)
print(f"assets/og.png  {W}x{H}  {os.path.getsize('assets/og.png') / 1024:.0f} KB")
