import { downloadPrivateFile } from '@utils/downloadBlob'
import {
  libraryFileUrl,
  librarySourceUrl
} from 'src/hooks/library/useLibraryDocuments'
import { notify } from 'src/utils/notify'
import { LibraryDocument } from './Library.types'

const extensionOf = (fileName?: string | null) => {
  const dot = fileName?.lastIndexOf('.') ?? -1
  return fileName && dot >= 0 ? fileName.slice(dot) : ''
}

/** Descarga el PDF de una versión. */
export const downloadLibraryPdf = (document: LibraryDocument) =>
  downloadPrivateFile(
    libraryFileUrl(document.id),
    `${document.name} v${document.version}.pdf`,
    { download: true }
  ).catch(() => notify.error('No se pudo descargar el documento'))

/** Descarga el archivo original (Word o Excel) de una versión. */
export const downloadLibrarySource = (document: LibraryDocument) =>
  downloadPrivateFile(
    librarySourceUrl(document.id),
    `${document.name} v${document.version}${extensionOf(document.sourceName)}`
  ).catch(() => notify.error('No se pudo descargar el archivo original'))
