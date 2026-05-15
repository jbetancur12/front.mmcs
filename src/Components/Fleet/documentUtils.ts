import { AxiosInstance } from 'axios'
// Adjust path as needed

// Fetch Documents
export const fetchDocuments = async (
  vehicleId: number | string | undefined,
  axiosPrivate: AxiosInstance
) => {
  const { data } = await axiosPrivate.get(
    `/vehicles/${vehicleId}/documents`,
    {}
  )
  return {
    documents: data.documents,
    reminders: data.reminders,
    currentMileage: data.currentMileage,
    vehicleData: data.vehicleData
  }
}

// Add Document
export const addDocument = async (
  vehicleId: number | string | undefined,
  document: FormData,
  axiosPrivate: AxiosInstance
) => {
  await axiosPrivate.post(`/vehicles/${vehicleId}/documents`, document, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// Update Document
export const updateDocument = async (
  document: FormData,
  axiosPrivate: AxiosInstance
) => {
  const id = JSON.parse(document.get('document') as string).id

  await axiosPrivate.put(`/document/${id}`, document, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// Delete Document
export const deleteDocument = async (
  documentId: number,
  axiosPrivate: AxiosInstance
) => {
  await axiosPrivate.delete(`/document/${documentId}`, {})
}
