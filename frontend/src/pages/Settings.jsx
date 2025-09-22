import { useState } from "react";
import { useEffect, useRef } from "react";
import { usePopEffect } from "../hooks/usePopEffect";
import {
  Box,
  Grid,
  Typography,
  Switch,
  FormControlLabel
} from "@mui/material";

function Settings({ textSize, setTextSize, volume, setVolume, mode, setMode }) {

  usePopEffect(volume, volume / 100);

  // Toggle handler for dark/light mode
  const handleModeToggle = () => setMode(mode === "light" ? "dark" : "light");

  return (
    <Box p={10} height="100vh">
      {/* Header */}
      <h1>Settings</h1>

      {/* Dark/Light Mode Toggle in Grid */}
      <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
        <Grid item xs={3}>
          <Typography
            style={{
              width: "130px",
              textAlign: "left",
              fontSize: `${textSize}px`,
              transition: "font-size 0.2s ease"
            }}
          >
            Theme:
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <FormControlLabel
            control={<Switch checked={mode === "dark"} onChange={handleModeToggle} />}
            label={mode === "dark" ? "Dark Mode" : "Light Mode"}
          />
        </Grid>
        <Grid item xs={3}></Grid> {/* Empty column for alignment */}
      </Grid>

      {/* Volume Slider */}
      <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
        <Grid item xs={3}>
          <Typography
            style={{ 
              width: "130px",
              textAlign: "left",
              fontSize: `${textSize}px`,
              transition: "font-size 0.2s ease"
            }}
          >
            Volume Control:
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </Grid>
        <Grid item xs={3}>
          <Typography
            style={{
              width: "60px",
              textAlign: "right",
              fontSize: `${textSize}px`,
              transition: "font-size 0.2s ease"
            }}
          >
            {volume}%
          </Typography>
        </Grid>
      </Grid>

      {/* Text Size Slider */}
      <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
        <Grid item xs={3}>
          <Typography
            style={{
              width: "130px",
              textAlign: "left",
              fontSize: `${textSize}px`,
              transition: "font-size 0.2s ease"
            }}
          >
            Text Size:
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <input
            type="range"
            min={10}
            max={30}
            step={1}
            value={textSize}
            onChange={(e) => setTextSize(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </Grid>
        <Grid item xs={3}>
          <Typography
            style={{
              width: "60px",
              textAlign: "right",
              fontSize: `${textSize}px`,
              transition: "font-size 0.2s ease"
            }}
          >
            {textSize}px
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Settings;
