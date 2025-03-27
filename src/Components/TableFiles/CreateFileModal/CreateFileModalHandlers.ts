import { FileData } from '../types/fileTypes'

export const handleCreateFile = async (
  values: FileData,
  file: File | null,
  axiosPrivate: any,
  fetchFiles: () => Promise<void>
) => {
  try {
    if (!file) throw new Error('Debe seleccionar un archivo PDF')
    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (value instanceof Date) {
        formData.append(key, value.toISOString())
      } else if (value !== null) {
        formData.append(key, value.toString())
      }
    })
    if (file) formData.append('pdf', file)

    const response = await axiosPrivate.post('/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    if (response.status === 201) {
      await fetchFiles()
      return true
    }
  } catch (error) {
    throw error
  }
}
