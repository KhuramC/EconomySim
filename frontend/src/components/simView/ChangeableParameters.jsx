import { Grid, Typography, Paper } from "@mui/material";

/**
 * A panel noting that the asssociated parameters can be changed.
 */
const ChangeableParameters = () => {
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
          • These values can be adjusted while the simulation is running.
          <br />• Use Setup for initial values; refine here during a run as
          needed.
        </Typography>
      </Paper>
    </Grid>
  );
};

export default ChangeableParameters;
