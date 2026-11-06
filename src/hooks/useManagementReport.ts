import { useQuery } from 'react-query'
import { axiosPrivate } from 'src/utils/api'
import { downloadPrivateFile } from 'src/utils/downloadBlob'
import type {
  ManagementReport,
  StoredManagementReport
} from 'src/types/managementReport'

const REPORT_KEY = 'management-report'

export const useManagementReport = ({
  month,
  profile,
  enabled = true
}: {
  month: string
  profile: 'full' | 'no_amounts'
  enabled?: boolean
}) =>
  useQuery<ManagementReport>(
    [REPORT_KEY, month, profile],
    async () =>
      (
        await axiosPrivate.get<ManagementReport>(
          '/management-reports/monthly',
          {
            params: { month, profile, format: 'json' }
          }
        )
      ).data,
    {
      enabled,
      staleTime: 5 * 60 * 1000,
      retry: false
    }
  )

export const useManagementReportHistory = (enabled = true) =>
  useQuery<StoredManagementReport[]>(
    [REPORT_KEY, 'history'],
    async () =>
      (await axiosPrivate.get<StoredManagementReport[]>('/management-reports'))
        .data,
    {
      enabled,
      staleTime: 60 * 1000,
      retry: false
    }
  )

export const downloadManagementReport = ({
  month,
  profile,
  format
}: {
  month: string
  profile: 'full' | 'no_amounts'
  format: 'pdf' | 'xlsx'
}) =>
  downloadPrivateFile(
    '/management-reports/monthly',
    `reporte-gerencial_${month}_${profile}.${format}`,
    { month, profile, format }
  )

export const downloadStoredManagementReport = ({
  period,
  profile,
  format
}: {
  period: string
  profile: 'full' | 'no_amounts'
  format: 'pdf' | 'xlsx'
}) =>
  downloadPrivateFile(
    `/management-reports/${period}/${format}`,
    `reporte-gerencial_${period}_${profile}.${format}`,
    { profile }
  )

export interface ManagementReportConfig {
  recipients: {
    full: string[]
    no_amounts: string[]
  }
  includeLms: boolean
}

export const useManagementReportConfig = (enabled = true) =>
  useQuery<ManagementReportConfig>(
    [REPORT_KEY, 'config'],
    async () =>
      (
        await axiosPrivate.get<ManagementReportConfig>(
          '/management-reports/config'
        )
      ).data,
    {
      enabled,
      staleTime: 5 * 60 * 1000,
      retry: false
    }
  )

export const saveManagementReportConfig = async (
  values: ManagementReportConfig
) => {
  const { data } = await axiosPrivate.put<ManagementReportConfig>(
    '/management-reports/config',
    values
  )
  return data
}

export const sendManagementReport = async ({
  month,
  profile
}: {
  month: string
  profile: 'full' | 'no_amounts'
}) => {
  const { data } = await axiosPrivate.post('/management-reports/monthly/send', {
    month,
    profile
  })
  return data
}
