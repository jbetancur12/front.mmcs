import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import axios from "axios";
import {
  MaterialReactTable,
  MaterialReactTableProps,
  MRT_Cell,
  type MRT_ColumnDef,
} from "material-react-table";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../config";
import { MRT_Localization_ES } from "material-react-table/locales/es";
import { NumericFormatCustom } from "./NumericFormatCustom";

// Define interfaces
export interface ProductData {
  id: number;
  name: string;
  price: number;
  createdAt: string;
}

// API URL
const apiUrl = api();

// Main component
const TableProducts: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState<ProductData[]>([]);
  const [price, setPrice] = useState(0);
  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string;
  }>({});
  const [percentage, setPercentage] = useState("0");
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  // const [filteredTableData, setFilteredTableData] = useState<ProductData[]>([]);

  const updateAllPrices = async () => {
    setConfirmationDialogOpen(false);
    const parsedPercentage = parseFloat(percentage);
    if (!isNaN(parsedPercentage)) {
      try {
        // Realizar una solicitud POST al endpoint del controlador en Express
        const response = await axios.put(apiUrl + "/products/update-prices", {
          percentage: parsedPercentage,
        });

        // Verificar si la solicitud fue exitosa
        if (response.status === 200) {
          // Actualizar la tabla de productos con los nuevos datos recibidos del servidor
          const updatedTableData = tableData.map((product) => ({
            ...product,
            price: parseFloat(
              (product.price * (1 + parsedPercentage / 100)).toFixed(2)
            ),
          }));
          setTableData(updatedTableData);

          // Mostrar un mensaje de éxito
          toast.success(`Precios actualizados en ${parsedPercentage}%`, {
            duration: 4000,
            position: "top-center",
          });
        } else {
          // Mostrar un mensaje de error si la solicitud no fue exitosa
          toast.error("Error al actualizar los precios", {
            duration: 4000,
            position: "top-center",
          });
        }
      } catch (error) {
        // Capturar errores de red o del servidor
        console.error("Error al actualizar precios:", error);
        toast.error("Error al actualizar los precios", {
          duration: 4000,
          position: "top-center",
        });
      }
    } else {
      // Mostrar un mensaje de error si el porcentaje es inválido
      toast.error("Porcentaje inválido", {
        duration: 4000,
        position: "top-center",
      });
    }
  };

  // Create a new device
  const onCreateProduct = async (productData: ProductData) => {
    try {
      const response = await axios.post(`${apiUrl}/products`, productData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.status === 201) {
        toast.success("Producto Creado Exitosamente!", {
          duration: 4000,
          position: "top-center",
        });
        fetchProducts(); // Refresh data after creation
      } else {
        console.error("Error al crear equipo");
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  // Fetch devices data
  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${apiUrl}/products`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.statusText === "OK") {
        // @ts-ignore: Ignorar el error en esta línea
        setTableData(response.data);
      }
    } catch (error) {
      console.error("Error fetching device data:", error);
    }
  };

  // const updateUser = async (ProductData: ProductData) => {

  //   try {
  //     const response = await axios.put(`${apiUrl}/devices/${ProductData.id}`, ProductData, {
  //       headers: {
  //         'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
  //       },
  //     });

  //     if (response.status === 201) {
  //       toast.success('Equipo Modificado Exitosamente!', {
  //         duration: 4000,
  //         position: 'top-center',
  //       });
  //       ; // Refresh data after creation
  //     } else {
  //       console.error('Error al crear equipo');
  //     }
  //   } catch (error) {
  //     console.error('Error de red:', error);
  //   }
  // }

  const handleCancelRowEdits = () => {
    setValidationErrors({});
  };

  const handleSaveRowEdits: MaterialReactTableProps<ProductData>["onEditingRowSave"] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        const updatedValues = {
          ...values,
          price: price > 0 ? price : values.price,
        };
        delete updatedValues.id;
        try {
          const response = await axios.put(
            `${apiUrl}/products/${values.id}`,
            updatedValues,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
            }
          );

          if (response.status === 200) {
            toast.success("Producto Modificado Exitosamente!", {
              duration: 4000,
              position: "top-center",
            });
            tableData[row.index] = { ...values, ...updatedValues };
            setTableData([...tableData]);
          } else {
            console.error("Error al modificar producto");
          }
        } catch (error) {
          console.error("Error de red:", error);
        }

        exitEditingMode(); //required to exit editing mode and close modal
      }
    };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateNewRow = (values: ProductData) => {
    onCreateProduct(values);
    setCreateModalOpen(false);
  };

  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<ProductData>
    ): MRT_ColumnDef<ProductData>["muiTableBodyCellEditTextFieldProps"] => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event) => {
          const isValid = validateRequired(event.target.value);
          if (!isValid) {
            //set validation error for cell if invalid
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is required`,
            });
          } else {
            //remove validation error for cell if valid
            delete validationErrors[cell.id];
            setValidationErrors({
              ...validationErrors,
            });
          }
        },
      };
    },
    [validationErrors]
  );

  //should be memoized or stable
  const columns = useMemo<MRT_ColumnDef<ProductData>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
      },
      {
        accessorKey: "name",
        header: "Nombre",
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      //   {
      //     accessorKey: "createdAt",
      //     header: "Fecha",
      //     Cell: ({ row }) =>
      //       format(new Date(row.original.createdAt), "yyyy-MM-dd"),
      //   },
      {
        accessorKey: "price",
        header: "Precio",
        Cell: ({ row }) =>
          new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
          }).format(row.original.price),
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
        Edit: ({ row }) => (
          <TextField
            value={row.getValue("price")}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            InputProps={{
              inputComponent: NumericFormatCustom as any,
            }}
          />
        ),
      },
    ],
    [getCommonEditTextFieldProps] // No hay dependencias específicas aquí
  );

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          marginBottom: "20px",
        }}
      >
        {/* Botón para actualizar precios */}
        <Button
          style={{ marginRight: "10px" }}
          variant="contained"
          color="primary"
          onClick={() => setConfirmationDialogOpen(true)}
        >
          Actualizar Precios
        </Button>
        <TextField
          label="Porcentaje"
          type="number"
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          InputProps={{
            inputProps: {
              min: 0,
            },
          }}
          style={{ marginRight: "10px" }}
        />
      </div>

      <Dialog
        open={confirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>Confirmación</DialogTitle>
        <DialogContent>
          <p>
            ¿Estás seguro de que deseas actualizar todos los precios en un{" "}
            {percentage}% ?
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={updateAllPrices} color="primary">
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
      <Toaster />
      <MaterialReactTable
        enableHiding={false}
        enableColumnActions={false}
        // enableColumnResizing={true}

        localization={MRT_Localization_ES}
        // displayColumnDefOptions={{
        //   "mrt-row-actions": {
        //     muiTableHeadCellProps: {
        //       align: "center",
        //     },
        //     // size: 120,
        //   },
        // }}
        initialState={{
          sorting: [
            {
              id: "id",
              desc: false,
            },
          ],
        }}
        muiTableProps={{
          sx: {
            tableLayout: "fixed",
            "& .MuiTableCell-root": {
              textAlign: "center",
            },
            "& .Mui-TableHeadCell-Content": {
              justifyContent: "center",
            },
          },
        }}
        columns={columns}
        data={tableData}
        // editingMode="modal" //default

        enableEditing
        onEditingRowSave={handleSaveRowEdits}
        onEditingRowCancel={handleCancelRowEdits}
        // initialState={{
        //   columnVisibility: { id: false },
        // }}
        // renderRowActions={({ row, table }) => (
        //   <Box
        //     sx={{
        //       display: "flex",
        //       gap: "1rem",
        //       width: 20,
        //       justifyItems: "center",
        //     }}
        //   >
        //     <Tooltip arrow placement="left" title="Edit">
        //       <IconButton onClick={() => table.setEditingRow(row)}>
        //         <Edit />
        //       </IconButton>
        //     </Tooltip>
        //     <Tooltip arrow placement="right" title="Delete">
        //       <IconButton color="error" onClick={() => handleDeleteRow(row)}>
        //         <Delete />
        //       </IconButton>
        //     </Tooltip>
        //   </Box>
        // )}
        // // <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Crear Equipo</button>
        renderTopToolbarCustomActions={() => (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded "
            onClick={() => setCreateModalOpen(true)}
          >
            Crear Nuevo Producto y/o Servicio
          </button>
        )}
      />
      <CreateNewProductModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
    </>
  );
};

