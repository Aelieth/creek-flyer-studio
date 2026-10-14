#!/usr/bin/env bash
# Binary assets (fonts, demo photos) are stored in git as base64 text (*.b64) so the repo
# can be synced with text-only tooling. Run this after adding a new .ttf or demo .jpg.
set -e; cd "$(dirname "$0")/../public"
for f in fonts/*.ttf demo/*.jpg; do [ -f "$f" ] && base64 -w0 "$f" > "$f.b64"; done
echo "encoded: $(ls fonts/*.b64 demo/*.b64 | wc -l) files"
