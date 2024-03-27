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
    bl: {},
    ml4: {
      marginLeft: 20,
    },
    mb20: {
      marginBottom: 20,
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 0,
      right: 0,
      textAlign: "center",

      fontSize: 10,
    },
  });

  const Header = () => (
    <View style={tw("border border-black flex  flex-row mb-10")}>
      <View style={[styles.width30, tw("border-r")]}>
        <Text style={[tw("border-b px-1")]}>CÓDIGO: MMCS-XX</Text>
        <Text style={[tw("border-b  px-1")]}>VERSIÓN: X</Text>
        <Text style={[tw("border-b  px-1")]}>FECHA: XXXX-XX-XX</Text>
        <Text style={[tw(" px-1")]}>Página 1 de x</Text>
      </View>
      <View style={[styles.width40, tw("border-r flex justify-center")]}>
        <Text style={[tw("text-center bottom-3")]}>METROMEDICS</Text>
        <Text style={tw("border-b ")}></Text>
        <Text style={tw("text-center top-3")}>COTIZACIÓN</Text>
      </View>
      <View style={styles.width30}>
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
          <Text>Cotización</Text>
        </View>
        <View
          style={[
            styles.descContainer,
            styles.width75,
            styles.ml4,
            styles.width10,
          ]}
        >
          <Text>{quoteData?.id}</Text>
        </View>
      </View>

      <View style={tw("flex flex-row mb-4")}>
        <View
          style={[styles.descContainer, styles.descContainer2, styles.width30]}
        >
          <Text>Fecha de Elaboración</Text>
        </View>
        <View
          style={[
            styles.descContainer,
            styles.width75,
            styles.ml4,
            styles.width20,
          ]}
        >
          {/* @ts-ignore */}
          <Text>{format(new Date(quoteData.createdAt), "yyyy-MM-dd")}</Text>
        </View>
        <View
          style={[
            styles.ml4,
            styles.descContainer,
            styles.descContainer2,
            styles.width20,
          ]}
        >
          <Text>Ciudad</Text>
        </View>
        <View
          style={[
            styles.descContainer,
            styles.width75,
            styles.ml4,
            styles.width20,
          ]}
        >
          <Text>{quoteData?.customer.ciudad}</Text>
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
          <Text>Telefono</Text>
        </View>
        <View
          style={[
            styles.descContainer,
            styles.width75,
            styles.ml4,
            styles.width20,
          ]}
        >
          <Text>{quoteData?.customer.telefono}</Text>
        </View>
      </View>

      <View style={tw("flex flex-row ")}>
        <View
          style={[styles.descContainer, styles.descContainer2, styles.width25]}
        >
          <Text>Dirección</Text>
        </View>
        <View style={[styles.descContainer, styles.width75, styles.ml4]}>
          <Text>{quoteData?.customer.direccion}</Text>
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
        <Text>Nombre</Text>
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
          <View style={[styles.tbody]}>
            <Text>{idx + 1}</Text>
          </View>
          <View style={[styles.tbody, styles.tbody2]}>
            <Text>{product.name}</Text>
          </View>
          <View style={styles.tbody}>
            <Text>
              ${" "}
              {product.price.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
              })}{" "}
            </Text>
          </View>
          <View style={styles.tbody}>
            <Text>{product.quantity}</Text>
          </View>
          <View style={styles.tbody}>
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
        Contactenos: 3138124282 - (606) 3256584 comercial@metromedicslab.com.co
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
    <View style={tw("mt-10  border border-black")}>
      <Text style={tw("p-1 font-semibold bg-[#9AF18B] ")}>Observaciones:</Text>
      <Text style={tw("border-t p-2 ")}>{quoteData?.observations}</Text>
    </View>
  );

  return (
    <>
      <Document>
        <Page size="A4" style={styles.page}>
          <Header />
          <InvoiceDescription />
          <TableHead />
          <TableBody />
          <TableTotal />
          <TableDiscount />
          <TableTax />
          <TableTotalAmount />
          <Observations />
          <Footer />
        </Page>
      </Document>
    </>
  );
};

export default QuotePDF;
