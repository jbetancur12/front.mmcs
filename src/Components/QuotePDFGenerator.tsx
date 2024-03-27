// Importa el tipo QuoteData adecuado
// Importa tu componente de diseño de cotización

import "./QuotePDF.css"; // Importa tu hoja de estilos CSS personalizada

import { QuoteData } from "./TableQuotes";

import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import TextQuote from "./QuotePDF";
import { Button } from "@mui/material";

interface Props {
  quoteData: QuoteData;
}

const QuotePDFGenerator: React.FC<Props> = ({ quoteData }) => {
  return (
    <div>
      <PDFViewer width="100%" height="700" className="app">
        <TextQuote quoteData={quoteData} />
      </PDFViewer>
    </div>
  );
};

export default QuotePDFGenerator;
