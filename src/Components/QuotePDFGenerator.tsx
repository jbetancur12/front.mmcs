// Importa el tipo QuoteData adecuado
// Importa tu componente de diseño de cotización

// Importa tu hoja de estilos CSS personalizada

import { QuoteData } from "./TableQuotes";

import { PDFViewer } from "@react-pdf/renderer";
import QuotePDF from "./QuotePDF";

interface Props {
  quoteData: QuoteData | null;
}

const QuotePDFGenerator: React.FC<Props> = ({ quoteData }) => {
  return (
    <div>
      <PDFViewer width="100%" height="700" className="app">
        <QuotePDF quoteData={quoteData} />
      </PDFViewer>
    </div>
  );
};

export default QuotePDFGenerator;
