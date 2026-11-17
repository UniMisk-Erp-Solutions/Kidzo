"""Kidzopedia 19s launch reel - code-only renderer (no browser).

Frames are composited with Pillow from:
  * real app screens captured earlier from the React app  -> assets/app/*.png
  * the app's own illustrations / brand mark               -> assets/story/*, assets/brand/*
and piped to ffmpeg. Voiceover is mixed in build.py.

Run:  ..\\.venv\\Scripts\\python.exe render.py   (from video/reel)
"""
import math, subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from i18n import STR
from hbtext import HFont, hb_text_img
LANG = os.environ.get('REEL_LANG', 'en'); S = STR[LANG]

W, H, FPS, DUR = 1080, 1920, 30, 19.0
HERE = os.path.dirname(os.path.abspath(__file__))
A = lambda *p: os.path.join(HERE, "assets", *p)

# ---- palette sampled from the real app screens -----------------------------------------
CREAM = (250, 245, 234)
CREAM2 = (243, 232, 215)
BRICK = (160, 66, 46)
INK = (70, 36, 28)
SOFT = (120, 86, 76)

# ---- timing (seconds): voice-driven, see build.py for the matching audio offsets ----------
T = S["T"]

# ---- fonts ------------------------------------------------------------------------------
def vfont(path, size, wght=700, **axes):
    f = ImageFont.truetype(path, size)
    try:
        names = [a["name"] if isinstance(a["name"], str) else a["name"].decode() for a in f.get_variation_axes()]
        vals = []
        for a, n in zip(f.get_variation_axes(), names):
            n = n.lower()
            if "weight" in n: vals.append(wght)
            elif "optical" in n or "opsz" in n: vals.append(min(max(size * 0.5, a["minimum"]), a["maximum"]))
            else: vals.append(axes.get(n, a["default"]))
        f.set_variation_by_axes(vals)
    except Exception:
        pass
    return f

if LANG == "hi":
    _SANS = lambda w: A("fonts", "NotoSansDevanagari-ExtraBold.ttf" if w >= 800 else ("NotoSansDevanagari-Bold.ttf" if w >= 700 else "NotoSansDevanagari-SemiBold.ttf"))
    FR = lambda s, w=800: HFont(A("fonts", "NotoSerifDevanagari-ExtraBold.ttf"), s)
    IN = lambda s, w=700: HFont(_SANS(w), s)
    CV = lambda s, w=700: HFont(A("fonts", "Kalam-Bold.ttf"), s)
else:
    FR = lambda s, w=800: vfont(A("fonts", "Fraunces.ttf"), s, w)
    IN = lambda s, w=700: vfont(A("fonts", "Inter.ttf"), s, w)
    CV = lambda s, w=700: vfont(A("fonts", "Caveat.ttf"), s, w)

# ---- easing -----------------------------------------------------------------------------
clamp = lambda x, a=0.0, b=1.0: max(a, min(b, x))
def prog(t, a, b): return clamp((t - a) / (b - a)) if b > a else 1.0
def out_cubic(x): return 1 - (1 - x) ** 3
def out_back(x, s=0.9): x -= 1; return 1 + (s + 1) * x ** 3 + s * x ** 2
def in_out(x): return x * x * x * (x * (x * 6 - 15) + 10)   # smootherstep
def float_(t, ph=0.0, amp=7.0, f=0.33): return amp * math.sin(2 * math.pi * f * t + ph)
def lerp(a, b, x): return a + (b - a) * x

# ---- image helpers ----------------------------------------------------------------------
def load(path, w=None, h=None, mode="RGBA"):
    im = Image.open(path).convert(mode)
    if w and not h: h = round(im.height * w / im.width)
    if h and not w: w = round(im.width * h / im.height)
    return im.resize((w, h), Image.LANCZOS) if w else im

def rounded(im, r):
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255)
    out = im.copy(); out.putalpha(ImageChops.multiply(out.getchannel("A"), m)); return out

