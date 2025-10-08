import React from 'react'
import {
  Card,
  CardContent,
  Box,
  Skeleton,
  useMediaQuery,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid
} from '@mui/material'
import { ExpandMore } from '@mui/icons-material'

/**
 * FiltersSkeleton component displays a loading skeleton for the filters section
 * Matches the layout of MaintenanceFilters component
 */
const FiltersSkeleton: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Mobile version - Accordion style
  if (isMobile) {
    return (
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-label='Cargando filtros'
        >
          <Box display='flex' alignItems='center' gap={1} width='100%'>
            <Skeleton
              variant='circular'
              width={24}
              height={24}
              animation='wave'
            />
            <Skeleton
              variant='text'
              width={80}
              height={28}
              animation='wave'
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Skeleton
                variant='rounded'
                width='100%'
                height={40}
                animation='wave'
              />
            </Grid>
            <Grid item xs={12}>
              <Skeleton
                variant='rounded'
                width='100%'
                height={40}
                animation='wave'
              />
            </Grid>
            <Grid item xs={12}>
              <Skeleton
                variant='rounded'
                width='100%'
                height={40}
                animation='wave'
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    )
  }

  // Desktop version - Card style
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={2}
        >
          <Box display='flex' alignItems='center' gap={1}>
            <Skeleton
              variant='circular'
              width={24}
              height={24}
              animation='wave'
            />
            <Skeleton
              variant='text'
              width={100}
              height={32}
              animation='wave'
            />
          </Box>
          <Skeleton
            variant='circular'
            width={32}
            height={32}
            animation='wave'
          />
        </Box>

        {/* Quick Search */}
        <Box mb={2}>
          <Skeleton
            variant='rounded'
            width='100%'
            height={40}
            animation='wave'
          />
        </Box>

        {/* Filter Fields */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Skeleton
              variant='rounded'
              width='100%'
              height={40}
              animation='wave'
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Skeleton
              variant='rounded'
              width='100%'
              height={40}
              animation='wave'
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Skeleton
              variant='rounded'
              width='100%'
              height={40}
              animation='wave'
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Skeleton
              variant='rounded'
              width='100%'
              height={40}
              animation='wave'
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default FiltersSkeleton
