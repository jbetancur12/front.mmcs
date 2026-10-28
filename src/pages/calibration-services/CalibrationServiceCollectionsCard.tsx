import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import {
  CalibrationServiceCollectionBucket,
  CalibrationServiceAnalyticsResponse
} from '../../types/calibrationService'

const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

interface Props {
  collections?: CalibrationServiceAnalyticsResponse['summary']['collections']
}

const sum = (
  a: CalibrationServiceCollectionBucket,
  b: CalibrationServiceCollectionBucket
): CalibrationServiceCollectionBucket => ({
  invoiced: a.invoiced + b.invoiced,
  collected: a.collected + b.collected,
  outstanding: a.outstanding + b.outstanding,
  cuts: a.cuts + b.cuts,
  outstandingCuts: a.outstandingCuts + b.outstandingCuts
})

/**
 * Cobro de lo facturado: facturado, cobrado y por cobrar, de contado y a crédito. "Cobrado" es lo que facturación
 * registró como pagado; en contado lo pendiente además frena los certificados, a crédito solo es cartera.
 */
const CalibrationServiceCollectionsCard = ({ collections }: Props) => {
  if (!collections) {
    return null
  }

  const rows: Array<[string, CalibrationServiceCollectionBucket]> = [
    ['Contado', collections.cash],
    ['Crédito', collections.credit],
    ['Total', sum(collections.cash, collections.credit)]
  ]

  return (
    <Card
      elevation={0}
      sx={{ mb: 3, borderRadius: '16px', border: '1px solid #e5e7eb' }}
    >
      <CardContent>
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          Cobro
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Lo facturado, lo que ya se registró como pagado y lo que falta por
          cobrar. En contado, lo pendiente frena los certificados.
        </Typography>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell align='right'>Facturado</TableCell>
              <TableCell align='right'>Cobrado</TableCell>
              <TableCell align='right'>Por cobrar</TableCell>
              <TableCell align='right'>Cortes por cobrar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(([label, bucket]) => (
              <TableRow key={label}>
                <TableCell sx={{ fontWeight: label === 'Total' ? 700 : 600 }}>
                  {label}
                </TableCell>
                <TableCell align='right'>
                  {currency.format(bucket.invoiced)}
                </TableCell>
                <TableCell align='right'>
                  {currency.format(bucket.collected)}
                </TableCell>
                <TableCell
                  align='right'
                  sx={{
                    fontWeight: 700,
                    color: bucket.outstanding > 0 ? '#c2410c' : 'inherit'
                  }}
                >
                  {currency.format(bucket.outstanding)}
                </TableCell>
                <TableCell align='right'>
                  {bucket.outstandingCuts} de {bucket.cuts}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default CalibrationServiceCollectionsCard
