import { api } from '../../config'
import { Document, Page, PDFViewer, Text, View } from '@react-pdf/renderer'
import { IconButton } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate, useParams } from 'react-router-dom'

import axios from 'axios'
import { useEffect, useState } from 'react'
import { parseISO } from 'date-fns'
import { styles } from './common/styles'
import { Footer, Header } from './common/pdf'

const apiUrl = api()

const EquipmentInOutPDF: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const [data, setData] = useState<any>(null)
  const navigate = useNavigate()

  const fetchInOutReport = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/dataSheet/${id}/in-out-report`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.statusText === 'OK') {
        setData(response.data)
      }
    } catch (error) {
      console.error('Error fetching dataSheet data:', error)
    }
  }

  useEffect(() => {
    fetchInOutReport()
  }, [id])

  const ContentHeadLines = () => (
    <View style={styles.table}>
      <View style={[styles.tableHeader, styles.bold]}>
        <View style={[styles.tableCell, { width: '3%' }]}>
          <Text>N°</Text>
        </View>
        <View style={[styles.tableCell, { width: '15%' }]}>
          <Text>Equipo</Text>
        </View>
        <View style={[styles.tableCell, { width: '12%' }]}>
          <Text>Código Interno</Text>
        </View>
        <View style={[styles.tableCell, { width: '20%' }]}>
          <Text>Motivo de Salida</Text>
        </View>
        <View style={[styles.tableCell, { width: '10%' }]}>
          <Text>F. Salida</Text>
        </View>
        <View style={[styles.tableCell, { width: '10%' }]}>
          <Text>F. Entrada</Text>
        </View>
        <View style={[styles.tableCell, { width: '15%' }]}>
          <Text>Insp. Visual Salida</Text>
        </View>
        <View style={[styles.tableCell, { width: '15%' }]}>
          <Text>Insp. Visual Entrada</Text>
        </View>
      </View>
    </View>
  )

  if (!data) return <div>Loading...</div>

  const ContentRows = () =>
    data.equipmentInOutRecords.map((item: any, index: number) => {
      const {
        outReason,

        visualOutInspection,
        visualInInspection
      } = item
      const date1 = parseISO(item.outDate)
      const date2 = parseISO(item.inDate)

      return (
        <View key={index} style={styles.table} wrap={true}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCellRow, { width: '3%' }]}>
              <Text>{index + 1}</Text>
            </View>
            <View style={[styles.tableCellRow, { width: '15%' }]}>
              <Text>{data.equipmentName}</Text>
            </View>
            <View style={[styles.tableCellRow, { width: '12%' }]}>
              <Text>{data.internalCode}</Text>
            </View>
            <View style={[styles.tableCellRow, { width: '20%' }]}>
              <Text>{outReason}</Text>
            </View>
            <View style={[styles.tableCellRow, { width: '10%' }]}>
              <Text>{new Date(date1).toLocaleDateString()}</Text>
            </View>
            <View style={[styles.tableCellRow, { width: '10%' }]}>
              <Text>{new Date(date2).toLocaleDateString()}</Text>
            </View>
            <View style={[styles.tableCellRow, { width: '15%' }]}>
              <Text>{visualOutInspection}</Text>
            </View>
            <View style={[styles.tableCellRow, { width: '15%' }]}>
              <Text>{visualInInspection}</Text>
            </View>
          </View>
        </View>
      )
    })

  return (
    <div>
      <IconButton
        onClick={() => navigate(`/datasheets/${id}/in-out`)}
        sx={{ mb: 2 }}
      >
        <ArrowBackIcon />
      </IconButton>

      <PDFViewer width='100%' height='1000' className='app'>
        <Document>
          <Page
            size='A4'
            style={styles.page}
            wrap={true}
            orientation='landscape'
          >
            <Header code='FOT-MMCS-12' version='02' date='2017-12-05' />
            <View style={styles.content}>
              <ContentHeadLines />
              <ContentRows />
            </View>
            <Footer />
          </Page>
        </Document>
      </PDFViewer>
    </div>
  )
}

export default EquipmentInOutPDF
