import SignalLoader from 'src/Components/Common/SignalLoader'
import { Suspense, lazy, useState } from 'react'
import { Container, IconButton, Tooltip } from '@mui/material'
import { LockOutlined } from '@mui/icons-material'

import ModalPasswordForm from '../Components/ModalPasswordForm'

const AnalyzeExcelComponent = lazy(() => import('./AnalyzeExcelComponent'))

const Zip = () => {
  const [openModalSettings, setOpenModalSettings] = useState(false)
  const [wbPasswords, setWbPasswords] = useState<string[]>([])

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <ModalPasswordForm
        open={openModalSettings}
        onClose={() => setOpenModalSettings(false)}
        wbPasswords={wbPasswords}
        setWbPasswords={setWbPasswords}
      />
      <Suspense fallback={<SignalLoader message='Cargando analizador...' />}>
        <AnalyzeExcelComponent
          hideUpload={false}
          isFile={true}
          wbPasswords={wbPasswords}
          headerActions={
            <Tooltip title='Contraseñas de los libros'>
              <IconButton
                aria-label='Contraseñas de los libros'
                onClick={() => setOpenModalSettings(true)}
                sx={{ color: '#00695C' }}
              >
                <LockOutlined />
              </IconButton>
            </Tooltip>
          }
        />
      </Suspense>
    </Container>
  )
}

export default Zip
