import { Delete, Download, Edit, Print, Visibility } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import axios from "axios";
import {
  MaterialReactTable,
  type MRT_Cell,
  type MRT_ColumnDef,
  type MRT_Row,
  type MaterialReactTableProps,
} from "material-react-table";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../config";
import { MRT_Localization_ES } from "material-react-table/locales/es";
import { format } from "date-fns";
import QuoteForm from "./QuoteForm";
import { Link } from "react-router-dom";
import { BlobProvider, PDFDownloadLink, usePDF } from "@react-pdf/renderer";
import QuotePDF from "./QuotePDF";
import DownloadPDFButton from "./Download";

// Define interfaces
export interface QuoteData {
  id: number;
  products: any; // Se puede reemplazar por un tipo específico si conoces la estructura de los productos
  subtotal: number;
  discountRatio: number;
  total: number;
  taxRatio: number;
  taxTotal: number;
  discountTotal: number;
  observations: string;
  customer: {
    nombre: string;
  };
  createdAt: string;
}

// API URL
const apiUrl = api();

// Main component
const Table: React.FC = () => {
  const [tableData, setTableData] = useState<QuoteData[]>([]);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch devices data
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${apiUrl}/quotes`, {
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

  useEffect(() => {
    fetchUsers();
  }, []);

  //should be memoized or stable
  const columns = useMemo<MRT_ColumnDef<QuoteData>[]>(
    () => [
      {
        accessorKey: "id",
        header: "# Cotización",
      },
      {
        accessorKey: "customer.nombre",
        header: "Cliente",
      },
      {
        accessorKey: "createdAt",
        header: "Fecha",
        Cell: ({ row }) =>
          format(new Date(row.original.createdAt), "yyyy-MM-dd"),
      },
      {
        accessorKey: "total",
        header: "Total",
        Cell: ({ row }) =>
          new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
          }).format(row.original.total),
      },
    ],
    [] // No hay dependencias específicas aquí
  );

  return (
    <>
      <Toaster />
      <Link to="new-quote">
        <Button variant="contained" color="primary">
          Crear Cotización
        </Button>
      </Link>
      <MaterialReactTable
        enableHiding={false}
        enableColumnActions={false}
        enableRowActions={true}
        // enableColumnResizing={true}
        positionActionsColumn="last"
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
              <Tooltip arrow placement="right" title="Ver">
                <Link to={`${row.original.id}`}>
                  <Visibility />
                </Link>
              </Tooltip>
              <Tooltip arrow placement="right" title="Ver">
                <BlobProvider document={<QuotePDF quoteData={row.original} />}>
                  {({ url }) => (
                    <a href={url || ""} target="_blank">
                      <Print />
                    </a>
                  )}
                </BlobProvider>
              </Tooltip>
              <Tooltip arrow placement="right" title="descargar">
                <PDFDownloadLink
                  document={<QuotePDF quoteData={row.original} />}
                  fileName={"Cotización-" + row.original.id + ".pdf"}
                >
                  <Download />
                </PDFDownloadLink>
              </Tooltip>
            </Box>
          );
        }}
      />
    </>
  );
};

//example of creating a mui dialog modal for creating new rows

export default Table;
