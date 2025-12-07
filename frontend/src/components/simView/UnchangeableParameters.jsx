import { Grid, Typography, Paper } from "@mui/material";

/**
 * A panel noting that the asssociated parameters cannot be changed.
 */
const UnchangeableParameters = () => {
  return (
    <Grid
      size={{ xs: 12, md: 4 }}
      sx={{ display: "flex", flexDirection: "column" }}
    >
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
          Notes
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "left" }}
        >
          • These values are based on initial setup parameters.
          <br />
          • Changes are locked while the simulation is running.
          <br />• Use Setup to adjust them before starting a new run.
        </Typography>
      </Paper>
    </Grid>
  );
};

export default UnchangeableParameters;
