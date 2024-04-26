import React, { useState } from "react";
import { Button, Container, TextField } from "@mui/material";
import axios from "axios";
import { api } from "../config";

const apiUrl = api();

const ScriptGenerator: React.FC = () => {
  const [values, setValues] = useState({
    excel: "",
    pdf: "",
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setValues({
      ...values,
      [name]: value,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await axios
        .get(`${apiUrl}/utils/generate-pdf`, {
          params: {
            excel: values.excel,
            pdf: values.pdf,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          responseType: "blob",
        })
        .then((response) => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", "scr.ps1");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    } catch (error) {
      console.error(error);
    }

    // Aquí puedes enviar los datos al servidor para generar el script de PowerShell
  };

  const handleSubmit2 = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await axios
        .get(`${apiUrl}/utils/generate-bat`, {
          params: {
            excel: values.excel,
            pdf: values.pdf,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          responseType: "blob",
        })
        .then((response) => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", "scr.bat");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    } catch (error) {
      console.error(error);
    }

    // Aquí puedes enviar los datos al servidor para generar el script de PowerShell
  };

  return (
    <Container>
      <h1>Seleccionar carpetas</h1>

      <TextField
        name="excel"
        label="Carpeta de Excel"
        value={values.excel}
        onChange={handleChange}
      />
      <br />
      <TextField
        name="pdf"
        label="Carpeta de PDF"
        value={values.pdf}
        onChange={handleChange}
      />
      <br />

      {/* @ts-ignore */}
      <Button variant="contained" onClick={handleSubmit}>
        Generar Script
      </Button>
      {/* @ts-ignore */}
      <Button variant="contained" onClick={handleSubmit2}>
        Generar Script2
      </Button>
    </Container>
  );
};

export default ScriptGenerator;
