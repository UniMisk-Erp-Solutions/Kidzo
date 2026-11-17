"""Complex-script text (Devanagari) for Pillow, which has no shaping engine here.

HarfBuzz (uharfbuzz) does the shaping, FreeType (freetype-py) draws each glyph by id, and the result is a
normal RGBA image that render.py composites like any other text.
"""
import numpy as np
import uharfbuzz as hb
import freetype
from PIL import Image


class HFont:
    def __init__(self, path, size):
        self.path, self.size = path, size


_HB = {}
_FT = {}


def _hb_font(path):
    if path not in _HB:
        face = hb.Face(hb.Blob.from_file_path(path))
        _HB[path] = (hb.Font(face), face.upem)
    return _HB[path]


def _ft_face(path):
    if path not in _FT:
        _FT[path] = freetype.Face(path)
    return _FT[path]


def hb_text_img(txt, font, fill, pad=12):
    path, size = font.path, font.size
    hfont, upem = _hb_font(path)
    hfont.scale = (upem, upem)
    buf = hb.Buffer()
    buf.add_str(txt)
    buf.guess_segment_properties()
    hb.shape(hfont, buf, {"kern": True, "liga": True})
    k = size / upem
    glyphs, x = [], 0.0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        glyphs.append((info.codepoint, x + pos.x_offset * k, pos.y_offset * k))
        x += pos.x_advance * k
    face = _ft_face(path)
    face.set_char_size(int(size * 64), 0, 72, 72)
    asc = int(size * 1.15) + 4
    desc = int(size * 0.45) + 4
    width = int(x) + 2 * pad + 8
    height = asc + desc + 2 * pad
    mask = np.zeros((height, width), dtype=np.uint8)
    base_y = pad + asc
    for gid, gx, gy in glyphs:
        face.load_glyph(gid, freetype.FT_LOAD_RENDER)
        bm = face.glyph.bitmap
        if bm.width == 0 or bm.rows == 0:
            continue
        arr = np.array(bm.buffer, dtype=np.uint8).reshape(bm.rows, bm.pitch)[:, : bm.width]
        ox = int(round(pad + gx + face.glyph.bitmap_left))
        oy = int(round(base_y - gy - face.glyph.bitmap_top))
        y0, x0 = max(0, oy), max(0, ox)
        y1, x1 = min(height, oy + bm.rows), min(width, ox + bm.width)
        if y1 <= y0 or x1 <= x0:
            continue
        sub = arr[y0 - oy : y1 - oy, x0 - ox : x1 - ox]
        mask[y0:y1, x0:x1] = np.maximum(mask[y0:y1, x0:x1], sub)
    # trim empty rows/columns so centring matches the visible ink
    ys, xs = np.where(mask > 8)
    if len(xs) == 0:
        return Image.new("RGBA", (2, 2), (0, 0, 0, 0))
    mask = mask[max(0, ys.min() - pad): ys.max() + pad + 1, max(0, xs.min() - pad): xs.max() + pad + 1]
    rgba = np.zeros(mask.shape + (4,), dtype=np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = fill[0], fill[1], fill[2]
    rgba[..., 3] = (mask.astype(np.uint16) * (fill[3] if len(fill) > 3 else 255) // 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")
