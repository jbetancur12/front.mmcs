import React from 'react'
import {
  Container,
  Grid,
  Paper,
  Box,
  Skeleton,
  Divider
} from '@mui/material'

/**
 * TicketDetailsSkeleton component displays a loading skeleton for the ticket details page
 * Matches the layout of MaintenanceTicketDetails component
 */
const TicketDetailsSkeleton: React.FC = () => {
  return (
    <Container maxWidth={false} sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box mb={{ xs: 2, sm: 3 }}>
        <Box
          display='flex'
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={{ xs: 2, sm: 0 }}
        >
          <Box display='flex' alignItems='center' gap={{ xs: 1, sm: 2 }} width={{ xs: '100%', sm: 'auto' }}>
            <Skeleton
              variant='circular'
              width={48}
              height={48}
              animation='wave'
            />
            <Box flex={1}>
              <Skeleton
                variant='text'
                width='60%'
                height={40}
                sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
                animation='wave'
              />
              <Skeleton
                variant='text'
                width='80%'
                height={24}
                animation='wave'
              />
            </Box>
          </Box>

          <Box display='flex' gap={{ xs: 0.5, sm: 1 }} alignItems='center' flexWrap='wrap'>
            <Skeleton
              variant='circular'
              width={48}
              height={48}
              animation='wave'
            />
            <Skeleton
              variant='rounded'
              width={120}
              height={48}
              animation='wave'
            />
            <Skeleton
              variant='rounded'
              width={100}
              height={48}
              animation='wave'
            />
          </Box>
        </Box>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          {/* Ticket Status and Priority */}
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
            <Box
              display='flex'
              flexDirection={{ xs: 'column', sm: 'row' }}
              justifyContent='space-between'
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              mb={2}
              gap={{ xs: 1, sm: 0 }}
            >
              <Skeleton
                variant='text'
                width={180}
                height={32}
                animation='wave'
              />
              <Box display='flex' gap={1}>
                <Skeleton
                  variant='rounded'
                  width={100}
                  height={32}
                  animation='wave'
                />
                <Skeleton
                  variant='rounded'
                  width={100}
                  height={32}
                  animation='wave'
                />
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Skeleton
                  variant='text'
                  width='40%'
                  height={20}
                  animation='wave'
                />
                <Skeleton
                  variant='text'
                  width='80%'
                  height={24}
                  animation='wave'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Skeleton
                  variant='text'
                  width='50%'
                  height={20}
                  animation='wave'
                />
                <Skeleton
                  variant='text'
                  width='80%'
                  height={24}
                  animation='wave'
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Customer Information */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box
              display='flex'
              justifyContent='space-between'
              alignItems='center'
              mb={2}
            >
              <Skeleton
                variant='text'
                width={200}
                height={32}
                animation='wave'
              />
              <Box display='flex' gap={1}>
                <Skeleton
                  variant='circular'
                  width={32}
                  height={32}
                  animation='wave'
                />
                <Skeleton
                  variant='circular'
                  width={32}
                  height={32}
                  animation='wave'
                />
              </Box>
            </Box>

            <Grid container spacing={3}>
              {[1, 2, 3, 4].map((item) => (
                <Grid item xs={12} md={6} key={item}>
                  <Box display='flex' alignItems='center' gap={1} mb={1}>
                    <Skeleton
                      variant='circular'
                      width={24}
                      height={24}
                      animation='wave'
                    />
                    <Skeleton
                      variant='text'
                      width='40%'
                      height={20}
                      animation='wave'
                    />
                  </Box>
                  <Skeleton
                    variant='text'
                    width='80%'
                    height={24}
                    animation='wave'
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Equipment Information */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box display='flex' alignItems='center' gap={1} mb={2}>
              <Skeleton
                variant='circular'
                width={24}
                height={24}
                animation='wave'
              />
              <Skeleton
                variant='text'
                width={200}
                height={32}
                animation='wave'
              />
            </Box>

            <Grid container spacing={3}>
              {[1, 2, 3, 4].map((item) => (
                <Grid item xs={12} md={6} key={item}>
                  <Box mb={2}>
                    <Skeleton
                      variant='text'
                      width='50%'
                      height={20}
                      animation='wave'
                    />
                    <Skeleton
                      variant='text'
                      width='70%'
                      height={24}
                      animation='wave'
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Issue Description */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box display='flex' alignItems='center' gap={1} mb={2}>
              <Skeleton
                variant='circular'
                width={24}
                height={24}
                animation='wave'
              />
              <Skeleton
                variant='text'
                width={220}
                height={32}
                animation='wave'
              />
            </Box>
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200'
              }}
            >
              <Skeleton
                variant='text'
                width='100%'
                height={20}
                animation='wave'
              />
              <Skeleton
                variant='text'
                width='95%'
                height={20}
                animation='wave'
              />
              <Skeleton
                variant='text'
                width='85%'
                height={20}
                animation='wave'
              />
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Assigned Technician */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box display='flex' alignItems='center' gap={1} mb={2}>
              <Skeleton
                variant='circular'
                width={24}
                height={24}
                animation='wave'
              />
              <Skeleton
                variant='text'
                width={150}
                height={32}
                animation='wave'
              />
            </Box>

            <Box display='flex' alignItems='center' gap={2} mb={2}>
              <Skeleton
                variant='circular'
                width={56}
                height={56}
                animation='wave'
              />
              <Box flex={1}>
                <Skeleton
                  variant='text'
                  width='80%'
                  height={24}
                  animation='wave'
                />
                <Skeleton
                  variant='text'
                  width='60%'
                  height={20}
                  animation='wave'
                />
                <Skeleton
                  variant='text'
                  width='50%'
                  height={16}
                  animation='wave'
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Skeleton
                  variant='text'
                  width='80%'
                  height={20}
                  animation='wave'
                />
                <Skeleton
                  variant='text'
                  width='60%'
                  height={24}
                  animation='wave'
                />
              </Grid>
              <Grid item xs={6}>
                <Skeleton
                  variant='text'
                  width='80%'
                  height={20}
                  animation='wave'
                />
                <Skeleton
                  variant='text'
                  width='60%'
                  height={24}
                  animation='wave'
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Schedule */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box display='flex' alignItems='center' gap={1} mb={2}>
              <Skeleton
                variant='circular'
                width={24}
                height={24}
                animation='wave'
              />
              <Skeleton
                variant='text'
                width={120}
                height={32}
                animation='wave'
              />
            </Box>

            <Box display='flex' alignItems='center' gap={1} mb={1}>
              <Skeleton
                variant='circular'
                width={20}
                height={20}
                animation='wave'
              />
              <Skeleton
                variant='text'
                width='60%'
                height={20}
                animation='wave'
              />
            </Box>
            <Skeleton
              variant='text'
              width='80%'
              height={24}
              animation='wave'
            />
          </Paper>

          {/* Costs */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box display='flex' alignItems='center' gap={1} mb={2}>
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

            <Grid container spacing={2}>
              {[1, 2].map((item) => (
                <Grid item xs={12} key={item}>
                  <Box mb={2}>
                    <Skeleton
                      variant='text'
                      width='60%'
                      height={20}
                      animation='wave'
                    />
                    <Skeleton
                      variant='text'
                      width='80%'
                      height={32}
                      animation='wave'
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Quick Actions */}
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display='flex' alignItems='center' gap={1} mb={2}>
              <Skeleton
                variant='circular'
                width={24}
                height={24}
                animation='wave'
              />
              <Skeleton
                variant='text'
                width={140}
                height={32}
                animation='wave'
              />
            </Box>

            <Box display='flex' flexDirection='column' gap={1}>
              {[1, 2, 3, 4].map((item) => (
                <Skeleton
                  key={item}
                  variant='rounded'
                  width='100%'
                  height={36}
                  animation='wave'
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default TicketDetailsSkeleton
