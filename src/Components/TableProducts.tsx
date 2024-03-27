import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import axios from "axios";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import React, { useEffect, useMemo, useState } from "react";
import { Toaster } from "react-hot-toast";
import { api } from "../config";
import { MRT_Localization_ES } from "material-react-table/locales/es";

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
  // const [filteredTableData, setFilteredTableData] = useState<ProductData[]>([]);

  // Create a new device
  //   const onCreateDevice = async (deviceData: ProductData) => {
  //     try {
  //       const response = await axios.post(
  //         `${apiUrl}/devices`,
  //         { name: deviceData.name },
  //         {
  //           headers: {
  //             Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  //           },
  //         }
  //       );

  //       if (response.status === 201) {
  //         toast.success("Equipo Creado Exitosamente!", {
  //           duration: 4000,
  //           position: "top-center",
  //         });
  //         fetchUsers(); // Refresh data after creation
  //       } else {
  //         console.error("Error al crear equipo");
  //       }
  //     } catch (error) {
  //       console.error("Error de red:", error);
  //     }
  //   };

  // Fetch devices data
  const fetchUsers = async () => {
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

  // const updateUser = async (deviceData: ProductData) => {

  //   try {
  //     const response = await axios.put(`${apiUrl}/devices/${deviceData.id}`, deviceData, {
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateNewRow = () => {
    // onCreateDevice(values);
    setCreateModalOpen(false);
  };

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
      },
    ],
    [] // No hay dependencias específicas aquí
  );

  return (
    <>
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

        // enableEditing
        // onEditingRowSave={handleSaveRowEdits}
        // onEditingRowCancel={handleCancelRowEdits}
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
        // renderTopToolbarCustomActions={() => (
        //   <button
        //     className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded "
        //     onClick={() => setCreateModalOpen(true)}
        //   >
        //     Crear Nuevo Equipo
        //   </button>
        // )}
      />
      <CreateNewAccountModal
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
export const CreateNewAccountModal = ({
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
            {columns.map(
              (column) =>
                column.accessorKey !== "id" && (
                  <TextField
                    key={column.accessorKey}
                    label={column.header}
                    name={column.accessorKey}
                    onChange={(e) =>
                      setValues({ ...values, [e.target.name]: e.target.value })
                    }
                  />
                )
            )}
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
          Crear Equipo
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default TableProducts;
