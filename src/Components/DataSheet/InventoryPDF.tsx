import { Document, Page, PDFViewer, Text, View } from '@react-pdf/renderer'
import { IconButton } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'
import { DataSheetData } from './ListDataSheet'

import { Footer, Header } from './common/pdf'
import { styles, tw } from './common/styles'

const InventoryPDF = () => {
  const navigate = useNavigate()

  const state = useLocation().state as DataSheetData[]

  const Content = () => (
    <View style={tw('text-sm')}>
      <View style={tw('flex-row')}>
        <Text style={[styles.cell, styles.names, { width: '4%' }]}>N°</Text>

        <Text style={[styles.cell, styles.names, { width: '15%' }]}>
          Código Interno
        </Text>
        <Text style={[styles.cell, styles.names, { width: '20%' }]}>
          Nombre Equipo
        </Text>
        <Text style={[styles.cell, styles.names, { width: '10%' }]}>Marca</Text>
        <Text style={[styles.cell, styles.names, { width: '15%' }]}>
          Modelo
        </Text>
        <Text style={[styles.cell, styles.names, { width: '15%' }]}>
          N° Serie
        </Text>
        <Text style={[styles.cell, styles.names, { width: '25%' }]}>Tipo</Text>
      </View>
      {state.map((equipment: any, index: number) => (
        <View key={index} style={[tw('flex-row my-2 '), styles.row1]}>
          <Text style={[styles.rowInventory, styles.names, { width: '4%' }]}>
            {index + 1}
          </Text>

          <Text style={[styles.rowInventory, styles.names, { width: '15%' }]}>
            {equipment.internalCode}
          </Text>
          <Text style={[styles.rowInventory, styles.names, { width: '20%' }]}>
            {equipment.equipmentName}
          </Text>
          <Text style={[styles.rowInventory, styles.names, { width: '10%' }]}>
            {equipment.brand}
          </Text>
          <Text style={[styles.rowInventory, styles.names, { width: '15%' }]}>
            {equipment.model}
          </Text>
          <Text style={[styles.rowInventory, styles.names, { width: '15%' }]}>
            {equipment.serialNumber}
          </Text>
          <Text style={[styles.rowInventory, styles.names, { width: '25%' }]}>
            {equipment.serviceType}
          </Text>
        </View>
      ))}
    </View>
  )

  return (
    <div>
      <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        <ArrowBack />
      </IconButton>
      <PDFViewer width='100%' height='1000' className='app'>
        <Document>
          <Page
            size='A4'
            style={styles.page}
            wrap={true}
            orientation='landscape'
          >
            <Header code='FOT-MMCS-01' version='03' date='2017-12-05' />
            <Content />
            <Footer />
          </Page>
        </Document>
      </PDFViewer>
    </div>
  )
}

export default InventoryPDF
