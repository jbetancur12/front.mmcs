import React, { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import useAxiosPrivate from '@utils/use-axios-private'

type RawLog = {
  method: string
  route: string
  requests: string
  totalIncoming: string
  totalOutgoing: string
  total: string
}

type BandwidthStatsResponse = {
  totalInMB: {
    totalMB: string
    incomingMB: string
    outgoingMB: string
  }
  logs: RawLog[]
}

const BandwidthStats: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [data, setData] = useState<BandwidthStatsResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    axiosPrivate
      .get<BandwidthStatsResponse>('bandwidth-logs')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' mt={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (!data) return null

  const groupLogsByRoute = (logs: RawLog[]) => {
    const grouped: Record<string, RawLog[]> = {}
    logs.forEach((log) => {
      if (!grouped[log.route]) grouped[log.route] = []
      grouped[log.route].push(log)
    })
    return grouped
  }

  const groupedLogs = groupLogsByRoute(data.logs)

  const formatBytes = (bytes: string | number) =>
    (Number(bytes) / 1024 / 1024).toFixed(2) + ' MB'

  return (
    <Box p={4}>
      <Typography variant='h4' gutterBottom>
        Bandwidth Stats
      </Typography>

      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant='h6'>Total Incoming</Typography>
              <Typography>{data.totalInMB.incomingMB} MB</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant='h6'>Total Outgoing</Typography>
              <Typography>{data.totalInMB.outgoingMB} MB</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant='h6'>Total Transfer</Typography>
              <Typography>{data.totalInMB.totalMB} MB</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {Object.entries(groupedLogs).map(([route, methods]) => (
        <Accordion key={route}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant='subtitle1'>{route}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Method</TableCell>
                  <TableCell>Requests</TableCell>
                  <TableCell>Incoming</TableCell>
                  <TableCell>Outgoing</TableCell>
                  <TableCell>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {methods.map((m) => (
                  <TableRow key={m.method}>
                    <TableCell>{m.method}</TableCell>
                    <TableCell>{m.requests}</TableCell>
                    <TableCell>{formatBytes(m.totalIncoming)}</TableCell>
                    <TableCell>{formatBytes(m.totalOutgoing)}</TableCell>
                    <TableCell>{formatBytes(m.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}

export default BandwidthStats
