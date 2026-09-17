# App icons & splash

Placeholders for Capacitor / App Store. Replace with final art before the first store screenshot.

- `icon-1024.png` — App Store marketing + iOS AppIcon source
- `splash-2732.png` — iPad Pro splash source
- Copied into `public/icons/` for the PWA manifest

Generate locally (ImageMagick) if you replace the SVGs:

```bash
convert resources/icon.svg -resize 1024x1024 resources/icon-1024.png
```
