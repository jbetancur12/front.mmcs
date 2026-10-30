import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  LibraryCategory,
  LibraryDocument,
  LibraryDocumentForm
} from 'src/Components/Library/Library.types'

export const LIBRARY_QUERY_KEYS = {
  all: ['libraryDocuments'] as const,
  list: (category: LibraryCategory) =>
    ['libraryDocuments', 'list', category] as const,
  history: (id: number) => ['libraryDocuments', 'history', id] as const
}

export const libraryFileUrl = (id: number) => `/library/documents/${id}/file`

/** Documentos vigentes de una categoría. */
export const useLibraryDocuments = (category: LibraryCategory) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<LibraryDocument[]>(LIBRARY_QUERY_KEYS.list(category), () =>
    axiosPrivate
      .get('/library/documents', { params: { category } })
      .then((response) => response.data)
  )
}

/** Todas las versiones de un documento. */
export const useLibraryHistory = (id: number | null) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<LibraryDocument[]>(
    LIBRARY_QUERY_KEYS.history(id ?? 0),
    () =>
      axiosPrivate
        .get(`/library/documents/${id}/history`)
        .then((response) => response.data),
    { enabled: id !== null }
  )
}

const toFormData = (
  form: LibraryDocumentForm,
  extra: Record<string, string> = {}
) => {
  const data = new FormData()
  data.append('name', form.name)
  data.append('version', form.version)
  data.append('documentDate', form.documentDate)
  Object.entries(extra).forEach(([key, value]) => data.append(key, value))
  if (form.file) data.append('pdf', form.file)
  return data
}

export type LibrarySaveAction =
  | { type: 'create'; category: LibraryCategory; form: LibraryDocumentForm }
  | { type: 'version'; id: number; form: LibraryDocumentForm }
  | { type: 'edit'; id: number; form: LibraryDocumentForm }

/** Agregar un documento, subir una versión nueva o editar sus datos. */
export const useSaveLibraryDocument = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    (action: LibrarySaveAction) => {
      switch (action.type) {
        case 'create':
          return axiosPrivate.post(
            '/library/documents',
            toFormData(action.form, { category: action.category })
          )
        case 'version':
          return axiosPrivate.post(
            `/library/documents/${action.id}/versions`,
            toFormData(action.form)
          )
        default:
          return axiosPrivate.put(`/library/documents/${action.id}`, {
            name: action.form.name,
            version: action.form.version,
            documentDate: action.form.documentDate
          })
      }
    },
    { onSuccess: () => queryClient.invalidateQueries(LIBRARY_QUERY_KEYS.all) }
  )
}

export const useDeleteLibraryDocument = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    (id: number) => axiosPrivate.delete(`/library/documents/${id}`),
    { onSuccess: () => queryClient.invalidateQueries(LIBRARY_QUERY_KEYS.all) }
  )
}