def shadow(size, r, blur=28, alpha=70, color=(70, 36, 28)):
    pad = blur * 3
    s = Image.new("RGBA", (size[0] + pad * 2, size[1] + pad * 2), color + (0,))
    d = Image.new("L", s.size, 0)
    ImageDraw.Draw(d).rounded_rectangle((pad, pad, pad + size[0], pad + size[1]), r, fill=alpha)
    s.putalpha(d.filter(ImageFilter.GaussianBlur(blur))); return s, pad

_SCALED = {}
def _base(im, scale):
    """Pre-filtered copy near the target scale so the affine step only resamples by a few percent."""
    if scale >= 1.0: return im, 1.0
    q = max(0.02, round(scale * 40) / 40)
    k = (id(im), q)
    if k not in _SCALED:
        _SCALED[k] = im.resize((max(1, round(im.width * q)), max(1, round(im.height * q))), Image.LANCZOS)
    return _SCALED[k], q

def _clip(canvas, t, x0, y0):
    cx0, cy0 = max(0, x0), max(0, y0)
    cx1, cy1 = min(canvas.width, x0 + t.width), min(canvas.height, y0 + t.height)
    if cx1 <= cx0 or cy1 <= cy0: return
    canvas.alpha_composite(t.crop((cx0 - x0, cy0 - y0, cx1 - x0, cy1 - y0)), (cx0, cy0))

def put(canvas, im, cx, cy, scale=1.0, rot=0.0, alpha=1.0, sx=1.0):
    if alpha <= 0.003 or scale <= 0.001: return
    base, q = _base(im, scale)
    r = scale / q                       # residual scale applied by the affine step
    kx, ky = r * sx, r
    bw, bh = base.size
    th = math.radians(rot)
    c_, s_ = math.cos(th), math.sin(th)
    corners = [(-bw / 2, -bh / 2), (bw / 2, -bh / 2), (bw / 2, bh / 2), (-bw / 2, bh / 2)]
    xs, ys = [], []
    for px, py in corners:
        X, Y = px * kx, py * ky
        xs.append(X * c_ + Y * s_); ys.append(-X * s_ + Y * c_)
    x0, y0 = math.floor(cx + min(xs)) - 2, math.floor(cy + min(ys)) - 2
    ow, oh = math.ceil(max(xs) - min(xs)) + 5, math.ceil(max(ys) - min(ys)) + 5
    if ow < 2 or oh < 2: return
    dx0, dy0 = x0 - cx, y0 - cy
    a_ = c_ / kx; b_ = -s_ / kx; d_ = s_ / ky; e_ = c_ / ky
    c0 = a_ * dx0 + b_ * dy0 + bw / 2
    f0 = d_ * dx0 + e_ * dy0 + bh / 2
    t = base.transform((ow, oh), Image.AFFINE, (a_, b_, c0, d_, e_, f0), Image.BICUBIC)
    if alpha < 1: t.putalpha(t.getchannel("A").point(lambda v: int(v * alpha)))
    _clip(canvas, t, x0, y0)

