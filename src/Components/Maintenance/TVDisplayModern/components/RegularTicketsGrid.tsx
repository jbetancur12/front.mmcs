import React from 'react'
import { Grid, Card, CardContent, Box, Typography } from '@mui/material'
import { AccessTime, Handyman as HandymanIcon } from '@mui/icons-material' // Añadir HandymanIcon
import { RegularTicketsGridProps } from '../types'
import { useModernStyles } from '../hooks/useModernStyles'
import MaintenancePriorityBadge from '../../MaintenancePriorityBadge'
import MaintenanceStatusBadge from '../../MaintenanceStatusBadge'

const RegularTicketsGrid: React.FC<RegularTicketsGridProps> = ({
  tickets,
  gridCalculation,
  colors,
  getElapsedTime
}) => {
  const { cardStyles } = useModernStyles()

  if (!tickets || tickets.length === 0) {
    // ... (código de no tickets)
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography
          variant='h6'
          sx={{
            color: colors.textSecondary,
            fontWeight: 500
          }}
        >
          No hay tickets regulares para mostrar
        </Typography>
      </Box>
    )
  }

  return (
    <Grid
      container
      spacing={gridCalculation?.cardSpacing ? gridCalculation.cardSpacing / 8 : 1}
      sx={{
        height: '100%',
        overflow: 'hidden',
        margin: 0,
        width: '100%'
      }}
    >

    {tickets.map((ticket) => {
        // Lógica condicional para el Técnico
        const technicianName = ticket.assignedTechnician?.name || 'Sin asignar'
        const isAssigned = technicianName !== 'Sin asignar'
        const requiresTechnicalReport = Boolean(ticket.requiresTechnicalReport)
        
        return (
        <Grid
          item
          xs={gridCalculation ? 12 / gridCalculation.columns : 3}
          key={ticket.id}
          sx={{
            height: gridCalculation ? `${gridCalculation.cardHeight}px` : 'auto',
            display: 'flex'
          }}
        >
        <Card
          sx={{
            ...cardStyles.base,
            ...cardStyles.regular,
              ...(requiresTechnicalReport && {
                border: `2px solid ${colors.warning}`,
                backgroundColor: 'rgba(255, 193, 7, 0.06)',
                boxShadow: '0 4px 16px rgba(255, 193, 7, 0.18)',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '6px',
                  backgroundColor: colors.warning,
                  borderTopLeftRadius: '12px',
                  borderBottomLeftRadius: '12px'
                }
              }),
            width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
          <CardContent sx={{
              p: 0.875,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              '&:last-child': { pb: 0.875 }
          }}>
              
              {/* 1. HEADER: CÓDIGO Y PRIORIDAD */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.35 }}>
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 800,
                    color: colors.primary,
                    fontSize: '1rem',
                    lineHeight: 1.2
                  }}
                >
                  {ticket.ticketCode}
                </Typography>
              <MaintenancePriorityBadge priority={ticket.priority} size='small' />
            </Box>

            {/* 2. TÍTULO PRINCIPAL: TIPO DE EQUIPO */}
            <Typography
              variant='subtitle1' // Usar un tamaño más grande
              sx={{
                color: colors.textPrimary,
                mb: 0.35,
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                fontSize: '0.95rem',
                lineHeight: 1.2
              }}
            >
              {ticket.equipmentType}
              </Typography>

              {/* 3. INFORMACIÓN SECUNDARIA: CLIENTE */}
              <Typography
                variant='body2'
              sx={{
                color: colors.textSecondary, // Color neutro para el cliente
                  mb: 0.35,
                fontWeight: 500, // Menos negrita
                  fontSize: '0.78rem',
                  lineHeight: 1.15,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
              }}
            >
              Cliente: {ticket.customerName || 'NA'}
              </Typography>

              {/* 4. GRUPO: TÉCNICO Y MODELO (USANDO BOX FLEX) */}
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', mt: 0.25, mb: 0.5, minWidth: 0 }}>
                
                {/* Técnico con resaltado condicional y BOX para el padding/fondo */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: !isAssigned ? `${colors.warning}35` : 'transparent',
                  padding: !isAssigned ? '2px 6px' : 0,
                  borderRadius: '4px',
                    mr: 0,
                    minWidth: 0,
                    mb: 0
                }}
              >
                  <HandymanIcon 
                    sx={{ 
                      fontSize: '0.8rem', 
                      mr: 0.5, 
                      color: !isAssigned ? colors.warning : colors.primary 
                    }} 
                  />
                  <Typography
                    variant='body2'
                    sx={{
                    color: !isAssigned ? colors.warning : colors.textPrimary, // Color condicional
                    fontWeight: 700,
                      fontSize: '0.78rem',
                      lineHeight: 1.15,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                  }}
                >
                  Técnico: {technicianName}
                  </Typography>
                </Box>

                {/* Equipo / Modelo: Información menos crítica */}
{/*                 <Typography
                  variant='body2'
                  sx={{
                    color: colors.textSecondary,
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    lineHeight: 1.2,
                    borderLeft: '1px solid',
                    borderColor: colors.border || 'rgba(0, 0, 0, 0.1)',
                    pl: 2,
                    mb: 0.5
                  }}
                >
                  Equipo: {ticket.equipmentBrand} {ticket.equipmentModel}
                </Typography> */}
              </Box>

              {/* 5. FOOTER: ESTADO Y TIEMPO */}
              <Box sx={{ mt: 'auto', pt: 0.35 }}>
                <Box sx={{ mb: 0.35 }}>
                  {/* Mantenemos el badge de estado */}
                  <MaintenanceStatusBadge status={ticket.status} size='small' />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.35 }}>
                  {/* Icono y tiempo */}
                  <AccessTime sx={{ color: colors.textSecondary, fontSize: '0.8rem', flexShrink: 0 }} />
                  <Typography
                    variant='body2'
                    sx={{
                      color: colors.textSecondary,
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      lineHeight: 1.1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Abierto hace: {getElapsedTime(ticket.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )})}
    </Grid>
  )
}

export default RegularTicketsGrid
