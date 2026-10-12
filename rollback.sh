#!/bin/bash
# Vuelve el front de producción a un build anterior, desde tu máquina. No recompila: es un cambio de carpeta.
#
#   ./rollback.sh                 vuelve al despliegue anterior (html.prev)
#   ./rollback.sh --list          lista los builds guardados y cuál está publicado
#   ./rollback.sh <build>         publica un build guardado (ej. build20261012-153000 o 20261012-153000)
#
# Es reversible: el sitio que se retira queda como html.prev, así que volver a correr ./rollback.sh
# lo restaura (útil si el rollback no era lo que se necesitaba).
# No toca la versión ni las sesiones.

set -euo pipefail

# Guarda la salida en rollback-output.log y deja la ventana abierta al terminar (útil con doble clic).
# Para no pausar: NO_PAUSE=1 ./rollback.sh
cd "$(dirname "$0")"
exec > >(tee "rollback-output.log") 2>&1
pause_before_exit() {
  status=$?
  echo
  if [ $status -eq 0 ]; then echo "Terminó bien."; else echo "TERMINÓ CON ERROR (código $status). Salida guardada en rollback-output.log."; fi
  if [ -z "${NO_PAUSE:-}" ] && [ -r /dev/tty ]; then
    read -r -p "Presiona Enter para cerrar..." < /dev/tty || true
  fi
}
trap pause_before_exit EXIT

SERVER="${DEPLOY_HOST:-metromedics@209.97.156.169}"
TARGET="${1:-}"

echo "Conectando a $SERVER (rollback del front)..."
REMOTE_SCRIPT=$(cat <<'REMOTE'
set -euo pipefail
TARGET="${1:-}"
BASE="/home/metromedics/mmcs/frontend"
ROOT="/var/www/app.metromedics.co/html"
PREV="$ROOT.prev"

current_build() {
  # Qué build coincide con lo publicado (por el index-*.js que carga index.html)
  local entry
  entry="$(grep -o 'assets/index-[A-Za-z0-9_-]*\.js' "$ROOT/index.html" 2>/dev/null | head -1 || true)"
  [ -n "$entry" ] || { echo "(desconocido)"; return; }
  for d in $(ls -dt "$BASE"/build*/ 2>/dev/null); do
    if [ -f "$d$entry" ]; then basename "$d"; return; fi
  done
  echo "(no coincide con un build guardado)"
}

if [ "$TARGET" = "--list" ]; then
  echo "Publicado ahora: $(current_build)"
  [ -d "$PREV" ] && echo "html.prev existe (./rollback.sh sin argumentos vuelve a él)" || echo "html.prev no existe"
  echo "--- Builds guardados (más reciente primero):"
  for d in $(ls -dt "$BASE"/build*/ 2>/dev/null); do echo "  $(basename "$d")  ($(date -r "$d" '+%Y-%m-%d %H:%M'))"; done
  exit 0
fi

echo "Publicado ahora: $(current_build)"

if [ -z "$TARGET" ]; then
  [ -d "$PREV" ] || { echo "ERROR: no hay html.prev. Usa ./rollback.sh --list y elige un build."; exit 1; }
  # Intercambio: el sitio actual queda como html.prev (reversible)
  mv "$ROOT" "$ROOT.swap"
  mv "$PREV" "$ROOT"
  mv "$ROOT.swap" "$PREV"
  echo "Publicado el despliegue anterior."
else
  case "$TARGET" in build*) NAME="$TARGET" ;; *) NAME="build$TARGET" ;; esac
  SRC="$BASE/$NAME"
  [ -f "$SRC/index.html" ] || { echo "ERROR: $NAME no existe o no tiene index.html. Usa ./rollback.sh --list"; exit 1; }
  NEW="$ROOT.new"
  rm -rf "$NEW"
  cp -a "$SRC" "$NEW"
  # Conserva los assets del sitio actual para que las pestañas abiertas no den 404
  if [ -d "$ROOT/assets" ]; then
    mkdir -p "$NEW/assets"
    cp -n -p "$ROOT"/assets/* "$NEW/assets/" 2>/dev/null || true
  fi
  rm -rf "$PREV"
  mv "$ROOT" "$PREV"
  mv "$NEW" "$ROOT"
  echo "Publicado $NAME."
fi

echo "Ahora publicado: $(current_build)"
[ -f "$ROOT/index.html" ] || { echo "ERROR: el sitio publicado no tiene index.html"; exit 1; }

# Comprobación en el propio servidor (contra el nginx local, con el Host del sitio)
CODE="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 -H "Host: app.metromedics.co" https://localhost/ || true)"
if [ "$CODE" = "200" ]; then
  echo "El sitio responde (HTTP 200)."
else
  echo "ATENCIÓN: el sitio respondió HTTP ${CODE:-sin respuesta} en el servidor."; exit 1
fi
REMOTE
)

ssh -T "$SERVER" "bash -c $(printf '%q' "$REMOTE_SCRIPT") remote-script \"$TARGET\""

if [ "$TARGET" = "--list" ]; then exit 0; fi
echo "ROLLBACK OK. Recarga con Ctrl+F5 para ver la versión publicada."
