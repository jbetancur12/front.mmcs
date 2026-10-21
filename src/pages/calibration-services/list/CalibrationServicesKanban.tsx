import { useEffect, useRef, useState } from 'react'
import { Box, Chip, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { ui } from './calibrationServicesListConstants'
import { CalibrationServicesKanbanColumn } from './calibrationServicesListTypes'
import { getCompactColumnTitle } from './calibrationServicesListUtils'
import CalibrationServiceKanbanCard from './CalibrationServiceKanbanCard'

interface CalibrationServicesKanbanProps {
  columns: CalibrationServicesKanbanColumn[]
  isTechnicalOnlyView: boolean
  openServiceDetail: (serviceId: number) => void
}

/** Vista kanban: columnas por etapa con barra de desplazamiento superior sincronizada. */
const CalibrationServicesKanban = ({
  columns,
  isTechnicalOnlyView,
  openServiceDetail
}: CalibrationServicesKanbanProps) => {
  const kanbanScrollRef = useRef<HTMLDivElement | null>(null)
  const kanbanTopScrollRef = useRef<HTMLDivElement | null>(null)
  const [kanbanScrollWidth, setKanbanScrollWidth] = useState(0)

  useEffect(() => {
    const syncScrollMetrics = () => {
      setKanbanScrollWidth(kanbanScrollRef.current?.scrollWidth || 0)
    }

    syncScrollMetrics()
    window.addEventListener('resize', syncScrollMetrics)

    return () => {
      window.removeEventListener('resize', syncScrollMetrics)
    }
  }, [columns])

  return (
    <Stack spacing={1.25}>
      <Box
        ref={kanbanTopScrollRef}
        onScroll={(event) => {
          if (kanbanScrollRef.current) {
            kanbanScrollRef.current.scrollLeft = event.currentTarget.scrollLeft
          }
        }}
        sx={{
          overflowX: 'auto',
          overflowY: 'hidden',
          height: 12,
          borderRadius: '999px',
          bgcolor: alpha(ui.textSecondary, 0.08),
          '&::-webkit-scrollbar': {
            height: 10
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(ui.textSecondary, 0.28),
            borderRadius: '999px'
          }
        }}
      >
        <Box sx={{ width: Math.max(kanbanScrollWidth, 1), height: 1 }} />
      </Box>
      <Box
        ref={kanbanScrollRef}
        onScroll={(event) => {
          if (kanbanTopScrollRef.current) {
            kanbanTopScrollRef.current.scrollLeft = event.currentTarget.scrollLeft
          }
        }}
        sx={{ overflowX: 'auto', pb: 1 }}
      >
      <Stack
        direction='row'
        spacing={2}
        alignItems='flex-start'
        sx={{ minWidth: 'max-content' }}
      >
        {columns.map((column) => {
          const isEmptyColumn = column.services.length === 0

          return (
          <Box
            key={column.key}
            sx={{
              width: isEmptyColumn ? 172 : 312,
              minWidth: isEmptyColumn ? 172 : 312,
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 220px)',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${alpha(column.accent, 0.14)}`
              }}
            >
              <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='flex-start'
                spacing={1}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant='subtitle1'
                    fontWeight={800}
                    sx={{ color: ui.text, lineHeight: 1.2 }}
                  >
                    {isEmptyColumn
                      ? getCompactColumnTitle(column.title)
                      : column.title}
                  </Typography>
                  {!isEmptyColumn ? (
                    <Typography
                      variant='body2'
                      sx={{ mt: 0.5, color: ui.textSecondary, lineHeight: 1.45 }}
                    >
                      {column.description}
                    </Typography>
                  ) : null}
                </Box>
                <Chip
                  size='small'
                  label={column.services.length}
                  sx={{
                    bgcolor: alpha(column.accent, 0.14),
                    color: column.accent,
                    fontWeight: 800
                  }}
                />
              </Stack>
            </Box>

            <Stack
              spacing={1}
              sx={{
                p: 1.5,
                minHeight: 0,
                flex: 1,
                overflowY: 'auto',
                scrollbarWidth: 'thin'
              }}
            >
              {column.services.length === 0 ? (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '16px',
                    border: `1px dashed ${alpha(column.accent, 0.24)}`,
                    bgcolor: alpha(column.accent, 0.04),
                    minHeight: 72,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Typography
                    variant='caption'
                    sx={{ color: ui.textSecondary, lineHeight: 1.45 }}
                  >
                    Sin servicios.
                  </Typography>
                </Box>
              ) : (
                column.services.map((service) => (
                  <CalibrationServiceKanbanCard
                    key={service.id}
                    service={service}
                    isTechnicalOnlyView={isTechnicalOnlyView}
                    openServiceDetail={openServiceDetail}
                  />
                ))
              )}
            </Stack>
          </Box>
          )
        })}
      </Stack>
      </Box>
    </Stack>
  )
}

export default CalibrationServicesKanban
