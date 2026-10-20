import { Box, Tooltip } from '@mui/material'
import { ReactElement, ReactNode } from 'react'
import { DetailTab } from './calibrationServiceDetailUtils'

export const BlockedActionTooltip = ({
  reason,
  children
}: {
  reason: string | null
  children: ReactElement
}) =>
  reason ? (
    <Tooltip title={reason} arrow enterTouchDelay={0}>
      <span>{children}</span>
    </Tooltip>
  ) : (
    children
  )

export const DetailTabPanel = ({
  value,
  tab,
  children
}: {
  value: DetailTab
  tab: DetailTab
  children: ReactNode
}) => {
  if (value !== tab) {
    return null
  }

  return <Box sx={{ pt: 3 }}>{children}</Box>
}
