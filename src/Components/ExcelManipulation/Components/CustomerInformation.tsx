import AsyncSelect from "react-select/async";
import { Grid, Paper, Stack, TextField, Typography } from "@mui/material";
import { loadOptions, styles } from "../Utils";
import { ComponentsCertificateProps, ResourceOptionCustomer } from "../Types";

const CustomerInformation = ({
  handleChange,
  setFormData,
  formData,
  error,
}: ComponentsCertificateProps) => {
  console.log(formData.customer);
  return (
    <Paper elevation={3} style={{ padding: 20 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Información Del Cliente</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Stack spacing={2}>
              <AsyncSelect
                cacheOptions
                // defaultOptions

                placeholder="Solicitante"
                loadOptions={(inputValue) =>
                  loadOptions(inputValue, "customers", mapCustomers)
                }
                onChange={(selectedOption: any) => {
                  setFormData({
                    ...formData,
                    customer: selectedOption,
                    city:
                      selectedOption.city + " - " + selectedOption.department,
                    department: selectedOption.department,
                    address: selectedOption.address,
                  });
                }}
                styles={styles(!(error && formData.customer === null))}
              />

              <TextField
                error={error && formData.city === ""}
                variant="outlined"
                label="Ciudad"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />

              <TextField
                error={error && formData.address === ""}
                variant="outlined"
                label="Dirección"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />

              <TextField
                error={error && formData.sede === ""}
                variant="outlined"
                label="Sede"
                name="sede"
                value={formData.sede}
                onChange={handleChange}
              />
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <Stack spacing={2}>
              <TextField
                error={error && formData.calibrationDate === ""}
                variant="outlined"
                label="Fecha de Calibración"
                name="calibrationDate"
                type="date"
                value={formData.calibrationDate}
                onChange={handleChange}
              />
              <TextField
                error={error && formData.receptionDate === ""}
                variant="outlined"
                label="Fecha de Recepción"
                name="recepcionDate"
                type="date"
                value={formData.receptionDate}
                onChange={handleChange}
              />
              <TextField
                error={error && formData.verificationDate === ""}
                variant="outlined"
                label="Fecha de Verificación"
                name="verificationDate"
                type="date"
                value={formData.verificationDate}
                onChange={handleChange}
              />
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
};

const mapCustomers = (option: any): ResourceOptionCustomer => ({
  value: option.id,
  label: option.nombre,
  city: option.ciudad,
  department: option.departamento,
  address: option.direccion,
});

export default CustomerInformation;
