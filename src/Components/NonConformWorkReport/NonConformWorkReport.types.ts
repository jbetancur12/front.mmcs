export type ImpactWeight = 'High' | 'Medium' | 'Low'
export type Probability = 'High' | 'Medium' | 'Low'
export type RiskLevel =
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low'
  | 'Very Low'
  | 'Not evaluated'

export interface NonConformWorkReport {
  id?: number
  tncCode: string
  tncAcceptance: 'Accepted' | 'No accepted'
  registerDate: string
  detectedBy: string
  affectedArea: string
  iso17025Clause?: string
  findingDescription: string
  status: 'Open' | 'Closed'

  serviceNumbers?: string
  affectedClients?: string
  involvedProcedure?: string
  resultsDelivered?: string

  previousResultsReviewed?: string
  evaluatedCertificates?: string
  moreFindings?: 'Yes' | 'No'
  actionOnPreviousResults?: string

  resultValidity: number
  affectedServicesCount: number
  clientResultsDelivery: number
  contractualImpact: number
  reputationRisk: number
  impactScore?: number
  impactWeight?: ImpactWeight

  previousNonConformWorks?: 'Yes' | 'No'
  nonConformityOccurrences: number
  probability?: Probability

  riskImpact?: ImpactWeight
  riskProbability?: Probability
  riskLevel?: RiskLevel

  immediateCorrection?: string
  correctionBy?: string
  correctionDate?: string
  correctiveActionRequired?: boolean
  correctiveAction?: string
  correctiveActionBy?: string
  correctiveActionDate?: string

  clientNotified?: boolean
  notificationMethod?: string
  notificationDate?: string
  communicationSummary?: string

  workSuspended?: boolean
  resumptionAuthorizationDate?: string
  authorizedBy?: string

  closingDate?: string
  closingResponsible?: string
  closingComments?: string
  closingDeadlineExtended?: boolean
  closingJustification?: string

  recurrence?: boolean
  correctiveActionsEffectiveness?: string
}
