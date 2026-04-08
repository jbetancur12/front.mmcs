import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import EastOutlinedIcon from '@mui/icons-material/EastOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined'
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined'
import {
  CALIBRATION_SERVICE_ADJUSTMENT_REPORT_ROLES,
  CALIBRATION_SERVICE_ADJUSTMENT_REVIEW_ROLES,
  CALIBRATION_SERVICE_APPROVAL_ROLES,
  CALIBRATION_SERVICE_CLOSE_ROLES,
  CALIBRATION_SERVICE_DOCUMENT_CONTROL_ROLES,
  CALIBRATION_SERVICE_EXECUTION_ROLES,
  CALIBRATION_SERVICE_INVOICING_ROLES,
  CALIBRATION_SERVICE_ODS_ROLES,
  CALIBRATION_SERVICE_SCHEDULE_ROLES
} from '../../constants/calibrationServices'

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  super_admin: 'Super admin',
  comp_admin: 'Comp. admin',
  comp_requester: 'Comp. requester',
  comp_supervisor: 'Comp. supervisor',
  metrologist: 'Metrologo',
  invoicing: 'Facturacion'
}

const glossaryRows = [
  {
    code: 'SCL-2026-0004',
    meaning: 'Servicio de calibracion',
    description: 'Registro maestro del caso dentro del modulo.'
  },
  {
    code: 'MMCS-10822',
    meaning: 'Cotizacion / oferta',
    description: 'Consecutivo comercial que se entrega al cliente.'
  },
  {
    code: '3474-CAL-MMCS',
    meaning: 'ODS',
    description: 'Orden de servicio operativa del caso.'
  },
  {
    code: 'SCL-2026-0004-C01',
    meaning: 'Corte',
    description: 'Salida parcial o final para facturacion, documentos y envio.'
  },
  {
    code: 'Anexo / consolidado',
    meaning: 'Documentos de novedades',
    description:
      'Soportes formales de cambios aprobados sin reemplazar la ODS original.'
  }
] as const

const flowStages = [
  {
    title: 'Cotizacion',
    detail: 'Borrador, envio al cliente, respuesta y cambios'
  },
  {
    title: 'ODS',
    detail: 'Emision de orden de servicio y arranque del flujo operativo'
  },
  {
    title: 'Programacion',
    detail: 'Fecha compromiso, fecha programada y responsable operativo'
  },
  {
    title: 'Ejecucion',
    detail: 'Avance por item, novedades y cierre tecnico'
  },
  {
    title: 'Cortes',
    detail: 'Parciales o final, listos para facturar'
  },
  {
    title: 'Facturacion',
    detail: 'Numero de factura, fecha y soporte opcional'
  },
  {
    title: 'Control documental',
    detail: 'Certificados esperados, cargados, revisados y enviados'
  },
  {
    title: 'Cierre final',
    detail: 'Servicio cerrado y sin acciones pendientes'
  }
] as const

const permissionRows = [
  {
    action: 'Registrar respuesta del cliente',
    roles: CALIBRATION_SERVICE_APPROVAL_ROLES
  },
  {
    action: 'Emitir ODS',
    roles: CALIBRATION_SERVICE_ODS_ROLES
  },
  {
    action: 'Programar servicio',
    roles: CALIBRATION_SERVICE_SCHEDULE_ROLES
  },
  {
    action: 'Ejecutar / finalizar tecnico',
    roles: CALIBRATION_SERVICE_EXECUTION_ROLES
  },
  {
    action: 'Reportar novedades',
    roles: CALIBRATION_SERVICE_ADJUSTMENT_REPORT_ROLES
  },
  {
    action: 'Revisar novedades',
    roles: CALIBRATION_SERVICE_ADJUSTMENT_REVIEW_ROLES
  },
  {
    action: 'Facturar corte',
    roles: CALIBRATION_SERVICE_INVOICING_ROLES
  },
  {
    action: 'Control documental',
    roles: CALIBRATION_SERVICE_DOCUMENT_CONTROL_ROLES
  },
  {
    action: 'Cerrar servicio',
    roles: CALIBRATION_SERVICE_CLOSE_ROLES
  }
] as const

const commercialBranchRows = [
  {
    title: 'Cliente aprueba',
    detail:
      'La cotización queda aprobada por cliente y habilita la emisión de ODS.'
  },
  {
    title: 'Cliente rechaza',
    detail:
      'El servicio queda rechazado y conserva la trazabilidad comercial, sin pasar a ODS.'
  },
  {
    title: 'Cliente solicita modificación',
    detail:
      'La cotización vuelve a borrador, se ajusta, se reenvía y mantiene historial del cambio.'
  }
] as const

const noveltyBranchRows = [
  {
    title: 'Cantidad mayor a la cotizada',
    detail:
      'Metrología reporta la novedad y comercial/facturación decide si usa el mismo precio o uno diferente.'
  },
  {
    title: 'Cantidad menor a la cotizada',
    detail:
      'Se registra la diferencia y luego se define si genera descuento o si el valor comercial se mantiene.'
  },
  {
    title: 'Ítem adicional no cotizado',
    detail:
      'Se crea la novedad, se revisa su impacto económico y, si se aprueba, puede salir en corte.'
  },
  {
    title: 'Documento formal',
    detail:
      'Las novedades aprobadas pueden generar anexo PDF individual y también consolidado del servicio.'
  }
] as const

