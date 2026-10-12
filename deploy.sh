#!/bin/bash
# Despliegue del front: build local -> subida comprimida -> publicación con swap atómico.
# Rollback: ssh al servidor y ver "ROLLBACK" al final de este archivo.
set -euo pipefail

SERVER="metromedics@209.97.156.169"
REMOTE_BASE="/home/metromedics/mmcs/frontend"
WEB_ROOT="/var/www/app.metromedics.co/html"
KEEP_BUILDS=5
KEEP_ASSET_DAYS=14

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Evita desplegar un dist viejo si el build falla
rm -rf dist
echo "Ejecutando 'build'..."
npm run build
echo

if [ ! -f "dist/index.html" ]; then
  echo "dist/index.html no existe. El build no se generó correctamente."
  exit 1
fi

echo "Subiendo 'dist' comprimido al servidor (build$TIMESTAMP)..."
tar czf - dist | ssh "$SERVER" "set -e; mkdir -p $REMOTE_BASE/build$TIMESTAMP && tar xzf - -C $REMOTE_BASE/build$TIMESTAMP --strip-components=1"

echo "Publicando en el servidor..."
ssh "$SERVER" bash -s -- "$TIMESTAMP" "$REMOTE_BASE" "$WEB_ROOT" "$KEEP_BUILDS" "$KEEP_ASSET_DAYS" << 'EOF'
set -euo pipefail
TS="$1"; BASE="$2"; ROOT="$3"; KEEP_BUILDS="$4"; KEEP_DAYS="$5"
NEW="$ROOT.new"
PREV="$ROOT.prev"

# 1. Preparar el sitio nuevo al lado (mismo filesystem)
rm -rf "$NEW"
cp -a "$BASE/build$TS" "$NEW"

# 2. Conservar assets de builds anteriores (hash distinto) para que las pestañas
#    abiertas no den 404 en chunks lazy. -n no pisa los nuevos; -p conserva fecha.
if [ -d "$ROOT/assets" ]; then
  mkdir -p "$NEW/assets"
  cp -n -p "$ROOT"/assets/* "$NEW/assets/" 2>/dev/null || true
  find "$NEW/assets" -type f -mtime +"$KEEP_DAYS" -delete
fi

# 3. Swap (dos renames consecutivos, sin ventana de sitio vacío)
rm -rf "$PREV"
if [ -d "$ROOT" ]; then mv "$ROOT" "$PREV"; fi
mv "$NEW" "$ROOT"

echo "Build publicado:"
ls -1 "$ROOT"/assets/index-*.js 2>/dev/null | tail -n 1

# 4. Podar builds antiguos (solo carpetas build*)
cd "$BASE"
ls -dt build*/ 2>/dev/null | tail -n +"$((KEEP_BUILDS + 1))" | xargs -r rm -rf
EOF

echo "Despliegue OK: build$TIMESTAMP"

# ROLLBACK (inmediato, al sitio anterior):
#   ssh metromedics@209.97.156.169 'cd /var/www/app.metromedics.co && mv html html.bad && mv html.prev html && rm -rf html.bad'
# O re-publicar un build guardado:
#   ssh ... 'rsync -a --delete /home/metromedics/mmcs/frontend/build<TS>/ /var/www/app.metromedics.co/html/'
