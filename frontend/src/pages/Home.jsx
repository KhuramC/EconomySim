import { Container, Typography, Box, Stack, Button } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import heroImage from "../assets/PlaceholderTitleImage.jpg"; // replace with your image path

function Home({ onStart }) {
  const navbarHeight = 64; // adjust to match your AppBar height

  return (
    <Box>
      {/* Hero Image */}
      <Box
        component="img"
        src={heroImage}
        alt="Economy Simulation Hero"
        sx={{
          width: "100%",
          height: `calc(55vh - ${navbarHeight}px)`, // fills space up to navbar
          objectFit: "cover", // scales and crops as needed
        }}
      />

      {/* Text Content */}
      <Container maxWidth="md" sx={{ textAlign: "center", mt: 2, mb: 4 }}>
        <Stack spacing={2} alignItems="center">
          <Typography variant="h2" sx={{ fontWeight: "bold" }}>
            Rat Race
          </Typography>
          <Typography variant="h5" color="text.secondary">
            Test your strategy and decision-making in a dynamic economy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            by JellyBean
          </Typography>

          {/* Call-to-action button */}
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={onStart}
            sx={{ mt: 3, borderRadius: 2 }}
          >
            Begin Simulation
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

export default Home;
