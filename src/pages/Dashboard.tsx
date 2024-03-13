import { useEffect, useMemo, useState } from "react";
import { FileData } from "../Components/TableFiles";
import axios from "axios";
import MaterialReactTable, { MRT_ColumnDef } from "material-react-table";
import { differenceInDays, format } from "date-fns";
import { Cancel, CheckCircle, Warning } from "@mui/icons-material";
import { api } from "../config";

const apiUrl = api();

const Dashboard: React.FC = () => {
  const [tableData, setTableData] = useState<FileData[]>([]);

  // Fetch files data
  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${apiUrl}/files/next-to-expire`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.statusText === "OK") {
        // @ts-ignore: Ignorar el error en esta línea
        setTableData(response.data);
      }
    } catch (error) {
      console.error("Error fetching file data:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  //@ts-ignore
  const columns = useMemo<MRT_ColumnDef<FileData>[]>(() => [
    {
      accessorKey: "id", //access nested data with dot notation
      header: "ID",
      size: 10,
      enableEditing: false,
    },
    {
      accessorKey: "nextCalibrationDate", //access nested data with dot notation
      header: "Proxima Fecha de Calibración",
      size: 350,
      Cell: ({ row }) => {
        const now = new Date();
        const nextCalibrationDate = new Date(row.original.nextCalibrationDate);
        const daysRemaining = differenceInDays(nextCalibrationDate, now);
        const formattedCalibrationDate = format(
          nextCalibrationDate,
          "yyyy-MM-dd"
        );

        let icon;
        if (daysRemaining > 45) {
          icon = <CheckCircle sx={{ color: "green" }} />;
        } else if (daysRemaining > 15) {
          icon = <Warning sx={{ color: "orange" }} />;
        } else {
          icon = <Cancel sx={{ color: "red" }} />;
        }

        return (
          <div className="flex flex-col ">
            <div>
              {icon}
              <span className="ml-2">{formattedCalibrationDate}</span>
            </div>
            <span
              className={`mt-2 ${
                daysRemaining < 0 ? "text-red-500 font-bold" : ""
              }`}
            >
              {daysRemaining < 0
                ? "VENCIDO"
                : `Días restantes: ${daysRemaining}`}
            </span>
          </div>
        );
      },

      type: "lastdate",
    },
    {
      accessorKey: "customer.nombre", //access nested data with dot notation
      header: "Compañia",
      size: 150,
      enableEditing: false,
      type: "selectCustomerId",
    },
    {
      accessorKey: "device.name", //access nested data with dot notation
      header: "Equipo",
      enableEditing: false,
      size: 150,
      type: "selectDeviceId",
    },
    {
      accessorKey: "certificateType.name", //access nested data with dot notation
      header: "Tipo de Certificado",
      size: 150,
      enableEditing: false,
      type: "selectCertificateTypeId",
    },
    {
      accessorKey: "name", //access nested data with dot notation
      header: "Nombre",
      enableEditing: false,
      size: 150,
    },
    {
      accessorKey: "city", //access nested data with dot notation
      header: "Ciudad",
      size: 150,
    },
    {
      accessorKey: "location", //access nested data with dot notation
      header: "Ubicación",
      size: 150,
    },
    {
      accessorKey: "sede", //access nested data with dot notation
      header: "Sede",
      size: 150,
    },
    {
      accessorKey: "activoFijo", //access nested data with dot notation
      header: "Activo Fijo",
      size: 150,
    },
    {
      accessorKey: "serie", //access nested data with dot notation
      header: "Serie",
      size: 150,
    },
    {
      accessorKey: "calibrationDate", //access nested data with dot notation
      header: "Fecha de Calibración",
      size: 250,

      Cell: ({ cell }) => (
        <span>{cell.getValue<string>().substring(0, 10)}</span>
      ),

      type: "date",
    },

    {
      accessorKey: "filePath", //access nested data with dot notation
      header: "filePath",
      size: 150,
      hidden: true,
      enableEditing: false,
      // Cell : (w) => w.column.getIsVisible(),
      type: "upload",
    },
  ]);

  if (tableData.length < 1) {
    return <div>Certificados al dia</div>;
  }

  return (
    <MaterialReactTable
      displayColumnDefOptions={{
        "mrt-row-actions": {
          muiTableHeadCellProps: {
            align: "center",
          },
          size: 120,
        },
      }}
      columns={columns}
      data={tableData}
      enableColumnOrdering
      enableHiding={false}
      initialState={{
        columnVisibility: {
          filePath: false,
          id: false,
          "certificateType.name": false,
          name: false,
          activoFijo: false,
        },
      }}
    />
  );
};

export default Dashboard;
