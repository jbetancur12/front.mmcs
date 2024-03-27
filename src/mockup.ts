// Mock data para cotizaciones
export interface Cotizacion {
    id: number;
    cliente: string;
    fecha: string;
    total: number;
  }
  
  export const cotizaciones: Cotizacion[] = [
    { id: 1, cliente: "Cliente 1", fecha: "2024-03-21", total: 500 },
    { id: 2, cliente: "Cliente 2", fecha: "2024-03-20", total: 750 },
    { id: 3, cliente: "Cliente 3", fecha: "2024-03-19", total: 900 },
    { id: 4, cliente: "Cliente 4", fecha: "2024-03-18", total: 600 },
    { id: 5, cliente: "Cliente 5", fecha: "2024-03-17", total: 800 },
    { id: 6, cliente: "Cliente 6", fecha: "2024-03-16", total: 700 },
  ];