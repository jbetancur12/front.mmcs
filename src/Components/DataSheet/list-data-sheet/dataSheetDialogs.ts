import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

/** Confirmación de borrado de una hoja de vida. */
export const confirmDeleteDataSheet = (equipmentName: unknown) =>
  MySwal.fire({
    title: `¿Está seguro que desea eliminar la hoja de datos ${equipmentName}?`,
    text: 'No podrá recuperar esta información una vez eliminada',
    showCancelButton: true,
    confirmButtonText: 'Sí'
  })

/** Diálogo para elegir qué editar (imagen, otras opciones o factura). */
export const chooseEditOption = () =>
  MySwal.fire({
    title: 'Seleccione una opción',
    showCancelButton: true,
    confirmButtonText: 'Editar Imagen',
    cancelButtonText: 'Editar Otras Opciones',
    showDenyButton: true, // Nuevo botón
    denyButtonText: 'Subir Factura PDF',
    denyButtonColor: '#3085d6'
  })

export const isCancelDismiss = (dismiss: unknown) =>
  dismiss === Swal.DismissReason.cancel

/** Diálogo para seleccionar y subir una nueva imagen del equipo. */
export const openEditImageDialog = (
  onUpload: (image: File) => Promise<void>
) => {
  let imageFile: File | null = null
  // Lógica para abrir el modal de edición de imagen
  return MySwal.fire({
    title: 'Editar Imagen',
    html: `
                      <div id="mui-file-input">
                        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                          <label for="imageInput" style="cursor: pointer;">
                            <img
                              id="avatarImage"
                              alt="Foto de equipo"
                              src="/images/no-img.jpg"
                              style="width: 100px; height: 100px; margin-bottom: 8px;"
                            />
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            id="imageInput"
                            style="display: none;"
                          />
                        </div>
                      </div>
                    `,
    didOpen: () => {
      const imageInput = document.getElementById(
        'imageInput'
      ) as HTMLInputElement
      const avatarImage = document.getElementById(
        'avatarImage'
      ) as HTMLImageElement

      if (imageInput && avatarImage) {
        imageInput.addEventListener('change', function (e) {
          const target = e.target as HTMLInputElement

          if (target.files && target.files.length > 0) {
            imageFile = target.files[0]

            // Crear un URL para la imagen seleccionada
            const newImageUrl = URL.createObjectURL(imageFile)

            // Actualizar el src del avatar
            avatarImage.src = newImageUrl
          }
        })
      } else {
        console.error(
          "No se pudo encontrar el elemento 'imageInput' o 'avatarImage'."
        )
      }
    },
    showCancelButton: true,
    confirmButtonText: 'Actualizar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      if (!imageFile) {
        MySwal.showValidationMessage(
          'Por favor selecciona una imagen antes de actualizar.'
        )
        return false // Previene la resolución de la promesa
      }
      return new Promise((resolve) => {
        if (imageFile) {
          // Subir la imagen seleccionada a la API
          onUpload(imageFile).then(() => resolve(undefined))
        } else {
          resolve(undefined)
        }
      })
    }
  })
}

/** Diálogo para seleccionar y subir la factura en PDF. */
export const openUploadInvoiceDialog = (
  onUpload: (pdfFile: File) => Promise<void>
) => {
  let pdfFile: File | null = null

  return MySwal.fire({
    title: 'Subir Factura PDF',
    html: `
            <input type="file" 
                   id="pdfInput" 
                   accept="application/pdf" 
                   style="display: none;"
            >
            <label for="pdfInput" 
                   style="cursor: pointer;
                          padding: 10px;
                          border: 2px dashed #ccc;
                          display: block;
                          text-align: center;">
              📁 Seleccionar archivo PDF
            </label>
            <div id="fileName" 
             style="color: #666; 
                    font-size: 0.9em;
                    text-align: center;
                    word-break: break-all;">
          Ningún archivo seleccionado
        </div>
          `,
    didOpen: () => {
      const pdfInput = document.getElementById('pdfInput') as HTMLInputElement
      const fileNameDiv = document.getElementById('fileName')
      pdfInput.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        if (target.files?.length) {
          pdfFile = target.files[0]
          if (fileNameDiv) {
            fileNameDiv.textContent = pdfFile.name
            fileNameDiv.style.color = '#2e7d32' // Color verde para indicar selección
            fileNameDiv.style.fontWeight = '500'
          }
        } else {
          if (fileNameDiv) {
            fileNameDiv.textContent = 'Ningún archivo seleccionado'
            fileNameDiv.style.color = '#666'
            fileNameDiv.style.fontWeight = 'normal'
          }
        }
      })
    },
    preConfirm: () => {
      if (!pdfFile) {
        MySwal.showValidationMessage('Debe seleccionar un archivo PDF')
        return false
      }
      if (pdfFile?.type !== 'application/pdf') {
        MySwal.showValidationMessage('Solo se permiten archivos PDF')
        return false
      }
      // Lógica para subir el PDF
      return onUpload(pdfFile)
    }
  })
}
