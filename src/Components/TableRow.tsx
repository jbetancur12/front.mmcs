// TableRow.tsx
import React from "react";

interface TableRowProps {
  item: any; // Tu tipo de datos
}

const TableRow: React.FC<TableRowProps> = ({ item }) => {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        {/* Contenido para la columna 1 */}
        {item.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {/* Contenido para la columna 2 */}
        {item.cliente}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {/* Contenido para la columna 3 */}
        {item.fecha}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {/* Contenido para la columna 3 */}
        {item.total}
      </td>
      {/* Agregar más columnas según sea necesario */}
    </tr>
  );
};

export default TableRow;
