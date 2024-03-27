import React from "react";
// Asegúrate de importar el tipo QuoteData adecuado
import "./QuotePDF.css"; // Importa tu hoja de estilos CSS personalizada
import { QuoteData } from "./TableQuotes";
import { format } from "date-fns";

interface Props {
  quoteData: QuoteData;
}

const QuotePDF: React.FC<Props> = ({ quoteData }) => {
  return (
    <div className="quote-pdf">
      <div className="p-6 shadow-md mb-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3 bg-[#9AF18B] text-white  w-3/4 px-4 border border-black flex items-center justify-center">
            <h1 className="text-xl font-semibold">Cotización</h1>
          </div>
          <div className="col-span-3 bg-transparent border border-black flex items-center justify-center">
            <p className="text-lg font-semibold">{quoteData.id}</p>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-4 bg-[#9AF18B] text-white px-4 border border-black flex items-center justify-center">
            <h1 className="text-xl font-semibold">Fecha de Elaboración</h1>
          </div>
          <div className="col-span-3 bg-transparent border border-black flex items-center justify-center">
            <p className="text-lg font-semibold">
              {format(new Date(quoteData.createdAt), "yyyy-MM-dd")}
            </p>
          </div>
          <div className="col-span-2 bg-[#9AF18B] text-white px-4 border border-black flex items-center justify-center">
            <h1 className="text-xl font-semibold">Ciudad</h1>
          </div>
          <div className="col-span-3 bg-transparent border border-black flex items-center justify-center">
            <p className="text-lg font-semibold">{quoteData.customer.ciudad}</p>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-2 bg-[#9AF18B] text-white px-4 border border-black flex items-center justify-center">
            <h1 className="text-xl font-semibold">Cliente</h1>
          </div>
          <div className="col-span-5 bg-transparent border border-black flex items-center justify-center">
            <p className="text-lg font-semibold">{quoteData.customer.nombre}</p>
          </div>
          <div className="col-span-2 bg-[#9AF18B] text-white px-4 border border-black flex items-center justify-center">
            <h1 className="text-xl font-semibold">Telefono</h1>
          </div>
          <div className="col-span-3 bg-transparent border border-black flex items-center justify-center">
            <p className="text-lg font-semibold">
              {quoteData.customer.telefono}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-3 bg-[#9AF18B] text-white px-4 border border-black flex items-center justify-center">
            <h1 className="text-xl font-semibold">Dirección</h1>
          </div>
          <div className="col-span-9 bg-transparent border border-black flex items-center justify-center">
            <p className="text-lg font-semibold">
              {quoteData.customer.direccion}
            </p>
          </div>
        </div>
        {/* Añade más elementos según sea necesario */}
        <table className="mt-8 border-collapse">
          <thead>
            <tr>
              <th className="bg-[#9AF18B]">Item</th>
              <th className="bg-[#9AF18B]">Nombre</th>
              <th className="bg-[#9AF18B]">Cantidad</th>
              <th className="bg-[#9AF18B]">Precio</th>
              <th className="bg-[#9AF18B]">Total</th>
            </tr>
          </thead>
          <tbody>
            {quoteData.products.map((product: any, index: any) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{product.name}</td>
                <td>{product.quantity}</td>
                <td>
                  $
                  {product.price.toLocaleString("es-ES", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td>
                  $
                  {(product.price * product.quantity).toLocaleString("es-ES", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={3} className="border-none"></td>
              <td className="border-none font-semibold text-end">Subtotal</td>
              <td>
                $
                {quoteData.subtotal.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                })}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="border-none "></td>
              <td className="border-none font-semibold text-end">
                Descuento ({quoteData.discountRatio}%)
              </td>
              <td>
                $
                {quoteData.discountTotal.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                })}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="border-none"></td>
              <td className="border-none font-semibold text-end">
                IVA ({quoteData.taxRatio}%)
              </td>
              <td>
                $
                {quoteData.taxTotal.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                })}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="border-none"></td>
              <td className="border-none font-semibold text-end">Total</td>
              <td>
                $
                {quoteData.total.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="border  border-black ">
          <h1 className="text-xl font-semibold p-2 border-b border-black bg-[#9AF18B]">
            Observaciones:
          </h1>
          <div className="text-lg p-2 min-h-[100px]">
            {quoteData.observations}
          </div>
        </div>
        <div className="text-center mt-8">
          <p className="mb-4">
            Nombre: ___________________________________________{" "}
          </p>
          <p className="mb-8">
            Firma: ___________________________________________{" "}
          </p>
          <p className="mb-0.5">
            Metromedics S.A.S Nit. 900.816.433-3 Dosquebradas - Risaralda
          </p>
          <p className="mb-0.5">
            Contactenos: 3138124282 - (606) 3256584
            comercial@metromedicslab.com.co
          </p>
          <p className="mb-0.5">www.metromedics.co</p>
        </div>
      </div>
    </div>
  );
};

export default QuotePDF;
