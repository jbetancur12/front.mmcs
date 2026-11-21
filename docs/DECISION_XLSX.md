# `xlsx` (SheetJS) 0.18.5: se queda, solo para escribir

Decisión del 2026-11-20.

## El aviso

`npm audit` marca `xlsx@0.18.5` por dos fallas conocidas: contaminación de prototipo (CVE-2023-30533) y ReDoS (CVE-2024-22363). Las versiones corregidas (0.19.3 y 0.20.x) **no están en npm**: SheetJS solo las publica en su propio CDN.

## Por qué no nos afecta

Las dos fallas se producen al **leer** un archivo Excel armado a propósito. En `src/` el paquete solo se usa para **escribir** (exportar a Excel con `XLSX.writeFile`, importado dinámicamente en 8 sitios). No hay ningún `XLSX.read`, `readFile` ni `sheet_to_json`. La carga de Excel de la plataforma (`AnalyzeExcelComponent`, `Zip`) lee con `xlsx-populate`, que es otra librería.

## Reglas

- No uses `XLSX.read` ni `XLSX.readFile` con archivos que suba una persona. Para leer, usa `xlsx-populate` (como `AnalyzeExcelComponent`).
- Si algún día hace falta leer con SheetJS, no se queda en 0.18.5: hay que pasar a la versión corregida del CDN de SheetJS o migrar a otra librería.
- Para comprobar que sigue siendo cierto: `grep -rn "XLSX\.read\|readFile\|sheet_to_json" src` debe seguir vacío.

## API

El API tenía `xlsx` en `package.json` sin importarlo en ningún archivo; se quitó el 2026-11-20. Sus Excel (reporte gerencial, LMS) usan `exceljs`.