interface CreateModalProps {
  columns: MRT_ColumnDef<ProductData>[];
  onClose: () => void;
  onSubmit: (values: ProductData) => void;
  open: boolean;
}

//example of creating a mui dialog modal for creating new rows
export const CreateNewProductModal = ({
  open,
  columns,
  onClose,
  onSubmit,
}: CreateModalProps) => {
  const [values, setValues] = useState<any>(() =>
    columns.reduce((acc, column) => {
      acc[column.accessorKey ?? ""] = "";
      return acc;
    }, {} as any)
  );

  const handleSubmit = () => {
    //put your validation logic here
    onSubmit(values);
    onClose();
  };

  return (
    <Dialog open={open}>
      <DialogTitle textAlign="center">Crear Nuevo Equipo</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: "100%",
              minWidth: { xs: "300px", sm: "360px", md: "400px" },
              gap: "1.5rem",
            }}
          >
            {columns.map((column) => {
              if (column.accessorKey !== "id") {
                switch (column.accessorKey) {
                  case "price":
                    return (
                      <TextField
                        key={column.accessorKey}
                        label="Precio"
                        name={column.accessorKey}
                        onChange={(e) =>
                          setValues({
                            ...values,
                            [e.target.name]: e.target.value,
                          })
                        }
                        InputProps={{
                          inputComponent: NumericFormatCustom as any,
                        }}
                      />
                    );

                  default:
                    return (
                      <TextField
                        key={column.accessorKey}
                        label={column.header}
                        name={column.accessorKey}
                        onChange={(e) =>
                          setValues({
                            ...values,
                            [e.target.name]: e.target.value,
                          })
                        }
                      />
                    );
                }
              }
            })}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: "1.25rem" }}>
        <button
          className="bg-gray-400 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-10"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleSubmit}
        >
          Crear Producto
        </button>
      </DialogActions>
    </Dialog>
  );
};

const validateRequired = (value: string) => !!value.length;

export default TableProducts;
