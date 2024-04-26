// Frontend (React con TypeScript)

import React, { useState } from "react";
import * as XLSX from "xlsx";

const AnalyzeExcelComponent: React.FC = () => {
  const [, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const uploadedFile = event.target.files[0];
      console.log("🚀 ~ handleFileUpload ~ e.target:", event.target.files[0]);
      setFile(uploadedFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target) {
          const binaryString = e.target.result;
          const workbook = XLSX.read(binaryString, { type: "binary" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          setData(jsonData);
        }
      };
      reader.readAsBinaryString(uploadedFile);
    }
  };

  const analyzeCells = () => {
    // Aquí puedes analizar las celdas necesarias
    // Por ejemplo, obtener el valor de una celda específica
    if (data.length > 0) {
      console.log("🚀 ~ analyzeCells ~ data:", data);
      const firstRow = data[0];
      const cellValue = firstRow["A18"]; // Reemplaza 'Nombre de la Celda' por el nombre de la celda que quieres analizar
      console.log("Valor de la celda:", cellValue);
    }
  };

  return (
    <div className="mb-3">
      <input type="file" onChange={handleFileUpload} />
      <button onClick={analyzeCells}>Analizar Celdas</button>
    </div>
  );
};

export default AnalyzeExcelComponent;
