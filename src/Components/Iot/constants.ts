import { RangeOption } from "./GraphDrawer/types";

export const RANGE_OPTIONS: RangeOption[] = [
  { label: '1 HORA', hours: 1 },
  { label: '6 HORAS', hours: 6 },
  { label: '1 DÍA', hours: 24 },
  { label: '1 SEMANA', hours: 24 * 7 },
  { label: 'Personalizado', isCustom: true } // Nuevo botón
];
