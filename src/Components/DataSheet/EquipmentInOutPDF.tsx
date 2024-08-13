import { createTw } from 'react-pdf-tailwind'
import { api } from '../../config'
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate, useParams } from 'react-router-dom'

import axios from 'axios'
import { useEffect, useState } from 'react'
import { parseISO } from 'date-fns'

const mainColor = '#9CF08B'
const apiUrl = api()

const EquipmentInOutPDF: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const [data, setData] = useState<any>(null)
  const navigate = useNavigate()
  const tw = createTw({
    theme: {
      // fontFamily: {
      //   sans: ['Comic Sans', 'Comic Sans Bold']
      // },
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
      //   flex: 1,
      minHeight: 30,
      alignItems: 'center',
      justifyContent: 'center',
      display: 'flex',
      width: '100%'
    },
    tableRow: {
      flexDirection: 'row'
    },
    tableCellRow: {
      border: '1px solid black',
      padding: 5,
      textAlign: 'center',
      minHeight: 30,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      display: 'flex'
    },
    column1: {
      flex: 1,
      flexDirection: 'column',
      marginRight: 10
    },
    column2: {
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
    label1: {
      fontFamily: 'Helvetica-Bold',
      fontWeight: 900,
      padding: '5 4 0 5',
      width: '100%',
      fontSize: 10
    },
    labelx: {
      padding: '2 5 0 5',
      fontWeight: 'bold',
      width: '30%'
    },
    value: {
      borderWidth: 1,
      borderColor: 'black',
      padding: '4 5 0 5',
      width: '80%',
      fontWeight: 'normal',
      fontSize: 9
    },
    value1: {
      borderWidth: 1,
      borderColor: 'black',
      padding: '4 5 0 5',
      width: '100%',
      fontWeight: 'normal'
    },
    valuex: {
      borderWidth: 1,
      borderColor: 'black',
      padding: '4 5 0 5',
      width: '100%',
      fontWeight: 'normal'
    },
    logo: {
      width: 100,
      height: 40
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
    columnC: {
      flex: 1,
      flexDirection: 'column'
    },
    width25: {
      width: '25%'
    },
    width50: {
      width: '50%'
    },
    fontBold: {
      fontWeight: 'bold'
    },
    width10: {
      width: '10%'
    },
    width20: {
      width: '20%'
    },
    width60: {
      width: '60%'
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
      flexGrow: 1, // Para que el contenido ocupe todo el espacio vertical disponible
      marginBottom: 20
      // Espacio interno alrededor del contenido
    }
  })

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

  const Header = () => (
    <View style={tw('border border-black flex  flex-row mb-10	')} fixed>
      <View style={[styles.width25, tw('border-r'), styles.bold]}>
        <Text style={[tw('border-b px-1 text-xs py-1')]}>
          CÓDIGO: FOT-MMCS-12
        </Text>
        <Text style={[tw('border-b  px-1 py-1 text-xs ')]}>VERSIÓN: 02</Text>
        <Text style={[tw('border-b  px-1 text-xs py-1')]}>
          FECHA: 2017-12-05
        </Text>
        <Text
          style={[tw(' px-1 text-xs py-1')]}
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
          RETIRO E INGRESO DE EQUIPOS
        </Text>
      </View>
      <View style={styles.width25}>
        <Image
          style={[tw('top-2 p-2'), styles.widthLogo]}
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
            <Header />
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
