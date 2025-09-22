import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppSettings } from "../context/AppSettingsContext";
import PageTitle from "../components/PageTitle";
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

function Tutorial() {
  
  
  return (
    <Box p={0} height="80vh">
        <PageTitle text="Tutorial" />
        <p>This is a tutorial page</p>
    </Box>
  );
}

export default Tutorial;