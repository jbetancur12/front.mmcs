import React from 'react'
import { Container, Paper } from '@mui/material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'

interface PurchasesPageProps {
  title: string
  subtitle: string
  icon: React.ReactElement
  actions?: React.ReactNode
  /** Tarjetas de indicadores (LmsStatCard) que van entre el encabezado y la tabla. */
  stats?: React.ReactNode
  children: React.ReactNode
}

/**
 * Marco común de las pantallas del módulo de Compras: mismo encabezado,
 * indicadores y tabla sobre papel que el listado de Clientes.
 */
const PurchasesPage: React.FC<PurchasesPageProps> = ({
  title,
  subtitle,
  icon,
  actions,
  stats,
  children
}) => (
  <Container maxWidth='xl' sx={{ py: 3 }}>
    <LmsPageHeader
      title={title}
      subtitle={subtitle}
      icon={icon}
      actions={actions}
    />
    {stats}
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {children}
    </Paper>
  </Container>
)

export default PurchasesPage
