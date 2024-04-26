import {
  Grid,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { ComponentsCertificateProps } from "../Types";

interface InitialConditionsProps
  extends Omit<ComponentsCertificateProps, "setFormData"> {
  data: {
    title: string;
    labelT: string;
    labelH: string;
    nameT: string;
    nameH: string;
  };
}

const InitialConditions = ({
  handleChange,
  formData,
  data,
  error,
}: InitialConditionsProps) => {
  return (
    <Paper elevation={3} style={{ padding: 20 }}>
      <Typography variant="h6">{data.title}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <TextField
                error={error && formData[data.nameT] === ""}
                variant="outlined"
                label={data.labelT}
                name={data.nameT}
                value={formData[data.nameT]}
                onChange={handleChange}
                type="number"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">°C</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                error={error && formData[data.nameH] === ""}
                variant="outlined"
                label={data.labelH}
                name={data.nameH}
                value={formData[data.nameH]}
                onChange={handleChange}
                type="number"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default InitialConditions;
