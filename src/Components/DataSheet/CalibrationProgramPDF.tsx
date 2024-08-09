import {
  Image,
  Page,
  PDFViewer,
  StyleSheet,
  Text,
  View,
  Document
} from '@react-pdf/renderer'
import axios from 'axios'

import { useEffect, useState } from 'react'

import { createTw } from 'react-pdf-tailwind'
import { api } from '../../config'

import { differenceInDays, parseISO } from 'date-fns'
import { IconButton } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate } from 'react-router-dom'

interface CalibrationProgram {
  id: number
  date: string // Puedes usar Date si prefieres trabajar con objetos de fecha
  calibrationDate: string
  nextCalibrationDate: string
  comments: string
  verifiedBy: string
  dataSheet: DataSheet
  certificateNumber: string
}

export interface DataSheet {
  id: number
  equipmentName: string
  internalCode: string
  serviceType: string // Aquí se usa el tipo definido
  calibrationProvider: string
  calibrationCycle: string
}

const mainColor = '#9CF08B'
const apiUrl = api()
const CalibrationProgramPDF = () => {
  const navigate = useNavigate()
  const [dataSheets, setDataSheets] = useState<Record<any, any> | null>(null)

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
      flexBasis: '50%', // Cambia a 33.33% para tres columnas, 25% para cuatro columnas, etc.
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
      fontWeight: 900,
      textTransform: 'uppercase'
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
      flexDirection: 'row',
      marginBottom: 5,
      justifyContent: 'space-between',
      gap: 20
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

  const fetchCalibrationProgram = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/calibration/calibration-program`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      )

      if (response.statusText === 'OK') {
        setDataSheets(response.data)
      }
    } catch (error) {
      console.error('Error fetching dataSheet data:', error)
    }
  }

  useEffect(() => {
    fetchCalibrationProgram()
  }, [])

  const Header = () => (
    <View style={tw('border border-black flex flex-row mb-10')} fixed>
      <View style={[styles.width25, tw('border-r'), styles.bold]}>
        <Text style={[tw('border-b px-1 text-xs py-1')]}>
          CÓDIGO: FOT-MMCS-17
        </Text>
        <Text style={[tw('border-b px-1 py-1 text-xs ')]}>VERSIÓN: 02</Text>
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
          PROGRAMA DE CALIBRACIÓN
        </Text>
      </View>
      <View style={styles.width25}>
        <Image
          style={[tw('top-2 p-2 left-10'), styles.widthLogo]}
          src='/images/logo2.png'
        ></Image>
      </View>
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

  const ContentHeadLines = () => (
    <View style={styles.table}>
      <View style={[styles.tableHeader, styles.bold]}>
        <View style={styles.tableCell}>
          <Text>Código Equipo</Text>
        </View>
        <View style={styles.tableCell}>
          <Text>Nombre Equipo</Text>
        </View>
        <View style={styles.tableCell}>
          <Text>Ciclo de {'\n'}Calibración</Text>
        </View>
        <View style={styles.tableCell}>
          <Text>Última {'\n'}Calibración</Text>
        </View>
        <View style={styles.tableCell}>
          <Text>Próxima {'\n'}Calibración</Text>
        </View>
        <View style={styles.tableCell}>
          <Text>N° Certificado</Text>
        </View>
        <View style={styles.tableCell}>
          <Text>Vencimiento</Text>
        </View>
        <View style={styles.tableCell}>
          <Text>Proveedor</Text>
        </View>
        <View style={styles.tableCell}>
          <Text>Tipo de {'\n'}Servicio</Text>
        </View>
      </View>
    </View>
  )

  const ContentRows = () =>
    dataSheets &&
    dataSheets.map((item: CalibrationProgram) => {
      const {
        id,
        dataSheet,
        calibrationDate,
        nextCalibrationDate,
        certificateNumber
      } = item
      const date1 = parseISO(calibrationDate)
      const date2 = parseISO(nextCalibrationDate)
      const daysDifference = differenceInDays(date2, date1)
      return (
        <View key={id} style={styles.table} wrap={true}>
          <View style={styles.tableRow}>
            <View style={styles.tableCellRow}>
              <Text>{dataSheet.internalCode}</Text>
            </View>
            <View style={styles.tableCellRow}>
              <Text>{dataSheet.equipmentName}</Text>
            </View>
            <View style={styles.tableCellRow}>
              <Text>{dataSheet.calibrationCycle}</Text>
            </View>
            <View style={styles.tableCellRow}>
              <Text>{new Date(calibrationDate).toLocaleDateString()}</Text>
            </View>
            <View style={styles.tableCellRow}>
              <Text>{new Date(nextCalibrationDate).toLocaleDateString()}</Text>
            </View>
            <View style={styles.tableCellRow}>
              <Text>{certificateNumber}</Text>
            </View>
            <View
              style={[
                styles.tableCellRow,
                daysDifference < 30 ? styles.outOfDate : styles.updated
              ]}
            >
              <Text>{daysDifference}</Text>
            </View>
            <View style={styles.tableCellRow}>
              <Text>{dataSheet.calibrationProvider}</Text>
            </View>
            <View style={styles.tableCellRow}>
              <Text>{dataSheet.serviceType}</Text>
            </View>
          </View>
        </View>
      )
    })

  return (
    <div>
      <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        <ArrowBackIcon />
      </IconButton>
      <PDFViewer width='100%' height='1000' className='app'>
        <Document title='Programa de Calibración' author='Metromedics'>
          <Page
            size='A4'
            style={styles.page}
            wrap={true}
            orientation='landscape'
          >
            <Header />
            <ContentHeadLines />
            {dataSheets && (
              <View style={styles.content}>
                <ContentRows />
              </View>
            )}
            <Footer />
          </Page>
        </Document>
      </PDFViewer>
    </div>
  )
}

export default CalibrationProgramPDF
