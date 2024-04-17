import React from "react";
import {
  Image,
  Text,
  View,
  StyleSheet,
  Page,
  Document,
} from "@react-pdf/renderer";
import { QuoteData } from "./TableQuotes";
import { createTw } from "react-pdf-tailwind";
import { format } from "date-fns";

interface Props {
  quoteData: QuoteData | null;
}

const QuotePDF: React.FC<Props> = ({ quoteData }) => {
  const tw = createTw({
    theme: {
      fontFamily: {
        sans: ["Comic Sans"],
      },
      extend: {
        colors: {
          custom: "#bada55",
        },
      },
    },
  });

  const styles = StyleSheet.create({
    page: {
      fontSize: 11,
      paddingTop: 20,
      paddingLeft: 40,
      paddingRight: 40,
      lineHeight: 1.5,
      flexDirection: "column",
    },
    spaceBetween: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      color: "#3E3E3E",
    },
    titleContainer: { flexDirection: "row", marginTop: 24 },
    logo: { width: 90 },
    reportTitle: { fontSize: 16, textAlign: "center" },
    addressTitle: { fontSize: 11, fontStyle: "bold" },
    invoice: { fontWeight: "bold", fontSize: 20 },
    invoiceNumber: { fontSize: 11, fontWeight: "bold" },
    address: { fontWeight: 400, fontSize: 10 },
    theader: {
      marginTop: 20,
      fontSize: 10,
      fontStyle: "bold",
      paddingTop: 4,
      paddingLeft: 7,
      flex: 1,
      textAlign: "center",
      //   height: 20,
      backgroundColor: "#9AF18B",
      borderColor: "whitesmoke",
      borderRightWidth: 1,
      borderBottomWidth: 1,
    },

    theader2: { flex: 2, borderRightWidth: 0, borderBottomWidth: 1 },
    tbody: {
      fontSize: 9,
      paddingTop: 4,
      paddingLeft: 7,
      flex: 1,
      borderColor: "whitesmoke",
      borderRightWidth: 1,
      borderBottomWidth: 1,
    },
    alignCenter: {
      textAlign: "center",
    },
    total: {
      fontSize: 9,
      paddingTop: 4,
      paddingLeft: 7,
      flex: 1.5,
      //   borderColor: "whitesmoke",
      //   borderBottomWidth: 1,
    },
    tbody2: { flex: 2, borderRightWidth: 1 },

    descContainer: {
      fontSize: 10,
      paddingTop: 4,
      paddingLeft: 7,
      borderColor: "whitesmoke",
      borderRightWidth: 1,
      borderBottomWidth: 1,
    },
    descContainer2: {
      backgroundColor: "#9AF18B",
    },
    width25: {
      width: "25%",
    },
    width75: {
      width: "75%",
    },
    fontBold: {
      fontWeight: "bold",
    },
    width10: {
      width: "10%",
    },
    width20: {
      width: "20%",
    },
    width60: {
      width: "60%",
    },
    width30: {
      width: "30%",
    },
    width40: {
      width: "40%",
    },
    width50: {
      width: "50%",
    },
    width80: {
      width: "80%",
    },
    bl: {},
    ml4: {
      marginLeft: 20,
    },
    mb20: {
      marginBottom: 20,
    },
    footer: {
      //position: "absolute",
      // bottom: 30,
      marginBottom: 20,
      marginTop: 20,
      left: 0,
      right: 0,
      textAlign: "center",

      fontSize: 8,
    },
    content: {
      flexGrow: 1, // Para que el contenido ocupe todo el espacio vertical disponible
      marginBottom: 20,
      // Espacio interno alrededor del contenido
    },
  });

  const Header = () => (
    <View style={tw("border border-black flex  flex-row mb-10	")} fixed>
      <View style={[styles.width25, tw("border-r")]}>
        <Text style={[tw("border-b px-1 text-xs py-1")]}>
          CÓDIGO: FOGC-MMCS-31
        </Text>
        <Text style={[tw("border-b  px-1 py-1 text-xs ")]}>VERSIÓN: 01</Text>
        <Text style={[tw("border-b  px-1 text-xs py-1")]}>
          FECHA: 2019-03-20
        </Text>
        <Text
          style={[tw(" px-1 text-xs py-1")]}
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          }
        />
      </View>
      <View style={[styles.width50, tw("border-r flex justify-center")]}>
        <Text style={[tw("text-center top-1")]}>METROMEDICS</Text>
        <Text style={tw("border-b mt-2")}></Text>
        <Text style={[tw("text-center text-sm top-1"), styles.fontBold]}>
          OFERTA COMERCIAL Y CONDICIONES DE {"\n"} SERVICIO DE VENTA DE EQUIPOS
          E INSUMOS
        </Text>
      </View>
      <View style={styles.width25}>
        <Image style={tw("top-3 p-2")} src="/images/logo2.png"></Image>
      </View>
    </View>
  );

  const InvoiceDescription = () => (
    <View style={tw("")}>
      <View style={tw("flex flex-row mb-4 ")}>
        <View
          style={[styles.descContainer, styles.descContainer2, styles.width25]}
        >
          <Text>Oferta N°</Text>
        </View>
        <View style={[styles.descContainer, styles.ml4, styles.width25]}>
          <Text>VT-{quoteData?.id}</Text>
        </View>
        <View
          style={[
            styles.ml4,
            styles.descContainer,
            styles.descContainer2,
            styles.width25,
          ]}
        >
          <Text>Fecha de Elaboración</Text>
        </View>
        <View style={[styles.descContainer, styles.ml4, styles.width25]}>
          {/* @ts-ignore */}
          <Text>{format(new Date(quoteData.createdAt), "yyyy-MM-dd")}</Text>
        </View>
      </View>
      <View style={tw("flex flex-row mb-4")}>
        <View
          style={[styles.descContainer, styles.descContainer2, styles.width10]}
        >
          <Text>Cliente</Text>
        </View>
        <View
          style={[
            styles.descContainer,
            styles.width75,
            styles.ml4,
            styles.width60,
          ]}
        >
          <Text>{quoteData?.customer.nombre}</Text>
        </View>
        <View
          style={[
            styles.ml4,
            styles.descContainer,
            styles.descContainer2,
            styles.width10,
          ]}
        >
          <Text>Nit</Text>
        </View>
        <View
          style={[
            styles.descContainer,
            styles.width75,
            styles.ml4,
            styles.width20,
          ]}
        >
          <Text>{quoteData?.customer.identificacion}</Text>
        </View>
      </View>
      // Direccion
      <View style={tw("flex flex-row mb-4")}>
        <View
          style={[styles.descContainer, styles.descContainer2, styles.width20]}
        >
          <Text>Dirección</Text>
        </View>
        <View style={[styles.descContainer, styles.width80, styles.ml4]}>
          <Text>{quoteData?.customer.direccion}</Text>
        </View>
      </View>
      // Ciudad y Telefono
      <View style={tw("flex flex-row mb-4")}>
        <View
          style={[styles.descContainer, styles.descContainer2, styles.width10]}
        >
          <Text>Ciudad</Text>
        </View>

        <View style={[styles.descContainer, styles.width40, styles.ml4]}>
          <Text>{quoteData?.customer.ciudad}</Text>
        </View>
        <View
          style={[
            styles.ml4,
            styles.descContainer,
            styles.descContainer2,
            styles.width10,
          ]}
        >
          <Text>Telefono</Text>
        </View>
        <View style={[styles.descContainer, styles.ml4, styles.width30]}>
          <Text>{quoteData?.customer.telefono}</Text>
        </View>
      </View>
      <View style={tw("flex flex-row mb-4")}>
        <View
          style={[styles.descContainer, styles.descContainer2, styles.width10]}
        >
          <Text>Email</Text>
        </View>
        <View
          style={[
            styles.descContainer,
            styles.width75,
            styles.ml4,
            styles.width60,
          ]}
        >
          <Text>{quoteData?.customer.email}</Text>
        </View>
      </View>
    </View>
  );

  const TableHead = () => (
    <View style={{ width: "100%", flexDirection: "row", marginTop: 10 }}>
      <View style={[styles.theader]}>
        <Text>Item</Text>
      </View>
      <View style={[styles.theader, styles.theader2]}>
        <Text>Equipo</Text>
      </View>
      <View style={styles.theader}>
        <Text>Cantidad</Text>
      </View>
      <View style={styles.theader}>
        <Text>Precio</Text>
      </View>
      <View style={styles.theader}>
        <Text>Total</Text>
      </View>
    </View>
  );

  const TableBody = () =>
    quoteData?.products.map((product: any, idx: number) => (
      <View key={product.id}>
        <View style={{ width: "100%", flexDirection: "row" }}>
          <View style={[styles.tbody, styles.alignCenter]}>
            <Text>{idx + 1}</Text>
          </View>
          <View style={[styles.tbody, styles.tbody2]}>
            <Text>{product.name}</Text>
          </View>
          <View style={[styles.tbody, styles.alignCenter]}>
            <Text>{product.quantity}</Text>
          </View>
          <View style={[styles.tbody, styles.alignCenter]}>
            <Text>
              ${" "}
              {product.price.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
              })}{" "}
            </Text>
          </View>

          <View style={[styles.tbody, styles.alignCenter]}>
            <Text>
              ${" "}
              {(product.price * product.quantity).toLocaleString("es-ES", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>
      </View>
    ));

  const TableTotal = () => (
    <View style={{ width: "100%", flexDirection: "row" }}>
      <View style={styles.total}>
        <Text></Text>
      </View>
      <View style={styles.total}>
        <Text> </Text>
      </View>
      <View style={styles.total}>
        <Text> </Text>
      </View>
      <View style={styles.tbody}>
        <Text>Subtotal</Text>
      </View>
      <View style={styles.tbody}>
        <Text>
          ${" "}
          {quoteData?.subtotal.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
          })}
        </Text>
      </View>
    </View>
  );

  const TableDiscount = () => (
    <View style={{ width: "100%", flexDirection: "row" }}>
      <View style={styles.total}>
        <Text></Text>
      </View>
      <View style={styles.total}>
        <Text> </Text>
      </View>
      <View style={styles.total}>
        <Text> </Text>
      </View>
      <View style={styles.tbody}>
        <Text>Descuento ({quoteData?.discountRatio}%)</Text>
      </View>
      <View style={styles.tbody}>
        <Text>
          ${" "}
          {quoteData?.discountTotal.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
          })}
        </Text>
      </View>
    </View>
  );

  const TableTax = () => (
    <View style={{ width: "100%", flexDirection: "row" }}>
      <View style={styles.total}>
        <Text></Text>
      </View>
      <View style={styles.total}>
        <Text> </Text>
      </View>
      <View style={styles.total}>
        <Text> </Text>
      </View>
      <View style={styles.tbody}>
        <Text>IVA (19)%</Text>
      </View>
      <View style={styles.tbody}>
        <Text>
          ${" "}
          {quoteData?.taxTotal.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
          })}
        </Text>
      </View>
    </View>
  );

  const Footer = () => (
    <View style={styles.footer} fixed>
      <Text style={tw("text-center")}>
        Metromedics S.A.S Nit. 900.816.433-3 Dosquebradas - Risaralda
      </Text>
      <Text style={tw("text-center")}>
        Contáctenos: 3113441682 - (606) 3256584 comercial@metromedicslab.com.co
      </Text>
      <Text style={tw("text-center")}>www.metromedics.co</Text>
    </View>
  );

  const TableTotalAmount = () => (
    <View style={{ width: "100%", flexDirection: "row" }}>
      <View style={styles.total}>
        <Text></Text>
      </View>
      <View style={styles.total}>
        <Text> </Text>
      </View>
      <View style={styles.total}>
        <Text> </Text>
      </View>
      <View style={styles.tbody}>
        <Text>Total</Text>
      </View>
      <View style={styles.tbody}>
        <Text>
          ${" "}
          {quoteData?.total.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
          })}
        </Text>
      </View>
    </View>
  );

  // Add the missing import statement

  const Observations = () => (
    <View style={tw("border border-black text-sm")}>
      <View>
        <Text style={tw("px-1 font-semibold bg-[#9AF18B] pt-1")}>
          Comentarios:
        </Text>
      </View>
      {/* <Text style={tw("border-t p-2 min-h-28")}>{quoteData?.observations}</Text> */}
      <View style={[tw("border-t min-h-20"), { flexDirection: "column" }]}>
        {quoteData?.comments.map((comment: any, idx: number) => (
          <View
            key={idx}
            style={{ flexDirection: "row", marginBottom: 1, marginTop: 2 }}
          >
            <Text style={{ marginHorizontal: 8 }}>*</Text>
            <Text>{comment}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const GeneralConditions = () => (
    <View style={tw("border mt-5 border-black text-sm")}>
      <Text style={tw("px-1 py-1 font-semibold bg-[#9AF18B] ")}>
        Condiciones Generales:
      </Text>
      <Text style={tw("border-t p-2 min-h-28")}>
        Metromedics es responsable del manejo de toda la información del cliente
        obtenida durante la ejecución de las actividades de calibración. {"\n"}
        El personal de Metromedics no está sometido a presiones comerciales,
        financieras o de otro tipo, tanto externas como internas que puedan
        influenciar el juicio técnico y transparente de los resultados obtenidos
        en el servicio.
      </Text>
    </View>
  );

  const PaymentConditions = () => (
    <View style={tw("mt-5  border border-black text-sm")}>
      <Text style={tw("p-1 font-semibold bg-[#9AF18B] ")}>
        Condiciones de pago:
      </Text>
      <Text style={tw("border-t p-2 min-h-28")}>
        {quoteData?.otherFields?.paymentConditions}
      </Text>
    </View>
  );
  const DeliveryConditions = () => (
    <View style={tw("mt-5  border border-black text-sm")}>
      <Text style={tw("p-1 font-semibold bg-[#9AF18B] ")}>
        Condiciones de Entrega:
      </Text>
      <Text style={tw("border-t p-2 min-h-28")}>
        Tiempo de entrega de los equipos {"      "}8 días habiles
      </Text>
    </View>
  );

  return (
    <>
      <Document>
        <Page size="A4" style={styles.page} wrap={true}>
          <Header />
          <View style={styles.content}>
            <InvoiceDescription />
            <TableHead />
            <TableBody />
            <TableTotal />
            <TableDiscount />
            <TableTax />
            <TableTotalAmount />
          </View>
          <Footer />
        </Page>
        <Page size="A4" style={styles.page} wrap={true}>
          <Header />
          <View style={styles.content}>
            <Observations />
            <GeneralConditions />
            <PaymentConditions />
            <DeliveryConditions />
          </View>
          <Footer />
        </Page>
      </Document>
    </>
  );
};

export default QuotePDF;
