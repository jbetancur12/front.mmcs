import { useCallback } from 'react'
import useAxiosPrivate from '@utils/use-axios-private'
import { notify } from 'src/utils/notify'
import { confirmDialog } from 'src/utils/confirm'

import { logger } from 'src/utils/logger'
export const useFileActions = (
  axiosPrivate: ReturnType<typeof useAxiosPrivate>,
  fetchFiles: (options?: { force?: boolean }) => Promise<void>
) => {
  const deleteFile = useCallback(
    async (id: number) => {
      try {
        await axiosPrivate.delete(`/files/${id}`)
        notify.success('Archivo eliminado exitosamente')
        await fetchFiles({ force: true })
      } catch (error) {
        notify.error('Error al eliminar archivo')
        logger.error('Delete error:', error)
      }
    },
    [axiosPrivate, fetchFiles]
  )

  const handleDeleteRow = useCallback(
    async (rowId: number, name?: string) => {
      const { isConfirmed } = await confirmDialog({
        title: 'Eliminar certificado',
        text: `${
          name ? `Vas a eliminar "${name}". ` : ''
        }Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        tone: 'danger'
      })
      if (isConfirmed) deleteFile(rowId)
    },
    [deleteFile]
  )

  return { handleDeleteRow }
}