def text_img(txt, font, fill, spacing=0, stroke=None):
    if isinstance(font, HFont): return hb_text_img(txt, font, fill)
    d = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    bb = d.textbbox((0, 0), txt, font=font)
    pad = 12
    im = Image.new("RGBA", (bb[2] - bb[0] + pad * 2, bb[3] - bb[1] + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((pad - bb[0], pad - bb[1]), txt, font=font, fill=fill)
    return im

def dtext(img, xy, txt, font, fill):
    """Centred text on an RGBA image; Devanagari goes through HarfBuzz."""
    if isinstance(font, HFont):
        t = text_img(txt, font, fill); img.alpha_composite(t, (round(xy[0] - t.width / 2), round(xy[1] - t.height / 2)))
    else:
        ImageDraw.Draw(img).text(xy, txt, font=font, fill=fill, anchor="mm")

def lines(txts, font, fill, gap=10, align="center"):
    ims = [text_img(t, font, fill) for t in txts]
    w = max(i.width for i in ims); h = sum(i.height for i in ims) + gap * (len(ims) - 1)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0)); y = 0
    for i in ims:
        out.alpha_composite(i, ((w - i.width) // 2 if align == "center" else 0, y)); y += i.height + gap
    return out

# ---- assets -----------------------------------------------------------------------------
def photo_card(path, label, date, w=500, tilt_tape=BRICK):
    ph = load(path, 440, 440, "RGB").convert("RGBA")
    card = Image.new("RGBA", (w, 640), (0, 0, 0, 0))
    base = Image.new("RGBA", (w, 640), (255, 253, 248, 255))
    card.paste(rounded(base, 18), (0, 0))
    card.alpha_composite(rounded(ph, 8), ((w - 440) // 2, 30))
    dtext(card, (w // 2, 520), label, CV(52, 700), INK)
    dtext(card, (w // 2, 585), date, IN(26, 600), SOFT)
    tape = Image.new("RGBA", (150, 44), tilt_tape + (150,))
    card.alpha_composite(tape.rotate(3, expand=True), (w // 2 - 75, -8))
    sh, pad = shadow(card.size, 18, 26, 80)
    full = Image.new("RGBA", sh.size, (0, 0, 0, 0)); full.alpha_composite(sh); full.alpha_composite(card, (pad, pad))
    return full

PH = {k: A("story", f"p{k}.jpg") for k in range(1, 7)}
brand = load(A("brand", "kidzopedia-logo.png"), 330)
_CP = {"first_smile": 1, "first_steps": 3, "birthday": 2, "words": 5}
CARD = {k: photo_card(PH[_CP[k]], S["CARDS"][k][0], S["CARDS"][k][1]) for k in _CP}

def hook_card(path, date_txt):
    ph = load(path, 760, 760, "RGB").convert("RGBA")
    card = Image.new("RGBA", (820, 940), (0, 0, 0, 0))
    card.paste(rounded(Image.new("RGBA", (820, 940), (255, 253, 248, 255)), 26), (0, 0))
    card.alpha_composite(rounded(ph, 12), (30, 30))
    sh, pad = shadow(card.size, 26, 34, 85)
    full = Image.new("RGBA", sh.size, (0, 0, 0, 0)); full.alpha_composite(sh); full.alpha_composite(card, (pad, pad))
    return full

HOOK = [hook_card(PH[1], "newborn"), hook_card(PH[2], "1 year"), hook_card(PH[4], "2 years")]

# app screens
SCR_W = 500
def screen(name):
    im = load(A("app", name), SCR_W, None, "RGB").convert("RGBA")
    return im
SCREEN = {k: screen(f"{k}.png") for k in ["home-0", "moments-0", "moments-700", "moments-1400", "books-0", "home-1500"]}
SCR_H = SCREEN["home-0"].height

def phone(screen_im):
    bez = 22
    w, h = screen_im.width + bez * 2, screen_im.height + bez * 2
    body = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(body).rounded_rectangle((0, 0, w - 1, h - 1), 78, fill=(38, 26, 24, 255))
    body.alpha_composite(rounded(screen_im, 58), (bez, bez))
    ImageDraw.Draw(body).rounded_rectangle((w // 2 - 70, bez + 10, w // 2 + 70, bez + 34), 12, fill=(38, 26, 24, 255))
    sh, pad = shadow(body.size, 78, 40, 95)
    full = Image.new("RGBA", sh.size, (0, 0, 0, 0)); full.alpha_composite(sh); full.alpha_composite(body, (pad, pad))
    return full, bez, pad

def screens_blend(a, b, x):
    return Image.blend(a, b, clamp(x))

# Open memory book built from the user's photo pages (assets/app/book-page-left.png, book-page-right.png)
PW, PHT = 380, 600
def _cover_crop(path):
    im = Image.open(path).convert("RGB"); ratio = PW / PHT
    if im.width / im.height > ratio:
        nw = round(im.height * ratio); x0 = (im.width - nw) // 2; im = im.crop((x0, 0, x0 + nw, im.height))
    else:
        nh = round(im.width / ratio); im = im.crop((0, 0, im.width, nh))
    return im.resize((PW, PHT), Image.LANCZOS).convert("RGBA")

def _framed_print(path):
    # the square collage is kept whole: mounted on cream paper like a printed photo, not cropped
    paper = Image.new("RGBA", (PW, PHT), (255, 250, 240, 255))
    im = Image.open(path).convert("RGB"); w = PW - 28; h = round(im.height * w / im.width)
    im = im.resize((w, h), Image.LANCZOS).convert("RGBA")
    pr = Image.new("RGBA", (w + 24, h + 24), (255, 255, 255, 255)); pr.alpha_composite(im, (12, 12))
    sh, pad = shadow(pr.size, 4, 14, 90)
    comp = Image.new("RGBA", sh.size, (0, 0, 0, 0)); comp.alpha_composite(sh); comp.alpha_composite(pr, (pad, pad))
    comp = comp.rotate(-2, Image.BICUBIC, expand=True)
    paper.alpha_composite(comp, ((PW - comp.width) // 2, (PHT - comp.height) // 2))
    return paper

def make_spread():
    m = 26
    w, h = PW * 2 + m * 2, PHT + m * 2
    book = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(book).rounded_rectangle((0, 0, w - 1, h - 1), 20, fill=(112, 58, 44, 255))
    book.alpha_composite(_cover_crop(A("app", "book-page-left.png")), (m, m))
    book.alpha_composite(_cover_crop(A("app", "book-page-right.png")), (m + PW, m))
    sp = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(sp)
    for i in range(46):
        a = int(110 * (1 - i / 46) ** 2)
        d.line((w // 2 - i, m, w // 2 - i, h - m), fill=(40, 20, 14, a)); d.line((w // 2 + i, m, w // 2 + i, h - m), fill=(40, 20, 14, a))
    book.alpha_composite(sp)
    ImageDraw.Draw(book).line((w // 2, m, w // 2, h - m), fill=(60, 30, 22, 200), width=2)
    sh, pad = shadow(book.size, 20, 38, 100)
    full = Image.new("RGBA", sh.size, (0, 0, 0, 0)); full.alpha_composite(sh); full.alpha_composite(book, (pad, pad))
    return full
SPREAD = make_spread()

def bg_frame(t):
    img = Image.new("RGBA", (W, H), CREAM + (255,))
    # soft vignette-ish glow, static
    return img

def _grad():
    top, bot = (251, 246, 236), (246, 226, 208)
    col = Image.new("RGB", (1, H))
    for y in range(H):
        k = y / (H - 1)
        col.putpixel((0, y), tuple(round(top[i] + (bot[i] - top[i]) * k) for i in range(3)))
    return col.resize((W, H)).convert("RGBA")
BG = _grad()

# ---- text overlays ----------------------------------------------------------------------
def headline(txts, size, fill=INK, w=900):
    return lines(txts, FR(size, 850), fill, gap=int(size * (0.2 if LANG == 'hi' else 0.08)))

def caption(txt):
    f = IN(40, 700)
    if isinstance(f, HFont):
        tx = text_img(txt, f, (255, 250, 240)); pw, ph_ = tx.width - 24 + 70, 84
        im = Image.new("RGBA", (pw, ph_), (0, 0, 0, 0))
        ImageDraw.Draw(im).rounded_rectangle((0, 0, pw - 1, ph_ - 1), 42, fill=(70, 36, 28, 215))
        im.alpha_composite(tx, ((pw - tx.width) // 2, (ph_ - tx.height) // 2 + 2))
        return im
    d = ImageDraw.Draw(Image.new("RGBA", (1, 1))); bb = d.textbbox((0, 0), txt, font=f)
    pw, ph_ = bb[2] - bb[0] + 70, 84
    im = Image.new("RGBA", (pw, ph_), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((0, 0, pw - 1, ph_ - 1), 42, fill=(70, 36, 28, 215))
    ImageDraw.Draw(im).text((pw // 2, ph_ // 2 + 1), txt, font=f, fill=(255, 250, 240), anchor="mm")
    return im

CAPS = S["CAPS"]  # (start, end, text) - mirrors the narration
CAPIMG = [caption(c[2]) for c in CAPS]

HL = {k: headline(v[0], v[1], BRICK if k == "to" else INK) for k, v in S["HL"].items()}
HL["from"] = HL.pop("frm")
LABEL = {"smile": text_img(S["LAB_SMILE"], IN(46, 800), BRICK), "steps": text_img(S["LAB_STEPS"], IN(46, 800), BRICK)}
PILL = Image.new("RGBA", (560, 120), (0, 0, 0, 0))
ImageDraw.Draw(PILL).rounded_rectangle((0, 0, 559, 119), 60, fill=BRICK + (255,))
dtext(PILL, (280, 62), S["PILL"], IN(52, 800), (255, 246, 236))
WORD = text_img("KIDZOPEDIA", FR(84, 850), INK)

PHONE_CACHE = {}
def phone_for(key):
    if key not in PHONE_CACHE: PHONE_CACHE[key] = phone(SCREEN[key])
    return PHONE_CACHE[key]
BLENDS = {}
def blend_phone(a, b, x):
    k = (a, b, round(x * 12))
    if k not in BLENDS:
        BLENDS[k] = phone(Image.blend(SCREEN[a], SCREEN[b], k[2] / 12))
    return BLENDS[k]

LINE = Image.new("RGBA", (8, 820), (0, 0, 0, 0))
for _y in range(0, 820, 36):
    ImageDraw.Draw(LINE).rounded_rectangle((1, _y, 7, _y + 16), 3, fill=BRICK + (255,))

def fade_in(t, a, d=0.25): return clamp((t - a) / d)
def fade_out(t, b, d=0.2): return clamp((b - t) / d)

# ---- scenes -----------------------------------------------------------------------------
OV = 0.4  # scenes 1-3 and 5's headlines overlap the next scene by this long, so everything cross-dissolves

def scene1(c, t):
    L = T["s1"][1] - T["s1"][0]; g = fade_out(t, L + OV, 0.5)
    x01 = in_out(prog(t, 0.35, 0.95)); x12 = in_out(prog(t, 1.05, 1.7))
    cy = 850 + float_(t, 0, 8)
    rot = lerp(-3, 2, in_out(prog(t, 0, 2.7)))
    sc = 0.76 * (1 + 0.03 * in_out(prog(t, 0, 2.7)))
    put(c, HOOK[0], W / 2, cy, sc, rot, (1 - x01) * g)
    put(c, HOOK[1], W / 2, cy, sc, rot, x01 * (1 - x12) * g)
    put(c, HOOK[2], W / 2, cy, sc, rot, x12 * g)
    months = round(lerp(0, 26, in_out(prog(t, 0.2, 2.1))))
    lab = S["ticker"](months)
    off = sc * (862 - 470)
    put(c, text_img(lab, IN(40, 800), BRICK), W / 2 + math.sin(math.radians(rot)) * off, cy + off * math.cos(math.radians(rot)), 1, rot, g)
    z = 1 + 0.02 * in_out(prog(t, 0, 2.7))
    if "grow2" in HL:   # two-part hook: statement, then question
        sw = in_out(prog(t, 1.55, 2.0))
        put(c, HL["grow"], W / 2, 310, z, 0, (1 - sw) * g)
        put(c, HL["grow2"], W / 2, 310, z, 0, sw * g)
    else:
        put(c, HL["grow"], W / 2, 310, z, 0, g)

def scene2(c, t, lt):
    L = T["s2"][1] - T["s2"][0]; g = fade_out(lt, L + OV, 0.5)
    a = out_back(prog(lt, 0.0, 0.8)); b = out_back(prog(lt, 0.9, 1.7))
    put(c, CARD["first_smile"], 340, 720 + float_(lt, 0), 0.72 * (0.85 + 0.15 * a), -6 + (1 - a) * -10, fade_in(lt, 0, 0.35) * g)
    put(c, CARD["first_steps"], 740, 925 + float_(lt, 2), 0.72 * (0.85 + 0.15 * b), 5 + (1 - b) * 10, fade_in(lt, 0.9, 0.35) * g)
    put(c, LABEL["smile"], 340, 440, 1, 0, fade_in(lt, 0.25, 0.4) * g)
    put(c, LABEL["steps"], 740, 1195, 1, 0, fade_in(lt, 1.15, 0.4) * g)
    put(c, text_img(S["KICK"], IN(40, 700), SOFT), W / 2, 270, 1, 0, fade_in(lt, 0, 0.4) * g)

def scene3(c, t, lt):
    L = T["s3"][1] - T["s3"][0]; g = fade_out(lt, L + OV, 0.5)
    x = in_out(prog(lt, 0.0, 1.4))
    cards = [("first_smile", 340, 560, S["M3"][0], -4), ("birthday", 740, 800, S["M3"][1], 4), ("first_steps", 340, 1040, S["M3"][2], -3)]
    put(c, LINE, 540, 800, 1, 0, x * g)
    for i, (key, cx, cy, lab, rot) in enumerate(cards):
        sx0, sy0, sr0 = [(340, 720, -6), (540, 860, 0), (740, 925, 5)][i]
        put(c, CARD[key], lerp(sx0, cx, x), lerp(sy0, cy, x) + float_(lt, i * 2) * x, lerp(0.72, 0.42, x), lerp(sr0, rot, x), g)
        lx = 740 if cx < 540 else 340
        put(c, text_img(lab, FR(46, 850), BRICK), lx, cy, 1, 0, fade_in(lt, 1.1 + i * 0.12, 0.5) * g)
    put(c, HL["moment"], W / 2, 250, 1, 0, fade_in(lt, 0.2, 0.5) * g)
    pa = out_cubic(prog(lt, 1.7, 2.7))
    if pa > 0:
        ph_, bez, pad = phone_for("moments-0")
        put(c, ph_, W / 2, 830 + (1 - pa) * 700, 0.72 * (0.9 + 0.1 * pa), 0, pa * g)

def scene4(c, t, lt):
    # logo reveal, then the phone slides up with the real Home -> Moments screens
    if lt < 2.5: ph_, bez, pad = blend_phone("home-0", "moments-0", in_out(prog(lt, 2.3, 3.0)))
    else: ph_, bez, pad = blend_phone("moments-0", "moments-700", in_out(prog(lt, 3.4, 4.3)))
    la = fade_in(lt, 0.0, 0.4) * fade_out(lt, 1.35, 0.4)
    put(c, brand, W / 2, 780, 0.9 + 0.1 * out_cubic(prog(lt, 0, 0.9)), 0, la)
    put(c, WORD, W / 2, 1060, 1, 0, la)
    pa = out_cubic(prog(lt, 1.2, 2.2))
    cy = 830 + (1 - pa) * 260 + float_(lt, 0, 6, 0.3) * pa
    put(c, ph_, W / 2, cy, 0.72 * lerp(0.9, 1, pa), lerp(-4, 0, pa), pa)
    put(c, HL["j1"], W / 2, 270, 1, 0, fade_in(lt, 1.9, 0.45) * fade_out(lt, 3.5, 0.45))
    put(c, HL["j2"], W / 2, 270, 1, 0, fade_in(lt, 3.5, 0.45))

def scene5(c, t, lt):
    # phone slides away, four memory cards float toward the book and settle into its photo pages
    L = T["s5"][1] - T["s5"][0]; hg = fade_out(lt, L + OV, 0.5)
    pa = in_out(prog(lt, 0.0, 1.4))
    if pa < 0.99:
        ph_, bez, pad = phone_for("moments-700")
        put(c, ph_, W / 2 - pa * 520, 830, 0.72 * lerp(1, 0.8, pa), -8 * pa, 1 - pa)
    if lt < L:
        sa = out_cubic(prog(lt, 0.8, 2.0))
        put(c, SPREAD, W / 2, 860, 1.1 * lerp(0.9, 1.0, out_cubic(prog(lt, 0.8, 3.2))), lerp(-3, 0, out_cubic(prog(lt, 0.8, 2.4))), sa)
        for i, k in enumerate(["first_smile", "birthday", "first_steps", "words"]):
            x = in_out(prog(lt, 0.3 + i * 0.2, 1.7 + i * 0.2))
            al = fade_in(lt, 0.25 + i * 0.2, 0.3) * (1 - prog(x, 0.7, 1.0))
            put(c, CARD[k], lerp(300 + i * 160, 540 + (i - 1.5) * 40, x), lerp(700, 860, x) - 150 * math.sin(math.pi * x),
                lerp(0.55, 0.3, x), lerp(-14 + i * 9, 0, x), al)
    put(c, HL["from"], W / 2, 250, 1, 0, fade_in(lt, 0.2, 0.5) * hg)
    put(c, HL["to"], W / 2, 380, 1, 0, fade_in(lt, 1.3, 0.5) * hg)

def scene6(c, t, lt):
    # the book glides left, the app slides in beside it, then the end card
    x = in_out(prog(lt, 0.0, 1.4))
    side = 1 - in_out(prog(lt, 1.4, 2.1))
    put(c, SPREAD, lerp(540, 290, x), 860, lerp(1.1, 0.46, x), lerp(0, -5, x), side)
    ph_, bez, pad = phone_for("home-0")
    px = in_out(prog(lt, 0.2, 1.5))
    put(c, ph_, lerp(1000, 770, px), 840, 0.62, 6, side * fade_in(lt, 0.2, 0.5))
    ea = in_out(prog(lt, 1.6, 2.3))
    put(c, brand, W / 2, S["ENDY"][0], 0.95 + 0.05 * ea, 0, ea)
    put(c, WORD, W / 2, S["ENDY"][1], 1, 0, ea)
    put(c, HL["end1"], W / 2, S["ENDY"][2], 1, 0, fade_in(lt, 2.1, 0.5))
    pp = out_back(prog(lt, 2.6, 3.3), 0.9)
    put(c, PILL, W / 2, 1205, 1, 0, pp)

def frame(i):
    t = i / FPS
    c = BG.copy()
    for name, (a, b) in T.items():
        ov = OV if name in ("s1", "s2", "s3", "s5") else 0
        if a <= t < b + ov or (name == "s6" and t >= a):
            lt = t - a
            if name == "s1": scene1(c, t)
            elif name == "s2": scene2(c, t, lt)
            elif name == "s3": scene3(c, t, lt)
            elif name == "s4": scene4(c, t, lt)
            elif name == "s5": scene5(c, t, lt)
            else: scene6(c, t, lt)
    for (a, b, _), im in zip(CAPS, CAPIMG):
        if a <= t < b:
            put(c, im, W / 2, 1385, 1, 0, fade_in(t, a, 0.2) * fade_out(t, b, 0.2))
    return c.convert("RGB")

def main(out_path, frames=None):
    n = frames or round(DUR * FPS)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", out_path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(n):
        p.stdin.write(frame(i).tobytes())
        if i % 60 == 0: print("frame", i, "/", n, flush=True)
    p.stdin.close(); p.wait()

if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "still":
        for ts in sys.argv[2:]:
            frame(round(float(ts) * FPS)).save(os.path.join(HERE, "out", f"still_{ts}.png"))
    else:
        os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
        main(os.path.join(HERE, "out", S["out"]))
