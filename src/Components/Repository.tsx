import axios from "axios";
import { format } from "date-fns";
import MaterialReactTable, { MRT_ColumnDef } from "material-react-table";
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../config";
import toast, { Toaster } from "react-hot-toast";
import Loader from "./Loader2";
import { MRT_Localization_ES } from "material-react-table/locales/es";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { CloudUpload, Delete, Download, Visibility } from "@mui/icons-material";

import * as Minio from "minio";
import XlsxPopulate from "xlsx-populate";

const minioClient = new Minio.Client({
  endPoint: import.meta.env.VITE_MINIO_ENDPOINT || "localhost",
  port: import.meta.env.VITE_ENV === "development" ? 9000 : undefined,
  useSSL: import.meta.env.VITE_MINIO_USESSL === "true",
  accessKey: import.meta.env.VITE_MINIO_ACCESSKEY,
  secretKey: import.meta.env.VITE_MINIO_SECRETKEY,
});

export interface FileData {
  name: string;
  title: string;
  description: string;
  version: string;
  date: Date;
  path: string;
}

export interface RepositoryData extends FileData {
  id: number;
  created_at: Date;
}

const apiUrl = api();

const Repository = () => {
  const [tableData, setTableData] = useState<RepositoryData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const columns = useMemo<MRT_ColumnDef<RepositoryData>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Id",
        size: 80,
      },
      {
        accessorKey: "name",
        header: "Nombre",
        size: 100,
      },
      {
        accessorKey: "title",
        header: "Título",
        size: 100,
      },

      {
        accessorKey: "version",
        header: "Versión",
        size: 50,
      },
      {
        accessorKey: "date",
        header: "Fecha",
        size: 50,
        Cell: ({ row }) => format(new Date(row.original.date), "yyyy-MM-dd"),
      },
      {
        accessorKey: "description",
        header: "Descripción",
        size: 100,
      },
      {
        accessorKey: "path",
        header: "Ruta",
        size: 100,
      },
    ],
    [] // No hay dependencias específicas aquí
  );

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/repositories`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.statusText === "OK") {
        // @ts-ignore: Ignorar el error en esta línea
        setTableData(response.data);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching device data:", error);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const handleCreateNewRow = (values: FileData) => {
    onCreateRepository(values);
    setCreateModalOpen(false);
  };

  const onCreateRepository = async (repostoryData: FileData) => {
    try {
      const response = await axios.post(
        `${apiUrl}/repositories`,
        repostoryData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.status >= 200 && response.status < 300) {
        toast.success("Archivo subido Exitosamente!", {
          duration: 4000,
          position: "top-center",
        });
        fetchRepositories();
      } else {
        toast.error("Error al subir archivo", {
          duration: 4000,
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  const downloadFileFromMinio = async (file: string) => {
    try {
      await minioClient.getObject(
        "repositories",
        file,
        async function (err: Error | null, dataStream: any) {
          if (err) {
            console.error(err);
            return;
          }

          const chunks: Uint8Array[] = [];
          dataStream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
          dataStream.on("end", async () => {
            const pdfBlob = new Blob(chunks, {
              type: "application/octet-stream",
            });

            const workbook = await XlsxPopulate.fromDataAsync(pdfBlob);

            const wbout = await workbook.outputAsync();
            const blob = new Blob([wbout], {
              type: "application/octet-stream",
            });

            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = file;
            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
          });
        }
      );
    } catch (error) {
      console.error("Error downloading file from Minio:", error);
    }
  };

  const openExcelViewerFromMinio = async (file: string): Promise<string> => {
    try {
      return new Promise((resolve, reject) => {
        // Obtener el archivo Excel de Minio
        minioClient.getObject(
          "repositories",
          file,
          async function (err: Error | null, dataStream: any) {
            if (err) {
              console.error("Error fetching Excel file from Minio:", err);
              reject(err);
              return;
            }

            const chunks: Uint8Array[] = [];
            dataStream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
            dataStream.on("end", async () => {
              // Convertir los chunks en un blob
              const pdfBlob = new Blob(chunks, {
                type: "application/octet-stream",
              });

              // Leer el archivo Excel con XlsxPopulate
              const workbook = await XlsxPopulate.fromDataAsync(pdfBlob);

              // Convertir el workbook en un blob nuevamente
              const wbout = await workbook.outputAsync();
              const blob = new Blob([wbout], {
                type: "application/octet-stream",
              });

              // Crear una URL para el blob
              const fileURL = URL.createObjectURL(blob);

              // Resolver con la URL del archivo
              resolve(fileURL);
            });
          }
        );
      });
    } catch (error) {
      console.error("Error opening Excel file in viewer:", error);
      throw error;
    }
  };

  const handleClick = async (
    e: React.MouseEvent<HTMLButtonElement>,
    file: string
  ) => {
    e.preventDefault();
    try {
      const fileURL = await openExcelViewerFromMinio(file);

      window.open(fileURL, "_blank");
    } catch (error) {
      // Manejar el error, si es necesario
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const shouldDelete = window.confirm(
        "¿Estás seguro de que deseas eliminar este archivo?"
      );

      if (shouldDelete) {
        const response = await axios.delete(`${apiUrl}/repositories/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (response.status >= 200 && response.status < 300) {
          toast.success("Archivo eliminado Exitosamente!", {
            duration: 4000,
            position: "top-center",
          });
          fetchRepositories();
        } else {
          toast.error("Error al eliminar archivo", {
            duration: 4000,
            position: "top-center",
          });
        }
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  return (
    <>
      <Toaster />
      <Loader loading={loading} />
      <MaterialReactTable
        columns={columns}
        data={tableData}
        localization={MRT_Localization_ES}
        enableRowActions={true}
        renderTopToolbarCustomActions={() => (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded "
            onClick={() => setCreateModalOpen(true)}
          >
            Subir Nuevo Archivo
          </button>
        )}
        renderRowActions={({ row }) => {
          return (
            <Box
              sx={{
                display: "flex",
                gap: "1rem",
                // width: 20,
                justifyContent: "center",
              }}
            >
              {/* <Tooltip arrow placement="right" title="Ver">
                  <Link to={`${row.original.id}`}>
                    <Visibility />
                  </Link>
                </Tooltip> */}

              <Tooltip arrow placement="right" title="descargar">
                <Button
                  onClick={() => downloadFileFromMinio(row.original.path)}
                >
                  <Download />
                </Button>
              </Tooltip>
              <Button onClick={(e) => handleClick(e, row.original.path)}>
                <Visibility />
              </Button>
              <Button onClick={() => handleDelete(row.original.id)}>
                <Delete />
              </Button>
            </Box>
          );
        }}
      />
      <CreateNewRepositoryModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
    </>
  );
};

