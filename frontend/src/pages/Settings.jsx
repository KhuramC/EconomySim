import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  createTheme,
  ThemeProvider,
  Box,
  Grid,
  Paper,
  Container,
  Typography,
  Stack
} from "@mui/material";

function Settings() {
  const [volume, setVolume] = useState(50); // start at 50%

  return (
    <Box p={4} height="100vh">
      {/* Header at the very top */}
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {/* Grid row for label + slider */}
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Typography>Volume Control:</Typography>
        </Grid>
        <Grid item>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </Grid>
        <Grid item>
          <Typography>{volume}%</Typography>
        </Grid>
      </Grid>
    </Box>
        
  );
}

export default Settings;
