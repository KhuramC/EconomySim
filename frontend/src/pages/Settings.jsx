import { useState } from "react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { usePopEffect } from "../hooks/usePopEffect";
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

function Settings({textSize, setTextSize, volume, setVolume}) {
  
  usePopEffect(volume, volume / 100);
  return (
    <Box p={10} height="100vh">
      {/* Header at the very top */}
      <h1>
        Settings
      </h1>

      {/* One row = label + slider + value */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={3}>
          <Typography style={{ 
           width: "130px",
           textAlign: "left",
           fontSize: `${textSize}px`,
           transition: "font-size 0.2s ease" }} >
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
        <Typography style={{
          width: "60px", 
          textAlign: "right", 
          fontSize: `${textSize}px`,
          transition: "font-size 0.2s ease" }} >
          {volume}%
        </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
        <Grid item xs={3}>
          <Typography style={{ width: "130px", textAlign: "left", fontSize: `${textSize}px`, transition: "font-size 0.2s ease" }}>Text Size:</Typography>
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
          <Typography style={{
            width: "60px", 
            textAlign: "right", 
            fontSize: `${textSize}px`,
            transition: "font-size 0.2s ease" }} >
            {textSize}px
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Settings;