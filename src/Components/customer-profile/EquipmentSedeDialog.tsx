import { useEffect, useState } from 'react'
import { MenuItem, TextField } from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import FormDialog from '../Common/FormDialog'
import { notify } from 'src/utils/notify'
import { Certificate } from './types'

interface EquipmentSedeDialogProps {
  certificate: Certificate | null
  sedes: string[]
  onClose: () => void
  /** Se llama tras guardar, para recargar la lista. */
  onChanged: () => void
}

/** Cambia la sede a la que pertenece un equipo del cliente. */
const EquipmentSedeDialog = ({
  certificate,
  sedes,
  onClose,
  onChanged
}: EquipmentSedeDialogProps) => {
  const axiosPrivate = useAxiosPrivate()
  const [sede, setSede] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSede(certificate?.headquarter || '')
  }, [certificate])

  const handleSubmit = async () => {
    if (!certificate || !sede || sede === certificate.headquarter) {
      onClose()
      return
    }
    setSaving(true)
    try {
      const response = await axiosPrivate.put(
        `/files/headquarter/${certificate.id}`,
        { headquarter: sede }
      )
      if (response.status === 200) {
        notify.success(`Sede cambiada a "${sede}"`)
        onChanged()
        onClose()
      }
    } catch (error) {
      notify.error('Error al actualizar la sede')
      console.error('Error updating headquarter:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      open={Boolean(certificate)}
      onClose={saving ? () => undefined : onClose}
      title='Cambiar sede del equipo'
      subtitle={certificate?.device?.name}
      submitLabel='Cambiar sede'
      onSubmit={() => void handleSubmit()}
      loading={saving}
      submitDisabled={!sede || sede === certificate?.headquarter}
    >
      <TextField
        select
        fullWidth
        label='Sede'
        value={sede}
        onChange={(event) => setSede(event.target.value)}
        disabled={sedes.length === 0}
        helperText={
          sedes.length === 0
            ? 'El cliente no tiene sedes registradas'
            : certificate?.headquarter
              ? `Sede actual: ${certificate.headquarter}`
              : 'El equipo no tiene sede asignada'
        }
      >
        {sedes.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
    </FormDialog>
  )
}

export default EquipmentSedeDialog
