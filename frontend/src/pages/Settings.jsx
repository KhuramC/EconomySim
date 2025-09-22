import { useState } from "react";
import { useEffect, useRef } from "react";
import { useAppSettings } from "../context/AppSettingsContext";
import { usePopEffect } from "../hooks/usePopEffect";
import PageTitle from "../components/PageTitle";
import {
  Box,
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  useTheme
} from "@mui/material";

function Settings() {
  const { textSize, setTextSize, volume, setVolume, mode, setMode } = useAppSettings();

  usePopEffect(volume, volume / 100);
  const theme = useTheme();

  // Toggle handler for dark/light mode
  const handleModeToggle = () => setMode(mode === "light" ? "dark" : "light");

  // Determine slider color based on current mode
  const sliderColor = theme.palette.mode === "light" 
    ? theme.palette.primary.light 
    : theme.palette.primary.dark;

  return (
    <Box p={0} height="80vh">
      {/* Header */}
        <PageTitle text="Settings"/>

      {/* Dark/Light Mode Toggle */}
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
        <Grid item xs={3}></Grid>
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
            style={{
              width: "100%",
              accentColor: sliderColor // this makes the slider thumb and track match the toggle
            }}
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
            style={{
              width: "100%",
              accentColor: sliderColor
            }}
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
