#!/usr/bin/env bash
# Subsets the app's Newsreader TTFs to the Latin + Yoruba range and writes WOFF2.
# Run from the repo root: scripts/subset-fonts.sh
set -euo pipefail

SRC="../moyi-app/shared/designsystem/src/commonMain/composeResources/font"
OUT="public/fonts"
VENV="${TMPDIR:-/tmp}/moyi-web-fonts-venv"
UNICODES="U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+0300-0304,U+0323,U+1E00-1EFF,U+2018-201F,U+2026,U+2032-2033,U+20AC"

python3 -m venv "$VENV"
"$VENV/bin/pip" install --quiet fonttools==4.62.1 brotli==1.2.1

mkdir -p "$OUT"
for pair in regular:400 medium:500; do
  name="${pair%%:*}"
  weight="${pair##*:}"
  "$VENV/bin/pyftsubset" "$SRC/newsreader_${name}.ttf" \
    --flavor=woff2 \
    --layout-features='kern,liga' \
    --unicodes="$UNICODES" \
    --output-file="$OUT/newsreader-${weight}.woff2"
done

"$VENV/bin/python" scripts/check-font-glyphs.py "$OUT"/newsreader-*.woff2
