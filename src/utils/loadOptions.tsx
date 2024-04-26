import axios from "axios";
import { api } from "../config";

const apiUrl = api();

export const loadOptions = async <T,>(
  inputValue: string,
  resource: string,
  mapFunction: (item: any) => ResourceOption
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    let timer;
    const endpoint = `${apiUrl}/${resource}`; // Construir la URL del endpoint
    const fetchData = async () => {
      try {
        const response = await axios.get(endpoint, {
          params: { q: inputValue },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        const data = response.data;
        const options = data.map((item: any) => mapFunction(item));

        resolve(options); // Aplicar la función de mapeo
      } catch (error) {
        console.error("Error al cargar opciones:", error);
        reject(error);
      }
    };
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(fetchData, 1000); // Establecer el debounce en 1000ms
  });
};

export interface ResourceOption {
  value: number; // Tipo adecuado para el valor
  label: string; // Tipo adecuado para la etiqueta
}

export const mapOptions = (
  option: any,
  valueProperty: string, // Nombre de la propiedad a utilizar como valor
  labelProperty: string // Nombre de la propiedad a utilizar como etiqueta
): ResourceOption => ({
  value: option[valueProperty], // Utiliza la propiedad especificada como valor
  label: option[labelProperty], // Utiliza la propiedad especificada como etiqueta
});
