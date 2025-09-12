import { useState } from "react";
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

function About() {

  return (
    <Container maxWidth="md">
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, background: "#416065", color: "white" }}>
          <h1>About</h1>
          <Typography variant="body1" color="white">
            The Economy Simulation is an interactive experience where players
            explore the dynamics of supply, demand, and resource management.
            You’ll make decisions, manage resources, and adapt to market
            conditions in real time. The goal is to balance growth, stability,
            and sustainability in a competitive environment.
            Whether you’re curious about economics, testing your strategy skills,
            or just having fun, this simulation offers a streamlined but
            challenging environment to learn and play.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default About;
