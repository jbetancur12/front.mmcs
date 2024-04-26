import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Box, Button, Stack, TextField } from "@mui/material";
import AsyncSelect from "react-select/async";
import { api } from "../config";
import axios from "axios";
import { DatePicker } from "@mui/x-date-pickers";
import toast, { Toaster } from "react-hot-toast";
import { set } from "date-fns";
// Importa los componentes de MUI

const apiUrl = api();

export interface ResourceOption {
  value: string;
  label: string;
}

const AnalyzeExcelComponent: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [city, setCity] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [headquarters, setHeadquartes] = useState<string>();
  const [fixedAsset, setFixedAsset] = useState<string>("");
  const [serialNumber, setSerialNumber] = useState<string>("");
  const [certificateDate, setCertificateDate] = useState<Date | null>(null);
  const [missedData, setMissedData] = useState<{
    device: string;
    customer: string;
  }>({ device: "", customer: "" });
  const [device, setDevice] = useState<ResourceOption | null>(null);
  const [customer, setCustomer] = useState<ResourceOption | null>(null);
  const [typeOfCertificate, setTypeOfCertificate] = useState<{
    id: string;
    name: string;
  } | null>({ id: "3", name: "Calibración" });
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFields = () => {
    if (
      !city ||
      !location ||
      !headquarters ||
      !fixedAsset ||
      !serialNumber ||
      !certificateDate ||
      !customer ||
      !device ||
      !typeOfCertificate
    ) {
      setValidationError("Todos los campos son obligatorios");
      return false;
    }
    return true;
  };

  const styles = {
    container: (provided: any) => ({
      ...provided,
      width: "100%",
      marginRight: 10,
      height: 50,
    }),
    control: (provided: any) => ({
      ...provided,
      border: "1px solid #ccc",
      borderRadius: 5,
      height: 55,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      color: state.isSelected ? "white" : "black",
      backgroundColor: state.isSelected ? "blue" : "white",
    }),
  };

  const loadOptions = async (
    inputValue: string,
    resource: string,
    mapFunction: (item: any) => ResourceOption
  ): Promise<ResourceOption[]> => {
    return new Promise((resolve, reject) => {
      let timer;
      const endpoint = `${apiUrl}/${resource}`; // Construye la URL del endpoint
      const fetchData = async () => {
        try {
          const response = await axios.get(endpoint, {
            params: { q: inputValue },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });
          const data = response.data;
          const options = data.map((item: any) => mapFunction(item));

          resolve(options); // Aplica la función de mapeo
        } catch (error) {
          console.error("Error al cargar opciones:", error);
          reject(error);
        }
      };
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(fetchData, 1000); // Establecer el debounce en 1000ms
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const uploadedFile = event.target.files[0];

      setFile(uploadedFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target) {
          const binaryString = e.target.result as string; // Asegúrate de que sea de tipo string
          const workbook = XLSX.read(binaryString, { type: "binary" });
          const worksheet = workbook.Sheets["CC"];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            dateNF: "yyyy-mm-dd",
          });
          console.log(jsonData);

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
      setSerialNumber(data[17][2]);

      setCity(data[34][2]);

      setFixedAsset(data[19][2]);

      setLocation(data[21][2]);
      setHeadquartes("Sin Información");

      findDevice(data[11][2]);
      findCustomer(data[30][2]);
      setCertificateDate(new Date(data[40][2]));
    }
  };

  const findDevice = async (name: string) => {
    try {
      const response = await axios.get(`${apiUrl}/devices`, {
        params: { q: name },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const devices = response.data;
      if (devices.length > 0) {
        // setDevice({ id: devices[0].id, name: devices[0].name });
        const deviceData = {
          value: devices[0].id,
          label: devices[0].name,
        };
        setDevice(deviceData);
        return;
      } else {
        toast.error("Instrumento no encontrado");
        setMissedData({ ...missedData, device: name });
        return;
      }
    } catch (error) {
      console.error("Error al buscar dispositivo:", error);
      toast.error("Instrumento no encontrado");
    }
  };

  const findCustomer = async (name: string) => {
    try {
      const response = await axios.get(`${apiUrl}/customers`, {
        params: { q: name },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const customers = response.data;

      if (customers.length > 0) {
        // setDevice({ id: customers[0].id, name: customers[0].name });
        const customerData = {
          value: customers[0].id,
          label: customers[0].nombre,
        };

        setCustomer(customerData);
        return;
      } else {
        setMissedData({ ...missedData, customer: name });
        toast.error("Cliente no encontrado");
        return;
      }
    } catch (error) {
      console.error("Error al buscar dispositivo:", error);
    }
  };

  useEffect(() => {
    analyzeCells();
  }, [data]);

  const onSubmit = async () => {
    if (!validateFields()) {
      return;
    }

    setValidationError(null);

    // const dateFormated = new Date(
    //   format(certificateDate as Date, "yyyy-MM-dd")
    // );

    // const nextCalibrationDate = addYears(dateFormated, 1);

    const nextCalibrationDate = certificateDate?.setMonth(
      certificateDate.getMonth() + 12
    );
    const data = {
      city,
      sede: headquarters,
      location: location || "SIN INFORMACIÓN",
      activoFijo: fixedAsset || "SIN INFORMACIÓN",
      serie: serialNumber || "SIN INFORMACIÓN",
      calibrationDate: certificateDate,
      nextCalibrationDate: nextCalibrationDate,
      customerId: customer?.value,
      deviceId: device?.value,
      certificateTypeId: typeOfCertificate?.id,
      name: file?.name.replace(/\.[^/.]+$/, ".pdf"),
    };

    try {
      const response = await axios.post(`${apiUrl}/files/raw`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
    } catch (error) {
      console.error("Error al enviar datos:", error);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 400,
        margin: "0 auto",
      }}
    >
      <Toaster />
      <Stack direction="column" spacing={2} mb={3} mt={3}>
        {/* <TextField type="file" /> */}
        <label htmlFor="upload-photo">
          <input
            style={{ display: "none" }}
            id="upload-photo"
            name="upload-photo"
            type="file"
            onChange={handleFileUpload}
            accept=".xls, .xlsx, .xlsm"
          />

          <Button color="secondary" variant="contained" component="span">
            Subir Archivo
          </Button>
        </label>

        {/* <Button variant="contained" onClick={analyzeCells} color="primary">
          Analizar Celdas
        </Button> */}
        <AsyncSelect
          cacheOptions
          // defaultOptions
          loadOptions={(inputValue) =>
            loadOptions(inputValue, "customers", mapCustomers)
          }
          onChange={(selectedOption: any) => setCustomer(selectedOption)}
          placeholder="Buscar Cliente"
          // defaultValue={
          //   id && {
          //     value: index,
          //     label: productName,
          //   }
          // }
          styles={styles}
          value={customer}
        />
        <p className="text-red-500">{missedData.customer}</p>
        <AsyncSelect
          cacheOptions
          // defaultOptions
          loadOptions={(inputValue) =>
            loadOptions(inputValue, "devices", mapDevices)
          }
          // onChange={(selectedOption: any) =>
          //   setDevice({
          //     id: selectedOption.value,
          //     name: selectedOption.label,
          //   })
          // }
          onChange={(selectedOption: any) => setDevice(selectedOption)}
          value={device}
          placeholder="Buscar Equipo"
          styles={styles}
        />
        <p className="text-red-500">{missedData.device}</p>
        <AsyncSelect
          cacheOptions
          // defaultOptions
          loadOptions={(inputValue) =>
            loadOptions(inputValue, "certificateTypes", mapDevices)
          }
          onChange={(selectedOption: any) =>
            setTypeOfCertificate({
              id: selectedOption.value,
              name: selectedOption.label,
            })
          }
          placeholder="Buscar Tipo de Certificado"
          defaultValue={{
            value: typeOfCertificate?.id,
            label: typeOfCertificate?.name,
          }}
          styles={styles}
        />
        <TextField
          label="Ciudad"
          variant="outlined"
          fullWidth
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <TextField
          label="Ubicación"
          variant="outlined"
          fullWidth
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <TextField
          label="Sede"
          variant="outlined"
          fullWidth
          value={headquarters}
          onChange={(e) => setHeadquartes(e.target.value)}
        />
        <TextField
          label="Activo Fijo"
          variant="outlined"
          fullWidth
          value={fixedAsset}
          onChange={(e) => setFixedAsset(e.target.value)}
        />
        <TextField
          label="Serie"
          variant="outlined"
          fullWidth
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
        />
        <DatePicker
          label="Fecha de Certificación"
          value={certificateDate}
          onChange={(newValue) => setCertificateDate(newValue)}
        />
        {validationError && (
          <div style={{ color: "red" }}>{validationError}</div>
        )}
        <Button variant="contained" onClick={onSubmit} color="primary">
          Enviar
        </Button>
      </Stack>
    </Box>
  );
};

const mapDevices = (option: any): ResourceOption => ({
  value: option.id,
  label: option.name,
});

const mapCustomers = (option: any): ResourceOption => ({
  value: option.id,
  label: option.nombre,
});

export default AnalyzeExcelComponent;
