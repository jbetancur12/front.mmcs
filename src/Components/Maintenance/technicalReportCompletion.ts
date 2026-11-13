/**
 * Porcentaje de avance del reporte técnico de mantenimiento.
 * Un solo cálculo para la página del ticket, el panel y el diálogo del reporte,
 * así los tres muestran el mismo número para el mismo reporte.
 */

interface ReportLike {
  finalDiagnosis?: string | null
  rootCause?: string | null
  activities?: Array<string | null | undefined> | null
  parts?: Array<{ description?: string | null }> | null
  verificationProtocolType?: string | null
  verificationTools?: Array<{ name?: string | null }> | null
  verificationTests?: Array<{ parameter?: string | null }> | null
  recommendations?: string | null
  scopeClause?: string | null
  responsibilityClause?: string | null
}

const hasText = (value?: string | null) => Boolean(value?.trim())

export const getTechnicalReportCompletion = (
  report?: ReportLike | null
): number => {
  if (!report) return 0

  const checkpoints = [
    hasText(report.finalDiagnosis),
    hasText(report.rootCause),
    Boolean(report.activities?.some((item) => hasText(item))),
    Boolean(report.parts?.some((item) => hasText(item.description))),
    hasText(report.verificationProtocolType),
    Boolean(report.verificationTools?.some((item) => hasText(item.name))),
    Boolean(report.verificationTests?.some((item) => hasText(item.parameter))),
    hasText(report.recommendations),
    hasText(report.scopeClause),
    hasText(report.responsibilityClause)
  ]

  const completed = checkpoints.filter(Boolean).length
  return Math.round((completed / checkpoints.length) * 100)
}
