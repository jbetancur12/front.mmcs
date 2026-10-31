import { Alert, Button } from '@mui/material'
import { PERMISSIONS } from '../constants/permissions'
import { usePlatformBilling } from '../hooks/usePlatformBilling'
import { useCan } from '@utils/functions'

/** Aviso fijo para el administrador cuando DigitalOcean reporta un problema de pago. */
const PlatformBillingBanner = () => {
  const canView = useCan(PERMISSIONS.SYSTEM_BILLING_VIEW)
  const { data } = usePlatformBilling(canView)

  if (!canView || !data?.hasProblem) return null

  return (
    <Alert
      severity='error'
      variant='filled'
      sx={{ borderRadius: 0, alignItems: 'center' }}
      action={
        <Button
          color='inherit'
          size='small'
          href={data.billingUrl ?? 'https://cloud.digitalocean.com/account/billing'}
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
  )
}

export default PlatformBillingBanner
