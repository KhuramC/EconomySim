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
        maxWidth="1000px"
        minWidth="500px"
      >
          <h1>About</h1>
          <Typography variant="h5" color="white" sx={{fontWeight: "bold",paddingBottom: 2, paddingTop: 1}}>
            Mission Statement
          </Typography>
          <Typography variant="body1" color="white" sx={{paddingLeft: 10, paddingRight: 10}} >
            As a team, Team JellyBean wants to represent the culmination of our education and knowledge up to this point.
            The team strives to be as accurate as possible and deliver the best product under our abilities. 
          </Typography>
          <Typography variant="h5" color="white" sx={{fontWeight: "bold",paddingBottom: 2, paddingTop: 1}}>
            Problem Statement
          </Typography>
          <Typography variant="body1" color="white" sx={{paddingLeft: 10, paddingRight: 10}}>
            Many people question the economic decisions of the past and present solely due to their political affiliations. This can lead to people being against decisions simply because it was proposed by a party they don't support.
            This can be problematic as it leads to society as a whole becoming more closed minded and voting based on affiliation rather than policy and reason.
          </Typography>
          <Typography variant="h5" color="white" sx={{fontWeight: "bold",paddingBottom: 2, paddingTop: 1}}>
            Problem Resolution
          </Typography>
          <Typography variant="body1" color="white" sx={{paddingLeft: 10, paddingRight: 10}}>
            Our solution is a simulation that allows users to change variables that affect a virtual economy. This should decouple economic policies and their perceived political affiliations.
            Decisions would be destigmatized while allowing the user to have a greater understanding of how an economy works.
          </Typography>
      </Box>
    </Container>
  );
}

export default About;
