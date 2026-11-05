/**
 * Consentimiento de analítica de la plataforma (PostHog).
 *
 * PostHog se inicializa con `opt_out_capturing_by_default`, así que no envía
 * nada hasta que la persona acepte en el aviso de primer ingreso. La decisión
 * se guarda por navegador y se puede cambiar desde el menú de la cuenta.
 */

export type AnalyticsConsentDecision = 'granted' | 'denied'

export const ANALYTICS_CONSENT_KEY = 'mmcs_analytics_consent'
export const OPEN_ANALYTICS_CONSENT_EVENT = 'mmcs:open-analytics-consent'

/** Decisión guardada, o null si todavía no eligió. */
export const getAnalyticsConsent = (): AnalyticsConsentDecision | null => {
  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export const setAnalyticsConsent = (
  decision: AnalyticsConsentDecision
): void => {
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, decision)
  } catch {
    // Modo privado: la decisión vale solo para esta visita.
  }
}

/** Abre el aviso desde cualquier punto (menú de la cuenta). */
export const openAnalyticsConsentPreferences = (): void => {
  window.dispatchEvent(new Event(OPEN_ANALYTICS_CONSENT_EVENT))
}
