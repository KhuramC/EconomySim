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
  Stack,
} from "@mui/material";

function Home() {
  return (
    <>
      <h1>Welcome</h1>
      <Button variant="contained">Start Simulation</Button>
    </>
  );
}

export default Home;
