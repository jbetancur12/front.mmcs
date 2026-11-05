import {
  ANALYTICS_CONSENT_KEY,
  getAnalyticsConsent,
  setAnalyticsConsent
} from './analyticsConsent'

describe('consentimiento de analítica', () => {
  beforeEach(() => window.localStorage.clear())

  it('vale null mientras no haya decisión', () => {
    expect(getAnalyticsConsent()).toBeNull()
  })

  it('guarda y lee si se aceptó', () => {
    setAnalyticsConsent('granted')
    expect(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('granted')
    expect(getAnalyticsConsent()).toBe('granted')
  })

  it('guarda y lee si se rechazó', () => {
    setAnalyticsConsent('denied')
    expect(getAnalyticsConsent()).toBe('denied')
  })

  it('ignora valores desconocidos', () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, 'quizas')
    expect(getAnalyticsConsent()).toBeNull()
  })
})
