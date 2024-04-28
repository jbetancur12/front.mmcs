import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AsyncSelect from "react-select/async";
import { api } from "../config";
import axios from "axios";
import { DatePicker } from "@mui/x-date-pickers";
import toast, { Toaster } from "react-hot-toast";

import { Add, CloudUpload } from "@mui/icons-material";
import ModalCustomer from "../Components/ModalCustomer";
import { AnalyzeExcelComponentProps } from "../Components/ExcelManipulation/Types";
import { ResourceOption } from "../utils/loadOptions";
import { styles } from "../Components/ExcelManipulation/Utils";
import ModalDevice from "../Components/ModalDevice";
import { VisuallyHiddenInput } from "../Components/TableFiles";
// Importa los componentes de MUI

const apiUrl = api();

const AnalyzeExcelComponent: React.FC<AnalyzeExcelComponentProps> = ({
  dataReceived,
  hideUpload,
  selectedFile,
  isFile,
  setFileNames,
  fileNames,
}) => {
  console.log(dataReceived);
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
  const [openModalCustomer, setOpenModalCustomer] = useState(false);
  const [openModalDevice, setOpenModalDevice] = useState(false);

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

  useEffect(() => {
    setData(dataReceived as any[]);
  }, [dataReceived]);

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

          setData(jsonData);
        }
      };
      reader.readAsBinaryString(uploadedFile);
    }
  };

  const dataReturned = (data: any) => {
    setCustomer({ value: data.id, label: data.nombre });
    setMissedData({ ...missedData, customer: "" });
  };

  const dataReturnedDevice = (data: any) => {
    setDevice({ value: data.id, label: data.name });
    setMissedData({ ...missedData, device: "" });
  };

  const analyzeCells = async () => {
    // Aquí puedes analizar las celdas necesarias
    // Por ejemplo, obtener el valor de una celda específica
    if (data.length > 0) {
      setSerialNumber(data[17][2]);

      setCity(data[34][2]);

      setFixedAsset(data[19][2]);

      setLocation(data[21][2]);
      setHeadquartes("Sin Información");

      // findDevice(data[11][2]),
      //   findCustomer(data[30][2]),

      const results: any = await findCustomerAndDevice(
        data[30][2],
        data[11][2]
      );

      const missed = { device: "", customer: "" };

      if (results[0].value.length > 0) {
        setCustomer({
          value: results[0].value[0].id,
          label: results[0].value[0].nombre,
        });
      } else {
        missed.customer = data[30][2];
      }
      if (results[1].value.length > 0) {
        setDevice({
          value: results[1].value[0].id,
          label: results[1].value[0].name,
        });
      } else {
        missed.device = data[11][2];
      }

      setMissedData(missed);

      setCertificateDate(new Date(data[40][2]));
    }
  };

  const fetchCustomer = async (name: string) => {
    try {
      const response = await axios.get(`${apiUrl}/customers`, {
        params: { q: name },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const customers = response.data;

      return customers;
    } catch (error) {
      console.error("Error while searching for device:", error);
      return [];
    }
  };

  const fetchDevice = async (name: string) => {
    try {
      const response = await axios.get(`${apiUrl}/devices`, {
        params: { q: name },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const devices = response.data;
      return devices;
    } catch (error) {
      console.error("Error while searching for device:", error);
      return [];
    }
  };

  const findCustomerAndDevice = async (customer: string, device: string) => {
    try {
      const results = await Promise.allSettled([
        fetchCustomer(customer),
        fetchDevice(device),
      ]);
      return results;
    } catch (error) {
      console.error("Error while searching for device:", error);
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
      name: selectedFile || file?.name.replace(/\.[^/.]+$/, ".pdf"),
    };

    try {
      const response = await axios.post(`${apiUrl}/files/raw`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.status >= 200 && response.status < 300) {
        if (setFileNames && fileNames && selectedFile) {
          setFileNames(fileNames.filter((name) => name !== selectedFile));
        }
        setCity("");
        setLocation("");
        setHeadquartes("");
        setFixedAsset("");
        setSerialNumber("");
        setCertificateDate(null);
        setMissedData({ device: "", customer: "" });
        setDevice(null);
        setCustomer(null);
        setTypeOfCertificate({ id: "3", name: "Calibración" });
        setValidationError(null);
        toast.success("Datos enviados correctamente");
      }
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
      <ModalCustomer
        open={openModalCustomer}
        onClose={setOpenModalCustomer}
        name={missedData.customer}
        dataReturned={dataReturned}
      />
      <ModalDevice
        open={openModalDevice}
        onClose={setOpenModalDevice}
        name={missedData.device}
        dataReturned={dataReturnedDevice}
      />
      <Toaster />
      <Stack direction="column" spacing={2} mb={3} mt={3}>
        {/* <TextField type="file" /> */}
        {!hideUpload && (
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
        )}

        {hideUpload && <Typography>{selectedFile}</Typography>}

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
          styles={styles(!(!!validationError && !customer))}
          value={customer}
        />
        {missedData.customer && !customer && (
          <div className="flex items-center justify-evenly">
            <p className="text-red-500">{missedData.customer}</p>
            <IconButton
              aria-label="delete"
              onClick={() => setOpenModalCustomer(true)}
            >
              <Add />
            </IconButton>
          </div>
        )}
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
          styles={styles(!(!!validationError && !device))}
        />
        {missedData.device && !device && (
          <div className="flex items-center justify-evenly">
            <p className="text-red-500">{missedData.device}</p>
            <IconButton
              aria-label="delete"
              onClick={() => setOpenModalDevice(true)}
            >
              <Add />
            </IconButton>
          </div>
        )}
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
          styles={styles(!(!!validationError && !typeOfCertificate))}
        />
        <TextField
          error={!!validationError && !city}
          label="Ciudad"
          variant="outlined"
          fullWidth
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <TextField
          error={!!validationError && !location}
          label="Ubicación"
          variant="outlined"
          fullWidth
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <TextField
          error={!!validationError && !headquarters}
          label="Sede"
          variant="outlined"
          fullWidth
          value={headquarters}
          onChange={(e) => setHeadquartes(e.target.value)}
        />
        <TextField
          error={!!validationError && !fixedAsset}
          label="Activo Fijo"
          variant="outlined"
          fullWidth
          value={fixedAsset}
          onChange={(e) => setFixedAsset(e.target.value)}
        />
        <TextField
          error={!!validationError && !serialNumber}
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
          sx={{
            "& .MuiInputBase-root": {
              border:
                !!validationError && !certificateDate
                  ? "1px #d32f2f solid"
                  : "none",
            },
            "& .MuiFormLabel-root": {
              color: !!validationError && !certificateDate ? "#d32f2f" : "none",
            },
          }}
        />
        {isFile && (
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUpload />}
            //onChange={handleFileChange}
            style={{
              textTransform: "none",
            }}
          >
            {/* {selectedFileName ? selectedFileName : "Cargar Archivo"} */}
            <VisuallyHiddenInput type="file" accept=".pdf" />
          </Button>
        )}
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
