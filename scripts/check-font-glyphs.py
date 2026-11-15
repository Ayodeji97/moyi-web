"""Asserts each given font covers the code points Mọyì needs. Usage: check-font-glyphs.py <font>..."""
import sys

from fontTools.ttLib import TTFont

REQUIRED = {
    0x1ECD: "ọ",
    0x00EC: "ì",
    0x1EB9: "ẹ",
    0x1EB8: "Ẹ",
    0x0323: "combining dot below",
    0x2019: "right single quote",
}


def main(paths):
    if not paths:
        print("usage: check-font-glyphs.py <woff2>...", file=sys.stderr)
        return 2
    failed = False
    for path in paths:
        cmap = TTFont(path).getBestCmap()
        missing = [f"U+{cp:04X} ({label})" for cp, label in REQUIRED.items() if cp not in cmap]
        if missing:
            failed = True
            print(f"{path}: MISSING {', '.join(missing)}", file=sys.stderr)
        else:
            print(f"{path}: ok")
    return 1 if failed else 0


sys.exit(main(sys.argv[1:]))
