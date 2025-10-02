import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Container, Typography, Box} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

function Home() {
  const handleStart = () => {
    console.log("Simulation started!");
  };

  return (
      <Container maxWidth="sm">
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="80vh"
          textAlign="center"
        >
          <h1>Economy Simulation</h1>
          <h2>by JellyBean</h2>
          <Typography variant="body2" color="white" gutterBottom>
            Test your strategy and decision-making in a dynamic economy.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={handleStart}
            sx={{ mt: 3, borderRadius: 2 }}
          >
            Start Simulation
          </Button>
        </Box>
      </Container>
  );

}

export default Home;
