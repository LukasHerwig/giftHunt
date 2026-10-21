# Brand files

- `icon.svg`: the rounded app icon (also `public/icon.svg`, the browser tab icon on modern browsers).
- `icon-square.svg`: the same icon full-bleed and square, with the bow inside the 80 % safe zone, so iOS and Android can apply their own mask. Every PNG and the ICO in `public/` is generated from it.
- The header mark is `src/components/brand/RosettMark.tsx` and the mascot `src/components/brand/Rosetten.tsx`. Keep the three in sync when the icon changes.

Regenerate the files in `public/` (macOS):

```bash
T=$(mktemp -d)
qlmanage -t -s 1024 -o "$T" docs/brand/icon-square.svg
SRC="$T/icon-square.svg.png"
sips -z 512 512 "$SRC" --out public/icon-512.png
sips -z 192 192 "$SRC" --out public/icon-192.png
sips -z 180 180 "$SRC" --out public/apple-touch-icon.png
sips -z 32 32 "$SRC" --out public/favicon-32x32.png
sips -z 16 16 "$SRC" --out public/favicon-16x16.png
sips -z 48 48 "$SRC" --out "$T/48.png"
```
Then pack `favicon-16x16.png`, `favicon-32x32.png` and `48.png` into `public/icon.ico` (an ICO is a small header plus the PNGs) and copy `icon.svg` to `public/icon.svg`.
