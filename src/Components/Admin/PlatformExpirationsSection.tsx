import { useMemo, useState } from 'react'
import { Box, Button, Chip, IconButton, Link, Stack } from '@mui/material'
import {
  AddOutlined,
  DeleteOutline,
  EditOutlined,
  OpenInNewOutlined
} from '@mui/icons-material'
import { type MRT_ColumnDef } from 'material-react-table'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import DataTable from 'src/Components/Common/DataTable'
import FormDialog from 'src/Components/Common/FormDialog'
import FormikField from 'src/Components/Common/FormikField'
import FormDateField from 'src/Components/Common/FormDateField'
import { PERMISSIONS } from 'src/constants/permissions'
import {
  type PlatformExpiration,
  useDeletePlatformExpiration,
  usePlatformExpirations,
  useSavePlatformExpiration
} from 'src/hooks/usePlatformBilling'
import { useCan } from '@utils/functions'
import { getApiErrorReason } from 'src/utils/apiError'
import { confirmDialog } from 'src/utils/confirm'
import { notify } from 'src/utils/notify'

interface FormValues {
  name: string
  provider: string
  expiresOn: string
  cost: string
  renewUrl: string
  notes: string
}

const EMPTY: FormValues = {
  name: '',
  provider: '',
  expiresOn: '',
  cost: '',
  renewUrl: '',
  notes: ''
}

const schema = Yup.object({
  name: Yup.string().trim().required('Escribe el nombre del servicio').max(200),
  provider: Yup.string().max(120),
  expiresOn: Yup.string().required('Elige la fecha de vencimiento'),
  cost: Yup.string().max(60),
  renewUrl: Yup.string()
    .matches(/^(https?:\/\/.+)?$/i, 'Debe empezar por http:// o https://')
    .max(500),
  notes: Yup.string().max(2000)
})

const SEVERITY_COLOR = {
  green: 'success',
  orange: 'warning',
  red: 'error'
} as const

const describeDays = (days: number) => {
  if (days < 0) return `Venció hace ${Math.abs(days)} día(s)`
  if (days === 0) return 'Vence hoy'
  return `Faltan ${days} día(s)`
}

const formatDate = (value: string) =>
  new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('es-CO')

