import { createTw } from 'react-pdf-tailwind'

import {
  Document,
  Image,
  Page,
  PDFViewer,
  StyleSheet,
  Text,
  View
} from '@react-pdf/renderer'
import { IconButton } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'
import { DataSheetData } from './ListDataSheet'

const mainColor = '#9CF08B'

const InventoryPDF = () => {
  const navigate = useNavigate()

  const state = useLocation().state as DataSheetData[]

  const tw = createTw({
    theme: {
      extend: {
        colors: {
          custom: '#bada55'
        }
      }
    }
  })

  const styles = StyleSheet.create({
    updated: {
      backgroundColor: mainColor
    },
    outOfDate: {
      backgroundColor: '#f44336'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: 10
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: mainColor,
      color: '#000'
    },
    tableCell: {
      border: '1px solid black',
      padding: 5,
      textAlign: 'center',
      fontWeight: 'bold',
      flex: 1,
      minHeight: 30,
      alignItems: 'center',
      justifyContent: 'center',
      display: 'flex'
    },
    tableRow: {
      flexDirection: 'row'
    },
    tableCellRow: {
      border: '1px solid black',
      padding: 5,
      textAlign: 'center',
      minHeight: 30,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      display: 'flex'
    },
    column1: {
      flexBasis: '50%', // Cambia a 33.34% para tres columnas, 25% para cuatro columnas, etc.
      padding: 1
    },
    row1: {
      display: 'flex',
      flexDirection: 'row',
      marginBottom: 5,
      justifyContent: 'space-between',
      gap: 0
    },
    names: {
      fontFamily: 'Helvetica-Bold',
      fontWeight: 200

      // textTransform: 'uppercase'
    },
    cell: {
      border: '1px solid black',
      padding: '3 1 0 4',
      margin: 2,
      textAlign: 'center',
      backgroundColor: mainColor
    },
    cellRow: {
      minHeight: 30,
      padding: '3 1 0 4',
      margin: 2,
      textAlign: 'center'
    },
    page: {
      fontSize: 11,
      paddingTop: 20,
      paddingLeft: 20,
      paddingRight: 20,
      lineHeight: 1.5,
      flexDirection: 'column'
    },
    header: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#000',
      paddingBottom: 10
    },
    headerLeft: {
      width: '25%',
      borderRightWidth: 1,
      borderRightColor: '#000',
      paddingRight: 5
    },
    headerCenter: {
      width: '50%',
      alignItems: 'center'
    },
    headerRight: {
      width: '25%',
      paddingLeft: 5
    },
    sectionTitle: {
      backgroundColor: mainColor,
      color: '#fff',
      textAlign: 'center',
      padding: 5,
      marginTop: 10
    },
    bold: {
      fontFamily: 'Helvetica-Bold',
      fontWeight: 900
    },
    sectionContent: {
      padding: 5,
      marginTop: 5,
      marginBottom: 10
    },
    row: {
      border: '1px solid black',
      padding: '3 1 0 4',
      margin: '0 2',
      fontSize: 9,
      // fontWeight: 'bold',

      // // alignItems: 'center',

      display: 'flex'
    },
    columnL: {
      flex: 1,
      flexDirection: 'column'
    },
    columnR: {
      flex: 1,
      flexDirection: 'column'
    },
    label: {
      fontFamily: 'Helvetica-Bold',
      fontWeight: 900,
      padding: '5 4 0 5',
      width: '60%',
      fontSize: 10
    },
    flexLabel: {
      flex: 1
    },
    flexValue: {
      flex: 4.3
    },
    value: {
      borderWidth: 1,
      borderColor: 'black',
      padding: '4 5 0 5',
      width: '80%',
      fontWeight: 'normal',
      fontSize: 9
    },
    width25: {
      width: '25%'
    },
    width50: {
      width: '50%'
    },
    widthLogo: {
      width: 130,
      marginLeft: 0
    },
    footer: {
      marginBottom: 20,
      marginTop: 20,
      bottom: 0,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: 8
    },
    content: {
      flexGrow: 1,
      marginBottom: 20
    }
  })

  const Header = () => (
    <View style={tw('border border-black flex flex-row mb-10')} fixed>
      <View style={[styles.width25, tw('border-r'), styles.bold]}>
        <Text style={[tw('border-b px-1 text-xs py-1')]}>
          CÓDIGO: FOT-MMCS-01
        </Text>
        <Text style={[tw('border-b px-1 py-1 text-xs ')]}>VERSIÓN: 03</Text>
        <Text style={[tw('border-b px-1 text-xs py-1')]}>
          FECHA: 2017-12-05
        </Text>
        <Text
          style={[tw('px-1 text-xs py-1')]}
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          }
        />
      </View>
      <View
        style={[
          styles.width50,
          tw('border-r flex justify-center'),
          styles.bold
        ]}
      >
        <Text style={[tw('text-center top-1')]}>METROMEDICS</Text>
        <Text style={tw('border-b mt-2')}></Text>
        <Text style={[tw('text-center text-sm top-1'), styles.bold]}>
          INVENTARIO METROLOGICO
        </Text>
      </View>
      <View style={styles.width25}>
        <Image
          style={[tw('top-2 p-2 left-2'), styles.widthLogo]}
          src='/images/logo2.png'
        ></Image>
      </View>
    </View>
  )

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
          <Text style={[styles.row, styles.names, { width: '4%' }]}>
            {index + 1}
          </Text>

          <Text style={[styles.row, styles.names, { width: '15%' }]}>
            {equipment.internalCode}
          </Text>
          <Text style={[styles.row, styles.names, { width: '20%' }]}>
            {equipment.equipmentName}
          </Text>
          <Text style={[styles.row, styles.names, { width: '10%' }]}>
            {equipment.brand}
          </Text>
          <Text style={[styles.row, styles.names, { width: '15%' }]}>
            {equipment.model}
          </Text>
          <Text style={[styles.row, styles.names, { width: '15%' }]}>
            {equipment.serialNumber}
          </Text>
          <Text style={[styles.row, styles.names, { width: '25%' }]}>
            {equipment.serviceType}
          </Text>
        </View>
      ))}
    </View>
  )

  const Footer = () => (
    <View style={[styles.footer, styles.bold]} fixed>
      <Text style={tw('text-center')}>
        Metromedics S.A.S Nit. 900.816.433-3 Dosquebradas - Risaralda
      </Text>
      <Text style={tw('text-center')}>
        Contáctenos: 3113441682 - (606) 3256584 comercial@metromedicslab.com.co
      </Text>
      <Text style={tw('text-center')}>www.metromedics.co</Text>
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
            <Header />
            <Content />
            <Footer />
          </Page>
        </Document>
      </PDFViewer>
    </div>
  )
}

export default InventoryPDF
