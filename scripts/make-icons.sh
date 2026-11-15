#!/usr/bin/env bash
# Writes public/favicon.svg and renders the PNG icons from it (needs rsvg-convert: brew install librsvg).
# The mark is the one in src/components/Brand.astro (viewBox 40x52), centred in a 64x64 rounded square.
set -euo pipefail
cd "$(dirname "$0")/.."

cat > public/favicon.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="#171313"/>
  <g transform="translate(14 8.6) scale(0.9)" color="#F8EFE9">
    <circle cx="20" cy="22" r="14.5" fill="none" stroke="#F8EFE9" stroke-width="4.5"/>
    <circle cx="20" cy="46" r="4" fill="#F8EFE9"/>
  </g>
</svg>
SVG

rsvg-convert -w 32 -h 32 public/favicon.svg -o public/favicon-32.png
rsvg-convert -w 16 -h 16 public/favicon.svg -o public/favicon-16.png
rsvg-convert -w 180 -h 180 public/favicon.svg -o public/apple-touch-icon.png
