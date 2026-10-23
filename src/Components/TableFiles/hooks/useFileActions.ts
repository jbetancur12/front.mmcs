import { useCallback } from 'react'
import useAxiosPrivate from '@utils/use-axios-private'
import { notify } from 'src/utils/notify'

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
        console.error('Delete error:', error)
      }
    },
    [axiosPrivate, fetchFiles]
  )

  const handleDeleteRow = useCallback(
    (rowId: number) => {
      if (confirm('¿Estás seguro de eliminar este archivo?')) {
        deleteFile(rowId)
      }
    },
    [deleteFile]
  )

  return { handleDeleteRow }
}