const renderRoleChips = (roles: readonly string[]) => (
  <Stack direction='row' spacing={0.75} useFlexGap flexWrap='wrap'>
    {roles.map((role) => (
      <Chip key={role} size='small' variant='outlined' label={roleLabels[role] || role} />
    ))}
  </Stack>
)

const CalibrationServiceGuidePanel = () => {
  return (
    <Stack spacing={3}>
      <Alert severity='info' icon={<InfoOutlinedIcon fontSize='inherit' />}>
        Esta guía resume el flujo del módulo, las siglas que ves en pantalla y qué
        rol puede ejecutar cada acción.
      </Alert>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant='h6' fontWeight={700} gutterBottom>
            Leyenda de consecutivos
          </Typography>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Qué es</TableCell>
                <TableCell>Uso en el flujo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {glossaryRows.map((row) => (
                <TableRow key={row.code}>
                  <TableCell>
                    <Typography fontWeight={700}>{row.code}</Typography>
                  </TableCell>
                  <TableCell>{row.meaning}</TableCell>
                  <TableCell>{row.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant='h6' fontWeight={700} gutterBottom>
            Flujo operativo del módulo
          </Typography>
          <Stack
            direction='row'
            spacing={1}
            useFlexGap
            flexWrap='wrap'
            alignItems='stretch'
          >
            {flowStages.map((stage, index) => (
              <Stack
                key={stage.title}
                direction='row'
                spacing={1}
                alignItems='center'
              >
                <Box
                  sx={{
                    minWidth: 180,
                    maxWidth: 210,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    px: 1.5,
                    py: 1.25,
                    backgroundColor: '#f8fbf9'
                  }}
                >
                  <Typography fontWeight={700} variant='body2'>
                    {index + 1}. {stage.title}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {stage.detail}
                  </Typography>
                </Box>
                {index < flowStages.length - 1 ? (
                  <EastOutlinedIcon sx={{ color: 'text.secondary' }} />
                ) : null}
              </Stack>
            ))}
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <Stack spacing={1}>
            <Typography variant='subtitle2' fontWeight={700}>
              Lectura rápida
            </Typography>
            <Stack direction='row' spacing={1} alignItems='center'>
              <CheckCircleOutlineOutlinedIcon color='success' fontSize='small' />
              <Typography variant='body2'>
                Finalizar ejecución no reemplaza el corte. Después del cierre técnico
                siempre debes formalizar al menos un corte final.
              </Typography>
            </Stack>
            <Stack direction='row' spacing={1} alignItems='center'>
              <CheckCircleOutlineOutlinedIcon color='success' fontSize='small' />
              <Typography variant='body2'>
                Las novedades se registran para reflejar lo realmente ejecutado sin
                reescribir la cotización original ni la ODS base.
              </Typography>
            </Stack>
            <Stack direction='row' spacing={1} alignItems='center'>
              <CheckCircleOutlineOutlinedIcon color='success' fontSize='small' />
              <Typography variant='body2'>
                El cierre final solo ocurre cuando el flujo técnico, administrativo y
                documental ya quedó completo.
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant='h6' fontWeight={700} gutterBottom>
            Desvíos y caminos alternos
          </Typography>

          <Stack spacing={2.5}>
            <Box>
              <Typography variant='subtitle1' fontWeight={700} gutterBottom>
                Flujo comercial
              </Typography>
              <List dense disablePadding>
                {commercialBranchRows.map((row, index) => (
                  <ListItem key={row.title} disableGutters sx={{ alignItems: 'flex-start', py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 34, mt: 0.2 }}>
                      {index === 0 ? (
                        <CheckCircleOutlineOutlinedIcon color='success' fontSize='small' />
                      ) : index === 1 ? (
                        <CloseOutlinedIcon color='error' fontSize='small' />
                      ) : (
                        <AutorenewOutlinedIcon color='warning' fontSize='small' />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography fontWeight={700}>{row.title}</Typography>}
                      secondary={row.detail}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box>
              <Typography variant='subtitle1' fontWeight={700} gutterBottom>
                Flujo de novedades en ejecución
              </Typography>
              <List dense disablePadding>
                {noveltyBranchRows.map((row) => (
                  <ListItem key={row.title} disableGutters sx={{ alignItems: 'flex-start', py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 34, mt: 0.2 }}>
                      <BuildCircleOutlinedIcon color='info' fontSize='small' />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography fontWeight={700}>{row.title}</Typography>}
                      secondary={row.detail}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant='h6' fontWeight={700} gutterBottom>
            Matriz de roles y acciones
          </Typography>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Acción</TableCell>
                <TableCell>Roles habilitados</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {permissionRows.map((row) => (
                <TableRow key={row.action}>
                  <TableCell sx={{ width: '34%' }}>
                    <Typography fontWeight={600}>{row.action}</Typography>
                  </TableCell>
                  <TableCell>{renderRoleChips(row.roles)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default CalibrationServiceGuidePanel
