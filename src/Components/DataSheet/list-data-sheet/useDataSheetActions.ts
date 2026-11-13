import { notify } from 'src/utils/notify'
import { getApiErrorMessage } from 'src/utils/apiError'

import {
  useDataSheetMutations,
  useDownloadInvoice,
  useDownloadManual
} from './useDataSheets'
import { downloadBlob } from './utils'

import { logger } from 'src/utils/logger'
/**
 * Acciones de la lista de hojas de vida con los mismos toasts/logs que antes
 * del paso a react-query.
 */
export const useDataSheetActions = () => {
  const {
    updateDataSheet,
    deleteDataSheet,
    retireDataSheet,
    restoreDataSheet,
    uploadImage,
    uploadInvoice,
    uploadManual
  } = useDataSheetMutations()
  const downloadInvoice = useDownloadInvoice()
  const downloadManual = useDownloadManual()

  const saveDataSheet = async (
    id: number,
    values: Record<string, unknown>
  ): Promise<void> => {
    try {
      const response = await updateDataSheet.mutateAsync({ id, values })

      if (response.status === 200) {
        notify.success('Hoja de Datos Modificada Exitosamente!')
      } else {
        logger.error('Error al modificar la hoja de datos')
      }
    } catch (error) {
      logger.error('Error de red:', error)
    }
  }

  const removeDataSheet = async (id: number): Promise<void> => {
    try {
      const response = await deleteDataSheet.mutateAsync(id)

      if (response.status === 204) {
        notify.success('Hoja de Datos Eliminada Exitosamente!')
      } else {
        logger.error('Error al eliminar la hoja de datos')
        notify.error('Error al eliminar la hoja de datos')
      }
    } catch (error) {
      logger.error('Error de red:', error)
      notify.error('Error al eliminar la hoja de datos')
    }
  }

  const retireDataSheetWithReason = async (
    id: number,
    reason: string,
    releaseCode: boolean
  ): Promise<void> => {
    try {
      await retireDataSheet.mutateAsync({ id, reason, releaseCode })
      notify.success('Equipo dado de baja correctamente')
    } catch (error) {
      logger.error('Error al dar de baja la hoja de datos:', error)
      throw error
    }
  }

  const deleteDataSheetPermanently = async (
    id: number,
    reason: string,
    force: boolean
  ): Promise<void> => {
    try {
      await deleteDataSheet.mutateAsync({ id, reason, force })
      notify.success('Equipo eliminado definitivamente')
    } catch (error) {
      logger.error('Error al eliminar la hoja de datos:', error)
      throw error
    }
  }

  const restoreDataSheetFromRetirement = async (id: number): Promise<void> => {
    try {
      await restoreDataSheet.mutateAsync(id)
      notify.success('Equipo restaurado correctamente')
    } catch (error) {
      logger.error('Error al restaurar la hoja de datos:', error)
      notify.error(getApiErrorMessage(error, 'No se pudo restaurar el equipo'))
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
      logger.error('Error al subir la foto:', error)
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

  const handleUploadManual = async (
    id: number,
    manualFile: File
  ): Promise<void> => {
    try {
      const response = await uploadManual.mutateAsync({ id, manualFile })
      if (response.status === 200) notify.success('Manual subido correctamente')
    } catch (error) {
      notify.error(getApiErrorMessage(error, 'Error subiendo el manual.'))
    }
  }

  const handleDownloadManual = async (id: number): Promise<void> => {
    try {
      const response = await downloadManual(id)
      const blob = response.data as Blob
      const ext =
        { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[
          blob.type
        ] ?? 'pdf'
      downloadBlob(blob, `manual-${id}.${ext}`)
    } catch (error) {
      notify.error('Error descargando el manual')
    }
  }

  return {
    handleUploadManual,
    handleDownloadManual,
    saveDataSheet,
    removeDataSheet,
    retireDataSheetWithReason,
    deleteDataSheetPermanently,
    restoreDataSheetFromRetirement,
    handleUpload,
    handleUploadPdf,
    handleDownloadPdf
  }
}

export type DataSheetActions = ReturnType<typeof useDataSheetActions>
