#!/bin/bash

# Nombre del archivo de registro de errores
error_log="error.log"

# Limpiar errores viejos para no confundir este despliegue con uno anterior
: > "$error_log"

# Función para mostrar los errores
show_errors() {
  if [ -s "$error_log" ]; then
    echo "Se produjeron errores. Consulta el archivo $error_log para más detalles."
  else
    echo "El script se ejecutó sin errores."
  fi
}

echo "Ejecutando 'build'..."
npm run build
echo

# Verificar que la carpeta 'dist' existe
if [ ! -d "dist" ]; then
  echo "La carpeta 'dist' no existe. Asegúrate de que el build se haya generado correctamente."
  exit 1
fi



# Copiar la carpeta al servidor remoto
echo "Limpiando carpeta 'dist' remota previa..."
ssh metromedics@209.97.156.169 'rm -rf /home/metromedics/mmcs/frontend/dist' 2>>"$error_log"
if [ $? -ne 0 ]; then
  echo "Error al limpiar la carpeta 'dist' remota."
  show_errors
  exit 1
fi

echo "Copiando la carpeta 'dist' al servidor remoto..."
scp -r "dist" metromedics@209.97.156.169:/home/metromedics/mmcs/frontend 2>>"$error_log"
if [ $? -ne 0 ]; then
  echo "Error al copiar la carpeta 'dist' al servidor remoto."
  show_errors
  exit 1
fi

# Conectarse al servidor remoto y mover archivos al directorio de producción.
echo "Conectándose al servidor remoto y moviendo archivos..."
ssh metromedics@209.97.156.169 << 'EOF'
  set -euxo pipefail
  cd /home/metromedics/mmcs/frontend
  
  # Obtener la fecha y hora actual
  timestamp=$(date +"%Y%m%d-%H%M%S")
  mv dist "build$timestamp"
  
  # Verificar el resultado del mv
  if [ $? -ne 0 ]; then
    echo "Error al mover la carpeta 'dist' al directorio de producción." >&2
    exit 1
  fi

  # Hacer backup del sitio actualmente publicado antes de reemplazarlo
  if [ -d /var/www/app.metromedics.co/html ] && [ "$(ls -A /var/www/app.metromedics.co/html 2>/dev/null)" ]; then
    mkdir -p /var/www/app.metromedics.co/backups
    mkdir -p "/var/www/app.metromedics.co/backups/$timestamp"
    cp -a /var/www/app.metromedics.co/html/. "/var/www/app.metromedics.co/backups/$timestamp/"

    if [ $? -ne 0 ]; then
      echo "Error al crear el backup del sitio actual." >&2
      exit 1
    fi
  fi

  # Limpiar el contenido actual para no mezclar assets de builds anteriores
  mkdir -p /var/www/app.metromedics.co/html
  find /var/www/app.metromedics.co/html -mindepth 1 -maxdepth 1 -exec rm -rf {} +

  if [ $? -ne 0 ]; then
    echo "Error al limpiar el directorio de producción." >&2
    exit 1
  fi

  cp -a "build$timestamp"/. /var/www/app.metromedics.co/html/
  
  # Verificar el resultado del cp
  if [ $? -ne 0 ]; then
    echo "Error al copiar los archivos al directorio de producción." >&2
    exit 1
  fi

  echo "Build publicado:"
  ls -1 /var/www/app.metromedics.co/html/assets/index-*.js 2>/dev/null | tail -n 1

  # Conservar solo las dos carpetas más recientes en el directorio /home/metromedics/mmcs/frontend
  cd /home/metromedics/mmcs/frontend
  # Listar los directorios ordenados por fecha de modificación (más reciente primero) y eliminar los que no sean los dos más recientes
  dirs_to_delete=$(ls -dt */ | awk 'NR>5')
  
  # Eliminar los directorios que no se deben conservar
  if [ -n "$dirs_to_delete" ]; then
    echo "Eliminando directorios antiguos..."
    rm -rf $dirs_to_delete
  fi

EOF

if [ $? -ne 0 ]; then
  echo "Error durante la publicación remota."
  show_errors
  exit 1
fi

# Mostrar errores
show_errors
