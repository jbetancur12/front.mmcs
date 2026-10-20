import { bigToast } from '../../ExcelManipulation/Utils'

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
        bigToast('Hoja de Datos Modificada Exitosamente!', 'success')
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
        bigToast('Hoja de Datos Eliminada Exitosamente!', 'success')
      } else {
        console.error('Error al eliminar la hoja de datos')
        bigToast('Error al eliminar la hoja de datos', 'error')
      }
    } catch (error) {
      console.error('Error de red:', error)
      bigToast('Error al eliminar la hoja de datos', 'error')
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
        bigToast('Foto subida correctamente', 'success')
      } else {
        bigToast('Error al subir la foto', 'error')
      }
    } catch (error) {
      console.error('Error al subir la foto:', error)
      bigToast('Error al subir la foto', 'error')
    }
  }

  const handleUploadPdf = async (id: number, pdfFile: File): Promise<void> => {
    try {
      const response = await uploadInvoice.mutateAsync({ id, pdfFile })

      if (response.status === 200) {
        bigToast('PDF subido exitosamente', 'success')
      }
    } catch (error) {
      bigToast('Error subiendo PDF', 'error')
    }
  }

  const handleDownloadPdf = async (id: number): Promise<void> => {
    try {
      const response = await downloadInvoice(id)
      downloadBlob(response.data, `factura-${id}.pdf`)
    } catch (error) {
      bigToast('Error descargando la factura', 'error')
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
