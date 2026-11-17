# Cuts static weights out of the variable Devanagari fonts (HarfBuzz + FreeType render static fonts reliably).
import os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = os.path.dirname(os.path.abspath(__file__))
F = lambda n: os.path.join(HERE, "assets", "fonts", n)

def cut(src, dst, wght):
    f = TTFont(F(src))
    axes = {a.axisTag: a for a in f["fvar"].axes}
    loc = {"wght": wght}
    if "wdth" in axes: loc["wdth"] = 100
    instancer.instantiateVariableFont(f, loc, inplace=True)
    f.save(F(dst))
    print("wrote", dst)

cut("NotoSerifDevanagari.ttf", "NotoSerifDevanagari-ExtraBold.ttf", 800)
cut("NotoSansDevanagari.ttf", "NotoSansDevanagari-Bold.ttf", 700)
cut("NotoSansDevanagari.ttf", "NotoSansDevanagari-ExtraBold.ttf", 800)
cut("NotoSansDevanagari.ttf", "NotoSansDevanagari-SemiBold.ttf", 600)
