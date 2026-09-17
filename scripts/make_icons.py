#!/usr/bin/env python3
"""Write minimal PNG placeholders (no Pillow required)."""
import struct, zlib, pathlib

def png(w, h, rgb):
    r, g, b = rgb
    raw = b"".join(b"\x00" + bytes([r, g, b]) * w for _ in range(h))
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")

def write(path, w, h, rgb):
    pathlib.Path(path).parent.mkdir(parents=True, exist_ok=True)
    pathlib.Path(path).write_bytes(png(w, h, rgb))
    print("wrote", path, w, "x", h)

# Brand charcoal + amber-ish pixel field (solid placeholders)
AMBER = (245, 166, 35)
DARK = (7, 9, 13)

write("resources/icon-1024.png", 1024, 1024, AMBER)
write("resources/splash-2732.png", 2732, 2732, DARK)
write("public/icons/icon-180.png", 180, 180, AMBER)
write("public/icons/icon-192.png", 192, 192, AMBER)
write("public/icons/icon-512.png", 512, 512, AMBER)
write("public/splash.png", 2048, 2048, DARK)
