import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Typography, Box} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

function Home() {

  const navigate = useNavigate();

  const handleStart = () => {
    console.log("Navigating to setup page...");
    navigate("/setup");
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
