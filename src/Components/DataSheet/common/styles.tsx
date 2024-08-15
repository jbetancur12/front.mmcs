import { StyleSheet } from '@react-pdf/renderer'
import { createTw } from 'react-pdf-tailwind'

const mainColor = '#9CF08B'

export const tw = createTw({
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

export const styles = StyleSheet.create({
  cell: {
    border: '1px solid black',
    padding: '3 1 0 4',
    margin: 2,
    textAlign: 'center',
    backgroundColor: mainColor
  },
  names: {
    fontFamily: 'Helvetica-Bold',
    fontWeight: 200
  },
  rowInventory: {
    border: '1px solid black',
    padding: '3 1 0 4',
    margin: '0 2',
    fontSize: 9,
    // fontWeight: 'bold',

    // // alignItems: 'center',

    display: 'flex'
  },
  row1: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 5,
    justifyContent: 'space-between',
    gap: 0
  },
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