/** Lista de vencimientos de servicios (dominio, hosting...) que el admin registra a mano. */
const PlatformExpirationsSection = () => {
  const canManage = useCan(PERMISSIONS.SYSTEM_BILLING_MANAGE)
  const { data, isLoading, isFetching } = usePlatformExpirations()
  const save = useSavePlatformExpiration()
  const remove = useDeletePlatformExpiration()
  const [editing, setEditing] = useState<PlatformExpiration | null>(null)
  const [open, setOpen] = useState(false)

  const formik = useFormik<FormValues>({
    initialValues: EMPTY,
    validationSchema: schema,
    onSubmit: async (values) => {
      try {
        await save.mutateAsync({
          id: editing?.id,
          name: values.name,
          provider: values.provider || null,
          expiresOn: values.expiresOn,
          cost: values.cost || null,
          renewUrl: values.renewUrl || null,
          notes: values.notes || null
        })
        notify.success(
          editing ? 'Vencimiento actualizado' : 'Vencimiento agregado'
        )
        setOpen(false)
      } catch (err) {
        notify.error('No se pudo guardar', getApiErrorReason(err) ?? undefined)
      }
    }
  })

  const openDialog = (item: PlatformExpiration | null) => {
    setEditing(item)
    formik.resetForm({
      values: item
        ? {
            name: item.name,
            provider: item.provider ?? '',
            expiresOn: item.expiresOn.slice(0, 10),
            cost: item.cost ?? '',
            renewUrl: item.renewUrl ?? '',
            notes: item.notes ?? ''
          }
        : EMPTY
    })
    setOpen(true)
  }

  const handleDelete = async (item: PlatformExpiration) => {
    const { isConfirmed } = await confirmDialog({
      title: '¿Borrar este vencimiento?',
      text: `Se dejará de avisar sobre "${item.name}".`,
      confirmLabel: 'Sí, borrar',
      tone: 'danger'
    })
    if (!isConfirmed) return
    try {
      await remove.mutateAsync(item.id)
      notify.success('Vencimiento borrado')
    } catch (err) {
      notify.error('No se pudo borrar', getApiErrorReason(err) ?? undefined)
    }
  }

  const columns = useMemo<MRT_ColumnDef<PlatformExpiration>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Servicio',
        Cell: ({ row }) => (
          <Box>
            <Box sx={{ fontWeight: 600 }}>{row.original.name}</Box>
            {row.original.provider ? (
              <Box sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                {row.original.provider}
              </Box>
            ) : null}
          </Box>
        )
      },
      {
        accessorKey: 'expiresOn',
        header: 'Vence',
        Cell: ({ cell }) => formatDate(cell.getValue<string>())
      },
      {
        accessorKey: 'daysLeft',
        header: 'Estado',
        Cell: ({ row }) => (
          <Chip
            size='small'
            variant='outlined'
            color={SEVERITY_COLOR[row.original.severity]}
            label={describeDays(row.original.daysLeft)}
          />
        )
      },
      { accessorKey: 'cost', header: 'Costo' },
      {
        id: 'renew',
        header: 'Renovar',
        enableSorting: false,
        Cell: ({ row }) =>
          row.original.renewUrl ? (
            <Link
              href={row.original.renewUrl}
              target='_blank'
              rel='noopener noreferrer'
              underline='hover'
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
            >
              Abrir <OpenInNewOutlined sx={{ fontSize: 14 }} />
            </Link>
          ) : (
            '—'
          )
      }
    ],
    []
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={data ?? []}
        itemLabel={['vencimiento', 'vencimientos']}
        searchPlaceholder='Buscar vencimientos'
        enableRowActions={canManage}
        initialState={{
          density: 'compact',
          sorting: [{ id: 'expiresOn', desc: false }]
        }}
        state={{ isLoading, showProgressBars: isFetching }}
        renderTopToolbarCustomActions={() =>
          canManage ? (
            <Button
              variant='contained'
              startIcon={<AddOutlined />}
              onClick={() => openDialog(null)}
              sx={{
                textTransform: 'none',
                bgcolor: '#00BFA5',
                '&:hover': { bgcolor: '#00ACC1' }
              }}
            >
              Agregar vencimiento
            </Button>
          ) : null
        }
        renderRowActions={({ row }) => (
          <Stack direction='row' spacing={0.5}>
            <IconButton
              size='small'
              aria-label={`Editar ${row.original.name}`}
              sx={{ color: '#2563eb' }}
              onClick={() => openDialog(row.original)}
            >
              <EditOutlined fontSize='small' />
            </IconButton>
            <IconButton
              size='small'
              color='error'
              aria-label={`Borrar ${row.original.name}`}
              onClick={() => handleDelete(row.original)}
            >
              <DeleteOutline fontSize='small' />
            </IconButton>
          </Stack>
        )}
      />

      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar vencimiento' : 'Agregar vencimiento'}
        subtitle={editing?.name}
        submitLabel={editing ? 'Guardar cambios' : 'Agregar vencimiento'}
        onSubmit={() => formik.handleSubmit()}
        loading={save.isLoading}
        maxWidth='sm'
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <FormikField
            formik={formik}
            name='name'
            label='Servicio'
            placeholder='Dominio metromedicslab.com.co'
            fullWidth
          />
          <FormikField
            formik={formik}
            name='provider'
            label='Proveedor'
            placeholder='mi.com.co'
            fullWidth
          />
          <FormDateField
            label='Fecha de vencimiento'
            name='expiresOn'
            value={formik.values.expiresOn}
            onChange={(value) => formik.setFieldValue('expiresOn', value)}
            error={
              formik.touched.expiresOn && formik.errors.expiresOn
                ? formik.errors.expiresOn
                : false
            }
          />
          <FormikField
            formik={formik}
            name='cost'
            label='Costo aproximado (opcional)'
            fullWidth
          />
          <FormikField
            formik={formik}
            name='renewUrl'
            label='Enlace para renovar (opcional)'
            placeholder='https://'
            fullWidth
          />
          <FormikField
            formik={formik}
            name='notes'
            label='Notas (opcional)'
            multiline
            fullWidth
          />
        </Stack>
      </FormDialog>
    </>
  )
}

export default PlatformExpirationsSection
