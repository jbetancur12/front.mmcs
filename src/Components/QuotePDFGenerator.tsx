import React, { useRef } from "react";
// Importa el tipo QuoteData adecuado
// Importa tu componente de diseño de cotización
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./QuotePDF.css"; // Importa tu hoja de estilos CSS personalizada
import QuotePDF from "./Quotepdf";
import { QuoteData } from "./TableQuotes";
import { Button } from "@mui/material";

interface Props {
  quoteData: QuoteData;
}

const QuotePDFGenerator: React.FC<Props> = ({ quoteData }) => {
  const quoteRef = useRef<HTMLDivElement>(null);

  const generatePDF = () => {
    if (quoteRef.current) {
      html2canvas(quoteRef.current).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const width = pdf.internal.pageSize.getWidth();
        console.log("🚀 ~ html2canvas ~ width:", width);
        const height = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, "PNG", 0, 0, width, height);
        pdf.save(`cotizacion_${quoteData.id}.pdf`);
      });
    }
  };

  return (
    <div>
      <div ref={quoteRef}>
        <QuotePDF quoteData={quoteData} />
      </div>

      <Button onClick={generatePDF}>Generar PDF</Button>
    </div>
  );
};

export default QuotePDFGenerator;
