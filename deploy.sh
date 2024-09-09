#!/bin/bash

# Nombre del archivo de registro de errores
error_log="C:\Users\Jorge Betancur\Desktop\IOT\error.log"

# Función para mostrar los errores
show_errors() {
  if [ -s "$error_log" ]; then
    echo "Se produjeron errores. Consulta el archivo $error_log para más detalles."
  else
    echo "El script se ejecutó sin errores."
  fi
}

# Función para imprimir un mensaje en color verde
print_green() {
  git_echo=$(which echo)
  $git_echo -e "\e[32m$1\e[0m"
}
# Mostrar un mensaje antes de conectarse al equipo remoto
echo "Conectándose al equipo remoto..."
echo



# Ejecutar 'yarn build' para generar el archivo 'build'
echo "Ejecutando 'npm run build'..."
npm run build

# Obtener la fecha y hora actual en el formato deseado
timestamp=$(date +"%m%d%Y-%H%M%S")

# Mostrar un mensaje antes de renombrar la carpeta 'build'
echo "Renombrando la carpeta 'build'  a 'build$timestamp'..."
echo

# Renombrar la carpeta 'build' con el formato 'buildMMDDYYYY-hhmmss'
mv dist "build$timestamp"
echo

# Mostrar un mensaje antes de copiar la carpeta renombrada 
echo "Copiando la carpeta renombrada..."
echo

# Copiar la carpeta renombrada al equipo remoto
scp -r "build$timestamp" metromedics@209.97.156.169:/home/metromedics/mmcs/frontend
echo

# Mostrar un mensaje antes de conectarse al equipo remoto nuevamente
echo "Conectándose al equipo remoto..."
echo



# Conectarse al equipo remoto
ssh -T metromedics@209.97.156.169 "bash -s" "$timestamp" << 'EOF'

  # Navegar al directorio 'cloud-smaf/frontend'
  echo "Navegando al directorio 'cloud-smaf/frontend'..."
  cd mmcs/frontend/
  echo

  # Copiar el contenido de la carpeta renombrada (build$1) al directorio de producción en el servidor web
  echo "Copiando el contenido de la carpeta renombrada (build$1) al directorio de producción... $1"
  sudo cp -r build$1/* /var/www/app.metromedics.co/html/
  echo

  directorios=$(find . -maxdepth 1 -type d ! -path .)

# Ordenar los directorios por fecha de modificación (más reciente primero)
directorios_ordenados=$(printf '%s\n' "$directorios" | sort -r)

# Contador para llevar la cuenta de los directorios eliminados
contador=0

# Iterar sobre los directorios ordenados
for d in $directorios_ordenados; do
  # Verificar si el contador es mayor a 2
  if [ $contador -gt 1 ]; then
    # Eliminar el directorio y su contenido
    rm -rf "$d"
    echo "Directorio eliminado: $d"
  fi

  # Incrementar el contador
  contador=$((contador + 1))
done

  # Salir del equipo remoto
  exit

EOF

# Mostrar los errores capturados
show_errors
echo

# Obtener la ruta completa de la carpeta actual
current_folder=$(pwd)

# Iterar sobre los directorios dentro de la carpeta actual y eliminarlos
for dir in "$current_folder"/*/; do
    if [[ -d "$dir" ]]; then
        echo "Eliminando directorio: $dir"
        rm -rf "$dir"
    fi
done

# Mostrar un mensaje al final del script
# Mostrar un mensaje al final del script
echo "¡El script ha finalizado!"

# Mantener el terminal abierto
read -p "Presiona Enter para salir..."
