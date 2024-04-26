import {
  Grid,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ComponentsCertificateProps } from "../Types";

const ResolutionAndExactitude = ({
  handleChange,
  formData,
  error,
}: ComponentsCertificateProps) => {
  return (
    <Paper elevation={3} style={{ padding: 20 }}>
      <Typography variant="h5">Resolución y Exactitud</Typography>
      <Grid container spacing={1} width={500} padding={1}>
        <Grid item xs={6}>
          <Stack spacing={2} width={200} justifyContent={"center"}>
            <Typography variant="body1">Equipo Bajo Prueba</Typography>
            <TextField
              error={error && formData.decimalPlaces === ""}
              variant="outlined"
              label={`Resolución`}
              name="decimalPlaces"
              type="number"
              inputProps={{
                min: 0,
              }}
              value={formData.decimalPlaces}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {formData.unit}
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              error={error && formData.exactitudValue === ""}
              variant="outlined"
              label={`Exactitud`}
              name="exactitudValue"
              type="number"
              value={formData.exactitudValue}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">{"%"}</InputAdornment>
                ),
              }}
            />
            <TextField
              error={error && formData.exactitudUnitValue === ""}
              variant="outlined"
              label={`Exactitud`}
              name="exactitudUnitValue"
              type="number"
              value={formData.exactitudUnitValue}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {formData.unit}
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </Grid>
        <Grid item xs={6}>
          <Stack spacing={2} width={200}>
            <Typography variant="body1">Equipo Patrón</Typography>
            <TextField
              error={error && formData.decimalPlacesPatron === ""}
              variant="outlined"
              label={`Resolución`}
              name="decimalPlacesPatron"
              type="number"
              value={formData.decimalPlacesPatron}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {formData.unit}
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              error={error && formData.exactitudPatron === ""}
              variant="outlined"
              label={`Exactitud`}
              name="exactitudPatron"
              type="number"
              value={formData.exactitudPatron}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">{"%"}</InputAdornment>
                ),
              }}
            />
            <TextField
              error={error && formData.exactitudUnitPatron === ""}
              variant="outlined"
              label={`Exactitud`}
              name="exactitudUnitPatron"
              type="number"
              value={formData.exactitudUnitPatron}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {formData.unit}
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ResolutionAndExactitude;
