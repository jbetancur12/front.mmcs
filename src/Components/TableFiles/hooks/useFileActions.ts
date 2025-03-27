import { useCallback } from 'react'
import useAxiosPrivate from '@utils/use-axios-private'
import { bigToast } from '../../ExcelManipulation/Utils'

export const useFileActions = (
  axiosPrivate: ReturnType<typeof useAxiosPrivate>,
  fetchFiles: () => Promise<void>
) => {
  const deleteFile = useCallback(
    async (id: number) => {
      try {
        await axiosPrivate.delete(`/files/${id}`)
        bigToast('Archivo eliminado exitosamente', 'success')
        await fetchFiles()
      } catch (error) {
        bigToast('Error al eliminar archivo', 'error')
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
