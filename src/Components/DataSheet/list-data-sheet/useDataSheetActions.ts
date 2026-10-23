import { notify } from 'src/utils/notify'

import { useDataSheetMutations, useDownloadInvoice } from './useDataSheets'
import { downloadBlob } from './utils'

/**
 * Acciones de la lista de hojas de vida con los mismos toasts/logs que antes
 * del paso a react-query.
 */
export const useDataSheetActions = () => {
  const {
    updateDataSheet,
    deleteDataSheet,
    uploadImage,
    uploadInvoice
  } = useDataSheetMutations()
  const downloadInvoice = useDownloadInvoice()

  const saveDataSheet = async (
    id: number,
    values: Record<string, unknown>
  ): Promise<void> => {
    try {
      const response = await updateDataSheet.mutateAsync({ id, values })

      if (response.status === 200) {
        notify.success('Hoja de Datos Modificada Exitosamente!')
      } else {
        console.error('Error al modificar la hoja de datos')
      }
    } catch (error) {
      console.error('Error de red:', error)
    }
  }

  const removeDataSheet = async (id: number): Promise<void> => {
    try {
      const response = await deleteDataSheet.mutateAsync(id)

      if (response.status === 204) {
        notify.success('Hoja de Datos Eliminada Exitosamente!')
      } else {
        console.error('Error al eliminar la hoja de datos')
        notify.error('Error al eliminar la hoja de datos')
      }
    } catch (error) {
      console.error('Error de red:', error)
      notify.error('Error al eliminar la hoja de datos')
    }
  }

  const handleUpload = async ({
    id,
    image
  }: {
    id: number | undefined
    image: File | null
  }): Promise<void> => {
    if (!image) {
      return
    }
    try {
      const response = await uploadImage.mutateAsync({ id, image })

      if (response.status >= 200 && response.status < 300) {
        notify.success('Foto subida correctamente')
      } else {
        notify.error('Error al subir la foto')
      }
    } catch (error) {
      console.error('Error al subir la foto:', error)
      notify.error('Error al subir la foto')
    }
  }

  const handleUploadPdf = async (id: number, pdfFile: File): Promise<void> => {
    try {
      const response = await uploadInvoice.mutateAsync({ id, pdfFile })

      if (response.status === 200) {
        notify.success('PDF subido exitosamente')
      }
    } catch (error) {
      notify.error('Error subiendo PDF')
    }
  }

  const handleDownloadPdf = async (id: number): Promise<void> => {
    try {
      const response = await downloadInvoice(id)
      downloadBlob(response.data, `factura-${id}.pdf`)
    } catch (error) {
      notify.error('Error descargando la factura')
    }
  }

  return {
    saveDataSheet,
    removeDataSheet,
    handleUpload,
    handleUploadPdf,
    handleDownloadPdf
  }
}

export type DataSheetActions = ReturnType<typeof useDataSheetActions>
