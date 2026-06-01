#!/usr/bin/env bash
# ════════════════════════════════════════
#  build.sh — roda no deploy do Render
#  Instala dependências Node e baixa os binários
#  estáticos de ffmpeg e yt-dlp (sem precisar de apt/root).
# ════════════════════════════════════════
set -e

echo "==> Instalando dependências Node..."
npm install

echo "==> Preparando pasta de binários..."
mkdir -p bin

# ── yt-dlp (binário único, oficial) ──
echo "==> Baixando yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o bin/yt-dlp
chmod a+rx bin/yt-dlp

# ── ffmpeg (build estático do John Van Sickle) ──
echo "==> Baixando ffmpeg estático..."
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz
tar -xf ffmpeg.tar.xz
FFDIR=$(find . -maxdepth 1 -type d -name "ffmpeg-*-amd64-static" | head -n1)
cp "$FFDIR/ffmpeg"  bin/ffmpeg
cp "$FFDIR/ffprobe" bin/ffprobe
chmod a+rx bin/ffmpeg bin/ffprobe
rm -rf ffmpeg.tar.xz "$FFDIR"

echo "==> Pronto. Binários em ./bin:"
ls -la bin