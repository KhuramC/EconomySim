import PageTitle from "../components/PageTitle";
import { useAppSettings } from "../context/AppSettingsContext";
import { Box, Container, Typography, Grid, Paper } from "@mui/material";

function About() {
  const { textSize } = useAppSettings();

  const sections = [
    {
      title: "Mission Statement",
      body: `As a team, Team JellyBean wants to represent the culmination of our education and knowledge up to this point.
             The team strives to be as accurate as possible and deliver the best product under our abilities.`,
    },
    {
      title: "Problem Statement",
      body: `Many people question the economic decisions of the past and present solely due to their political affiliations. 
             This can lead to people being against decisions simply because it was proposed by a party they don't support.
             This can be problematic as it leads to society as a whole becoming more closed minded and voting based on affiliation rather than policy and reason.`,
    },
    {
      title: "Problem Resolution",
      body: `Our solution is a simulation that allows users to change variables that affect a virtual economy. 
             This should decouple economic policies and their perceived political affiliations.
             Decisions would be destigmatized while allowing the user to have a greater understanding of how an economy works.`,
    },
  ];

  return (
    <Container maxWidth={false} sx={{ px: 4 }}>
      <Box display="flex" flexDirection="column" mt={4} height="80vh">
        <PageTitle text="About" />

        {/* Titles row */}
        <Box display="flex" justifyContent="space-between" mt={2}>
          {sections.map((section) => (
            <Paper
              key={section.title}
              elevation={3}
              sx={{
                flexBasis: "32%", // ~1/3 width
                textAlign: "center",
                p: 2,
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: `${textSize * 1.2}px`,
                }}
              >
                {section.title}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Body row */}
        <Box display="flex" justifyContent="space-between" mt={1}>
          {sections.map((section) => (
            <Paper
              key={section.title + "-body"}
              elevation={1}
              sx={{
                flexBasis: "32%", // ~1/3 width
                p: 2,
                minHeight: "150px",
              }}
            >
              <Typography
                sx={{
                  fontSize: `${textSize}px`,
                  textAlign: "left",
                }}
              >
                {section.body}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    </Container>
  );
}

export default About;
