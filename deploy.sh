#!/bin/bash

# Nombre del archivo de registro de errores
error_log="error.log"

# Función para mostrar los errores
show_errors() {
  if [ -s "$error_log" ]; then
    echo "Se produjeron errores. Consulta el archivo $error_log para más detalles."
  else
    echo "El script se ejecutó sin errores."
  fi
}

# Verificar que la carpeta 'dist' existe
if [ ! -d "dist" ]; then
  echo "La carpeta 'dist' no existe. Asegúrate de que el build se haya generado correctamente."
  exit 1
fi

# Copiar la carpeta al servidor remoto
echo "Copiando la carpeta 'dist' al servidor remoto..."
scp -r "dist" metromedics@209.97.156.169:/home/metromedics/mmcs/frontend 2>>"$error_log"
if [ $? -ne 0 ]; then
  echo "Error al copiar la carpeta 'dist' al servidor remoto."
  show_errors
  exit 1
fi

# Conectarse al servidor remoto y mover archivos al directorio de producción
echo "Conectándose al servidor remoto y moviendo archivos..."
ssh metromedics@209.97.156.169 << 'EOF'
  set -x
  cd /home/metromedics/mmcs/frontend
  
  # Obtener la fecha y hora actual
  timestamp=$(date +"%Y%m%d-%H%M%S")
  mv dist "build$timestamp"
  
  # Verificar el resultado del mv
  if [ $? -ne 0 ]; then
    echo "Error al mover la carpeta 'dist' al directorio de producción." >&2
    exit 1
  fi

  cp -r "build$timestamp"/* /var/www/app.metromedics.co/html/
  
  # Verificar el resultado del cp
  if [ $? -ne 0 ]; then
    echo "Error al copiar los archivos al directorio de producción." >&2
    exit 1
  fi

  # Conservar solo las dos carpetas más recientes en el directorio /home/metromedics/mmcs/frontend
  cd /home/metromedics/mmcs/frontend
  # Listar los directorios ordenados por fecha de modificación (más reciente primero) y eliminar los que no sean los dos más recientes
  dirs_to_delete=$(ls -dt */ | awk 'NR>2')
  
  # Eliminar los directorios que no se deben conservar
  if [ -n "$dirs_to_delete" ]; then
    echo "Eliminando directorios antiguos..."
    rm -rf $dirs_to_delete
  fi

EOF

# Mostrar errores
show_errors
