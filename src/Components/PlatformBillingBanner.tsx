import { Alert, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { PERMISSIONS } from '../constants/permissions'
import { usePlatformBilling } from '../hooks/usePlatformBilling'
import { useCan } from '@utils/functions'

const BILLING_URL = 'https://cloud.digitalocean.com/account/billing'

const describe = (name: string, days: number) => {
  if (days < 0) return `${name} venció hace ${Math.abs(days)} día(s)`
  if (days === 0) return `${name} vence hoy`
  return `${name} vence en ${days} día(s)`
}

/** Avisos fijos para el administrador: problema de pago en DigitalOcean y vencimientos próximos. */
const PlatformBillingBanner = () => {
  const canView = useCan(PERMISSIONS.SYSTEM_BILLING_VIEW)
  const { data } = usePlatformBilling(canView)

  if (!canView || !data) return null

  const expiring = data.expiring ?? []
  const urgent = expiring.some((item) => item.daysLeft <= 15)

  return (
    <>
      {data.hasProblem ? (
        <Alert
          severity='error'
          variant='filled'
          sx={{ borderRadius: 0, alignItems: 'center' }}
          action={
            <Button
              color='inherit'
              size='small'
              href={data.billingUrl ?? BILLING_URL}
              target='_blank'
              rel='noopener noreferrer'
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Actualizar pago
            </Button>
          }
        >
          {data.message}
        </Alert>
      ) : null}
      {expiring.length ? (
        <Alert
          severity={urgent ? 'error' : 'warning'}
          variant='filled'
          sx={{ borderRadius: 0, alignItems: 'center' }}
          action={
            <Button
              color='inherit'
              size='small'
              component={RouterLink}
              to='/settings/cloud-billing'
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Ver vencimientos
            </Button>
          }
        >
          {expiring
            .slice(0, 3)
            .map((item) => describe(item.name, item.daysLeft))
            .join(' · ')}
          {expiring.length > 3 ? ` · y ${expiring.length - 3} más` : ''}
        </Alert>
      ) : null}
    </>
  )
}

export default PlatformBillingBanner
