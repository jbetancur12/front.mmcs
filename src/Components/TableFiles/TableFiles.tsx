import { useEffect, useState } from 'react'
import { useFileData } from './hooks/useFileData'
import { TableView } from './TableView/TableView'
import useAxiosPrivate from '@utils/use-axios-private'
import { useStore } from '@nanostores/react'
import { userStore } from '@stores/userStore'
import { CreateFileModal } from './CreateFileModal/CreateFileModal'
import Loader from '../Loader2'

const TableFiles = () => {
  const axiosPrivate = useAxiosPrivate()
  const { tableData, loading, fetchFiles } = useFileData()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const $user = useStore(userStore)

  useEffect(() => {
    fetchFiles()
  }, [])

  if (loading) return <Loader loading={loading} />

  return (
    <>
      <TableView
        data={tableData}
        fetchFiles={fetchFiles}
        axiosPrivate={axiosPrivate}
        openModal={() => setCreateModalOpen(true)}
      />
      {$user.rol.some((r) => ['admin', 'metrologist'].includes(r)) && (
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
