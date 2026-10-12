import { useState } from 'react'
import { useFileData } from './hooks/useFileData'
import { TableView } from './TableView/TableView'
import useAxiosPrivate from '@utils/use-axios-private'
import { useStore } from '@nanostores/react'
import { userStore } from '@stores/userStore'
import { CreateFileModal } from './CreateFileModal/CreateFileModal'
import Loader from '../Loader2'

import { ROLE_GROUPS, hasAnyRole } from 'src/constants/roles'
const TableFiles = () => {
  const axiosPrivate = useAxiosPrivate()
  const { tableData, loading, rowCount, fetchFiles } = useFileData()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const $user = useStore(userStore)

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
      {hasAnyRole($user.rol, ROLE_GROUPS.METROLOGY_STAFF) && (
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
