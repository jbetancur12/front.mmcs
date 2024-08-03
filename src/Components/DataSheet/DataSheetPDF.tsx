import React, { useState } from 'react'
import {
  Document,
  Image,
  Link,
  Page,
  PDFViewer,
  StyleSheet,
  Text,
  View
} from '@react-pdf/renderer'
import { CalibrationHistory, DataSheetData } from './ListDataSheet'
import { format, set } from 'date-fns'
import { createTw } from 'react-pdf-tailwind'
import { IconButton } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate } from 'react-router-dom'

interface Props {
  dataSheet: DataSheetData | null
}
const mainColor = '#9CF08B'

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

const DataSheetPDF: React.FC<Props> = ({ dataSheet }) => {
  let calibrationHistories: CalibrationHistory[] = []
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

  if (dataSheet && dataSheet.calibrationHistories.length > 0) {
    calibrationHistories = dataSheet.calibrationHistories
  }

  const styles = StyleSheet.create({
    names: {
      fontFamily: 'Helvetica-Bold',
      fontWeight: 900,
      textTransform: 'uppercase'
    },
    number: {
      width: '5%'
    },
    date: {
      width: '15%'
    },
    code: {
      width: '21%'
    },
    activity: {
      width: '20%'
    },
    comments: {
      width: '30%'
    },
    verifier: {
      width: '17%'
    },
    cell: {
      border: '1px solid black',
      padding: 4,
      margin: 1,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },
    row1: {
      flexDirection: 'row',
      marginVertical: 1
    },
    font: {
      fontSize: 8.5
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
      // borderWidth: 1,
      // borderColor: 'blue',
      flexDirection: 'row',
      marginBottom: 5
    },
    column: {
      //   borderWidth: 1,
      //   borderColor: 'red',
      flex: 1,
      flexDirection: 'column',
      marginRight: 10
    },
    columnL: {
      // borderWidth: 1,
      // borderColor: 'red',
      flex: 0.4,
      flexDirection: 'column'
    },
    columnR: {
      // borderWidth: 1,
      // borderColor: 'red',
      flex: 0.3,
      flexDirection: 'column'
    },
    columnC: {
      // borderWidth: 1,
      // borderColor: 'red',

      flex: 0.4,
      flexDirection: 'column'
    },
    column1: {
      //   borderWidth: 1,
      //   borderColor: 'red',
      flex: 0.6,
      flexDirection: 'column',
      marginRight: 10
    },
    column2: {
      //   borderWidth: 1,
      //   borderColor: 'red',
      flex: 0.4,
      flexDirection: 'column',
      marginRight: 10
    },
    label: {
      // borderWidth: 1,

      fontFamily: 'Helvetica-Bold',
      fontWeight: 900,
      padding: '5 4 0 5',
      width: '60%',
      fontSize: 10
    },
    label1: {
      borderWidth: 1,
      borderColor: 'black',
      padding: '2 5 0 5',
      fontWeight: 'bold',
      width: '100%',
      margin: '5 0'
    },
    label2: {
      fontWeight: 'bold',
      padding: '2 5 0 5',
      width: '100%',
      margin: '5 0'
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
    width25: {
      width: '25%'
    },
    width50: {
      width: '50%'
    },
    fontBold: {
      fontWeight: 'bold'
    },
    widthLogo: {
      width: 130,
      marginLeft: 0
    },
    footer: {
      //position: "absolute",
      // bottom: 30,
      marginBottom: 20,
      marginTop: 20,
      left: 0,
      right: 0,
      textAlign: 'center',

      fontSize: 8
    },
    content: {
      flexGrow: 1, // Para que el contenido ocupe todo el espacio vertical disponible
      marginBottom: 20
      // Espacio interno alrededor del contenido
    },
    columnLeft: {
      flex: 0.6,
      flexDirection: 'row',
      marginRight: 10
    },
    columnRight: {
      flex: 0.4,
      flexDirection: 'row'
    }
  })

  if (!dataSheet) return <div>Loading...</div>

  const Header = () => (
    <View style={tw('border border-black flex  flex-row mb-10	')} fixed>
      <View style={[styles.width25, tw('border-r'), styles.bold]}>
        <Text style={[tw('border-b px-1 text-xs py-1')]}>
          CÓDIGO: FOT-MMCS-02
        </Text>
        <Text style={[tw('border-b  px-1 py-1 text-xs ')]}>VERSIÓN: 03</Text>
        <Text style={[tw('border-b  px-1 text-xs py-1')]}>
          FECHA: 2018-05-15
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
        {/* <Text style={[tw("text-center text-sm top-1"), styles.fontBold]}>
          OFERTA COMERCIAL Y CONDICIONES DE {"\n"} SERVICIO DE VENTA DE EQUIPOS
          E INSUMOS
        </Text> */}
        <Text style={[tw('text-center text-sm top-1'), styles.fontBold]}>
          HOJA DE VIDA
        </Text>
      </View>
      <View style={styles.width25}>
        <Image
          style={[tw('top-2  p-2'), styles.widthLogo]}
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

  const GeneralSpecifications = () => (
    <View style={tw('text-sm')}>
      <Text
        style={[
          tw(`px-1 py-1 font-semibold bg-[${mainColor}] text-center font-bold`),
          styles.bold
        ]}
      >
        ESPECIFICACIONES GENERALES
      </Text>

      <View style={styles.sectionContent}>
        <View style={styles.row}>
          <View style={styles.columnL}>
            <View style={styles.row}>
              <Text style={[styles.label, styles.bold]}>Código Interno:</Text>
              <Text style={styles.value}>{dataSheet.internalCode}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Nombre Equipo:</Text>
              <Text style={styles.value}>{dataSheet.equipmentName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Marca:</Text>
              <Text style={styles.value}>{dataSheet.brand}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Modelo:</Text>
              <Text style={styles.value}>{dataSheet.model}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Número de Serie:</Text>
              <Text style={styles.value}>{dataSheet.serialNumber}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Proveedor:</Text>
              <Text style={styles.value}>{dataSheet.supplier}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tiene Manual:</Text>
              <Text style={styles.value}>{dataSheet.manual ? 'Sí' : 'No'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Magnitud:</Text>
              <Text style={styles.value}>{dataSheet.magnitude}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Unidades:</Text>
              <Text style={styles.value}>{dataSheet.units}</Text>
            </View>
          </View>
          <View style={styles.columnC}>
            <View style={styles.row}>
              <Text style={styles.label}>Recepción:</Text>
              <Text style={styles.value}>
                {format(new Date(dataSheet.receivedDate), 'yyyy-MM-dd')}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>En Servicio:</Text>
              <Text style={styles.value}>
                {format(new Date(dataSheet.inServiceDate), 'yyyy-MM-dd')}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ubicación:</Text>
              <Text style={styles.value}>{dataSheet.location}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tipo Servicio:</Text>
              <Text style={styles.value}>{dataSheet.serviceType}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Estado Equipo:</Text>
              <Text style={styles.value}>{dataSheet.equipmentStatus}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Rango de Op.:</Text>
              <Text style={styles.value}>{dataSheet.operationRange}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Exactitud:</Text>
              <Text style={styles.value}>{dataSheet.accuracy}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Resolución:</Text>
              <Text style={styles.value}>{dataSheet.resolution}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Softw/Firmw:</Text>
              <Text style={styles.value}>{dataSheet.softwareFirmware}</Text>
            </View>
          </View>
          <View style={styles.columnR}>
            <Image src={'/images/tick.png'} />
          </View>
        </View>
      </View>
    </View>
  )

  const StorageAndOperationConditions = () => (
    <View style={tw('text-sm')}>
      <Text
        style={[
          tw(`px-1 py-1 font-semibold bg-[${mainColor}] text-center font-bold`),
          styles.bold
        ]}
      >
        CONDICIONES DE ALMACENAMIENTO Y OPERACIÓN
      </Text>
      <View style={styles.sectionContent}>
        <View style={styles.row}>
          {/* Columna de Almacenamiento */}
          <View style={styles.column}>
            <Text style={[styles.label1, tw('text-center'), styles.bold]}>
              Almacenamiento
            </Text>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label2}>Temperatura:</Text>
                <Text style={styles.label2}>Humedad:</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label1}>
                  {dataSheet.storageTemperature}
                </Text>
                <Text style={styles.label1}>{dataSheet.storageHumidity}</Text>
              </View>
            </View>
          </View>

          {/* Columna de Operación */}
          <View style={styles.column}>
            <Text style={[styles.label1, tw('text-center'), styles.bold]}>
              Operación
            </Text>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label2}>Temperatura:</Text>
                <Text style={styles.label2}>Humedad:</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label1}>
                  {dataSheet.operationTemperature}
                </Text>
                <Text style={styles.label1}>{dataSheet.operationHumidity}</Text>
              </View>
            </View>
          </View>

          {/* Columna de Comentarios */}
          <View style={styles.column}>
            <Text style={[styles.label1, tw('text-center'), styles.bold]}>
              Comentarios
            </Text>
            <Text style={styles.value1}>
              {dataSheet.storageOperationComment}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )

  const TransportationConditions = () => (
    <View style={tw('text-sm')}>
      <Text
        style={[
          tw(`px-1 py-1 font-semibold bg-[${mainColor}] text-center font-bold`),
          styles.bold
        ]}
      >
        CONDICIONES DE TRANSPORTE
      </Text>
      <View style={styles.sectionContent}>
        <View style={styles.row}>
          <View style={styles.columnLeft}>
            <View style={styles.row}>
              <Text style={styles.labelx}>Comentarios:</Text>
              <Text style={styles.valuex}>
                {dataSheet.transportConditionsComment}
              </Text>
            </View>
          </View>
          <View style={styles.columnRight}>
            <Text style={styles.label}>Valor Seguro:</Text>
            <Text style={styles.value}>{dataSheet.insuredValue}</Text>
          </View>
        </View>
      </View>
    </View>
  )

  const Maintenance = () => (
    <View style={tw('text-sm')}>
      <Text
        style={[
          tw(`px-1 py-1 font-semibold bg-[${mainColor}] text-center font-bold`),
          styles.bold
        ]}
      >
        MANTENIMIENTO
      </Text>
      <View style={styles.sectionContent}>
        <View style={styles.row}>
          <View style={styles.columnLeft}>
            <View style={styles.row}>
              <Text style={[styles.labelx]}>Proveedor:</Text>
              <Text
                style={[styles.valuex, tw('border border-black pt-1 px-2')]}
              >
                {dataSheet.maintenanceProvider}
              </Text>
            </View>
          </View>
          <View style={styles.columnRight}>
            <Text style={styles.labelx}>ciclo:</Text>
            <Text style={styles.valuex}>{dataSheet.maintenanceCycle}</Text>
          </View>
        </View>
      </View>
    </View>
  )

  const Calibration = () => (
    <View style={tw('text-sm')}>
      <Text
        style={[
          tw(`px-1 py-1 font-semibold bg-[${mainColor}] text-center font-bold`),
          styles.bold
        ]}
      >
        CALIBRACIÓN
      </Text>
      <View style={styles.sectionContent}>
        <View style={styles.row}>
          <View style={styles.columnLeft}>
            <View style={styles.row}>
              <Text style={styles.labelx}>Proveedor:</Text>
              <Text style={styles.valuex}>{dataSheet.calibrationProvider}</Text>
            </View>
          </View>
          <View style={styles.columnRight}>
            <Text style={styles.labelx}>ciclo:</Text>
            <Text style={styles.valuex}>{dataSheet.calibrationCycle}</Text>
          </View>
        </View>
      </View>
    </View>
  )

  const MaintenanceAndCalibrationHistoric = () => (
    <View style={tw('text-sm')}>
      <Text
        style={[
          tw(
            `mb-2 px-1 py-1 font-semibold bg-[${mainColor}] text-center font-bold`
          ),
          styles.bold
        ]}
      >
        HISTORICO DE CALIBRACIONES Y MANTENIMIENTO
      </Text>
      <View style={tw('flex-row')}>
        <Text style={[styles.cell, styles.number, styles.names]}>N°</Text>
        <Text style={[styles.cell, styles.date, styles.names]}>Fecha</Text>
        <Text style={[styles.cell, styles.code, styles.names]}>
          Código Interno
        </Text>
        <Text style={[styles.cell, styles.activity, styles.names]}>
          Actividad
        </Text>
        <Text style={[styles.cell, styles.comments, styles.names]}>
          Comentarios
        </Text>
        <Text style={[styles.cell, styles.verifier, styles.names]}>
          Verificador
        </Text>
      </View>
      {calibrationHistories.map((history, index) => (
        <View key={index} style={[tw('flex-row my-2 '), styles.row1]}>
          <Text style={[styles.cell, styles.number]}>{index + 1}</Text>

          <Text style={[styles.cell, styles.date]}>
            {new Date(history.date).toLocaleDateString()}
          </Text>
          <Text style={[styles.cell, styles.code]}>{history.internalCode}</Text>
          <Text style={[styles.cell, styles.activity]}>{history.activity}</Text>
          <Text style={[styles.cell, styles.comments]}>
            {truncateText(history.comments, 26)}{' '}
          </Text>
          <Text style={[styles.cell, styles.verifier]}>
            {truncateText(history.verifiedBy, 13)}
          </Text>
        </View>
      ))}
    </View>
  )

  return (
    <div>
      <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        <ArrowBackIcon />
      </IconButton>

      <PDFViewer width='100%' height='1000' className='app'>
        <Document>
          <Page size='A4' style={styles.page} wrap={true}>
            <Header />
            <View style={styles.content}>
              <GeneralSpecifications />
              <StorageAndOperationConditions />
              <TransportationConditions />
              <Maintenance />
              <Calibration />
            </View>
            <Footer />

            {/* Add additional fields as necessary */}
          </Page>
          <Page size='A4' style={styles.page} wrap={true}>
            <Header />
            <View style={styles.content}>
              <MaintenanceAndCalibrationHistoric />
            </View>
            <Footer />
          </Page>
        </Document>
      </PDFViewer>
    </div>
  )
}

export default DataSheetPDF
