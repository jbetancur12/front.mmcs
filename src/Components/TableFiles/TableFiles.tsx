import { useState } from 'react'
import { useFileData } from './hooks/useFileData'
import { TableView } from './TableView/TableView'
import useAxiosPrivate from '@utils/use-axios-private'
import { CreateFileModal } from './CreateFileModal/CreateFileModal'
import Loader from '../Loader2'

import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
const TableFiles = () => {
  const axiosPrivate = useAxiosPrivate()
  const { tableData, loading, rowCount, fetchFiles } = useFileData()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const canCreateFile = useCan(PERMISSIONS.CALIBRATION_FILE_CREATE)

  return (
    <>
      <Loader loading={loading} />
      <TableView
        data={tableData}
        rowCount={rowCount}
        loading={loading}
        fetchFiles={fetchFiles}
        axiosPrivate={axiosPrivate}
        openModal={() => setCreateModalOpen(true)}
      />
      {canCreateFile && (
        <CreateFileModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          fetchFiles={fetchFiles}
          axiosPrivate={axiosPrivate}
        />
      )}
    </>
  )
}

export default TableFiles