interface CreateModalProps {
  columns: MRT_ColumnDef<RepositoryData>[];
  onClose: () => void;
  onSubmit: (values: FileData) => void;
  open: boolean;
}

export const CreateNewRepositoryModal = ({
  open,
  columns,
  onClose,
  onSubmit,
}: CreateModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [values, setValues] = useState<any>(() =>
    columns.reduce((acc, column) => {
      acc[column.accessorKey ?? ""] = "";
      return acc;
    }, {} as any)
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSelectedFileName(selectedFile.name);
    }
  };

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("file", file as File);
    formData.append("name", values.name);
    formData.append("title", values.title);
    formData.append("version", values.version);
    formData.append("description", values.description);
    formData.append("date", values.date);
    //@ts-ignore
    onSubmit(formData);
    onClose();

    // axios
    //   .post(`${apiUrl}/repositories`, formData, {
    //     headers: {
    //       Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    //     },
    //   })
    //   .then((response) => {
    //     if (response.status === 201) {
    //       toast.success("Archivo subido Exitosamente!", {
    //         duration: 4000,
    //         position: "top-center",
    //       });
    //       onSubmit(response.data);
    //       onClose();
    //     }
    //   })
    //   .catch((error) => {
    //     console.error("Error al subir archivo", error);
    //   });
  };

  return (
    <Dialog open={open}>
      <DialogTitle textAlign="center">Subir Nuevo Archivo</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: "100%",
              minWidth: { xs: "300px", sm: "360px", md: "400px" },
              gap: "1.5rem",
            }}
          >
            {columns.map((column) => (
              <React.Fragment key={column.accessorKey}>
                {column.accessorKey !== "id" && (
                  <>
                    {column.accessorKey === "date" ? (
                      <TextField
                        label={column.header}
                        type="date"
                        name={column.accessorKey}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setValues({
                            ...values,
                            [e.target.name]: e.target.value,
                          })
                        }
                      />
                    ) : column.accessorKey === "path" ? (
                      <Button
                        component="label"
                        variant="contained"
                        startIcon={<CloudUpload />}
                        htmlFor="file-upload"
                        style={{
                          textTransform: "none",
                        }}
                      >
                        {selectedFileName ? selectedFileName : "Cargar Archivo"}
                        <input
                          id="file-upload"
                          type="file"
                          accept=".xlsx"
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                        />
                      </Button>
                    ) : (
                      <TextField
                        label={column.header}
                        name={column.accessorKey}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setValues({
                            ...values,
                            [e.target.name]: e.target.value,
                          })
                        }
                      />
                    )}
                  </>
                )}
              </React.Fragment>
            ))}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: "1.25rem" }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ backgroundColor: "#ccc", marginRight: "10px" }}
        >
          Cancelar
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Subir Archivo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Repository;
