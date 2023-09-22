import { Delete, Edit } from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip
} from '@mui/material';
import axios from 'axios';
import {
  MaterialReactTable,
  type MRT_Cell,
  type MRT_ColumnDef,
  type MRT_Row,
  type MaterialReactTableProps,
} from 'material-react-table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

// Define interfaces
export interface CertificateTypeData {
  id: number;
  name: string;
}


// API URL
const apiUrl = import.meta.env.VITE_API_URL;

// Main component
const Table: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableData, setTableData] = useState<CertificateTypeData[]>([]);
  // const [filteredTableData, setFilteredTableData] = useState<CertificateTypeData[]>([]);

  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string;
  }>({});

  // Create a new certificateType
  const onCreateCertificateType = async (certificateTypeData: CertificateTypeData) => {

    try {
      const response = await axios.post(`${apiUrl}/certificateTypes`, {name: certificateTypeData.name} , {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
        },
      });

      if (response.status === 201) {
        toast.success('Equipo Creado Exitosamente!', {
          duration: 4000,
          position: 'top-center',
        });
        fetchUsers(); // Refresh data after creation
      } else {
        console.error('Error al crear tipo de certificado');
      }
    } catch (error) {
      console.error('Error de red:', error);
    }
  };

  // Fetch certificateTypes data
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${apiUrl}/certificateTypes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
        },
      });


      if (response.statusText === 'OK') {
        // @ts-ignore: Ignorar el error en esta línea
        setTableData(response.data);
      }
    } catch (error) {
      console.error('Error fetching certificateType data:', error);
    }
  };


  // const updateUser = async (certificateTypeData: CertificateTypeData) => {

  //   try {
  //     const response = await axios.put(`${apiUrl}/certificateTypes/${certificateTypeData.id}`, certificateTypeData, {
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
  //       console.error('Error al crear tipo de certificado');
  //     }
  //   } catch (error) {
  //     console.error('Error de red:', error);
  //   }
  // }

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateNewRow = (values: CertificateTypeData) => {
    onCreateCertificateType(values);
    setCreateModalOpen(false);
  };

  const handleSaveRowEdits: MaterialReactTableProps<CertificateTypeData>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {

      if (!Object.keys(validationErrors).length) {
        const updatedValues = { ...values };
        delete updatedValues.id;
        try {
          const response = await axios.put(`${apiUrl}/certificateTypes/${values.id}`, updatedValues, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
            },
          });

          if (response.status === 201) {
            toast.success('Equipo Modificado Exitosamente!', {
              duration: 4000,
              position: 'top-center',
            });
            tableData[row.index] = values;
            setTableData([...tableData]);
          } else {
            console.error('Error al crear tipo de certificado');
          }
        } catch (error) {
          console.error('Error de red:', error);
        }

        exitEditingMode(); //required to exit editing mode and close modal
      }
    };

  const handleCancelRowEdits = () => {
    setValidationErrors({});
  };

  const deleteUser = async (rowIndex: number, id: number) => {
    try {
      const response = await axios.delete(`${apiUrl}/certificateTypes/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("accessToken")}`
        },
      });

      if (response.status === 201) {
        toast.success('Equipo Eliminado Exitosamente!', {
          duration: 4000,
          position: 'top-center',
        });
        tableData.splice(rowIndex, 1);
        setTableData([...tableData]);
      } else {
        console.error('Error al crear tipo de certificado');
      }
    } catch (error) {
      console.error('Error de red:', error);
    }
  }

  const handleDeleteRow = useCallback(
    (row: MRT_Row<CertificateTypeData>) => {
      if (
        !confirm(`Are you sure you want to delete ${row.getValue('name')}`)
      ) {
        return;
      }
      deleteUser(row.index, row.getValue('id'))
      tableData.splice(row.index, 1);
      setTableData([...tableData]);
    },
    [tableData],
  );

  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<CertificateTypeData>,
    ): MRT_ColumnDef<CertificateTypeData>['muiTableBodyCellEditTextFieldProps'] => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: (event) => {
          const isValid =
            cell.column.id === 'email'
              ? validateEmail(event.target.value)
              : cell.column.id === 'age'
                ? validateAge(+event.target.value)
                : validateRequired(event.target.value);
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
    [validationErrors],
  );


  //should be memoized or stable
  const columns = useMemo<MRT_ColumnDef<CertificateTypeData>[]>(
    () => [
      {
        accessorKey: 'id', //access nested data with dot notation
        header: 'ID',
        size: 10,
        enableEditing: false,
      },
      {
        accessorKey: 'name', //access nested data with dot notation
        header: 'Nombre',
        size: 150,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },


    ],
    [getCommonEditTextFieldProps],
  );



  return (
    <>
      <Toaster />
      <MaterialReactTable
        displayColumnDefOptions={{
          'mrt-row-actions': {
            muiTableHeadCellProps: {
              align: 'center',
            },
            size: 120,
          },
        }}
        columns={columns}
        data={tableData}
        editingMode="modal" //default
        enableColumnOrdering
        enableEditing
        onEditingRowSave={handleSaveRowEdits}
        onEditingRowCancel={handleCancelRowEdits}
        renderRowActions={({ row, table }) => (
          <Box sx={{ display: 'flex', gap: '1rem' }}>
            <Tooltip arrow placement="left" title="Edit">
              <IconButton onClick={() => table.setEditingRow(row)}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip arrow placement="right" title="Delete">
              <IconButton color="error" onClick={() => handleDeleteRow(row)}>
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        // <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Crear Equipo</button>
        renderTopToolbarCustomActions={() => (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded "
            onClick={() => setCreateModalOpen(true)}

          >
            Crear Nuevo Tipo de Certificado
          </button>
        )}
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
  columns: MRT_ColumnDef<CertificateTypeData>[];
  onClose: () => void;
  onSubmit: (values: CertificateTypeData) => void;
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
      acc[column.accessorKey ?? ''] = '';
      return acc;
    }, {} as any),
  );

  const handleSubmit = () => {
    //put your validation logic here
    onSubmit(values);
    onClose();
  };

  return (
    <Dialog open={open}>
      <DialogTitle textAlign="center">Crear Nuevo Tipo de Certificado</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: '100%',
              minWidth: { xs: '300px', sm: '360px', md: '400px' },
              gap: '1.5rem',
            }}
          >
            {columns.map((column) => (
              column.accessorKey !== 'id' && <TextField
                key={column.accessorKey}
                label={column.header}
                name={column.accessorKey}
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })
                }
              />
            ))}

          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <button className="bg-gray-400 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-10" onClick={onClose} >Cancelar</button>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleSubmit} >
          Crear Tipo de Certificado
        </button>
      </DialogActions>
    </Dialog>
  );
};

const validateRequired = (value: string) => !!value.length;
const validateEmail = (email: string) =>
  !!email.length &&
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
const validateAge = (age: number) => age >= 18 && age <= 50;


export default Table;