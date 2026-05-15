const isEnabled = (value: string | undefined) => value?.trim().toLowerCase() === 'true'

export const maintenanceSignaturesEnabled = isEnabled(
  import.meta.env.VITE_MAINTENANCE_SIGNATURES_ENABLED
)

