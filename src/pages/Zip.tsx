import SignalLoader from 'src/Components/Common/SignalLoader'
import { Suspense, lazy, useState } from 'react'
import { Container, IconButton, Tooltip } from '@mui/material'
import { Settings, UploadFile } from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'

import ModalPasswordForm from '../Components/ModalPasswordForm'

const AnalyzeExcelComponent = lazy(() => import('./AnalyzeExcelComponent'))

const Zip = () => {
  const [openModalSettings, setOpenModalSettings] = useState(false)
  const [wbPasswords, setWbPasswords] = useState<string[]>([])

  const handleOpenModalSettings = () => {
    setOpenModalSettings(true)
  }

  const handleCloseModalSettings = () => {
    setOpenModalSettings(false)
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <ModalPasswordForm
        open={openModalSettings}
        onClose={handleCloseModalSettings}
        wbPasswords={wbPasswords}
        setWbPasswords={setWbPasswords}
      />
      <LmsPageHeader
        title='Subir Excel'
        subtitle='Carga de certificados por archivo Excel y PDF asociado.'
        icon={<UploadFile />}
        actions={
          <Tooltip title='Contraseñas de los libros'>
            <IconButton onClick={handleOpenModalSettings}>
              <Settings />
            </IconButton>
          </Tooltip>
        }
      />
      <Suspense fallback={<SignalLoader message='Cargando analizador...' />}>
        <AnalyzeExcelComponent
          hideUpload={false}
          isFile={true}
          wbPasswords={wbPasswords}
        />
      </Suspense>
    </Container>
  )
}

export default Zip
