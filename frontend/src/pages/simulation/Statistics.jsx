// src/pages/simulation/Statistics.jsx
import React, { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { Chart as ChartJS } from "chart.js/auto";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import AddIcon from "@mui/icons-material/Add";

import TimelinePanel from "../../components/TimelinePanel";
import GraphSlot from "../../components/GraphSlot";

export default function Statistics() {
  // Demo values (wire these to real state later)
  const year = 5;
  const week = 5;
  const totalWeeks = 52;

  // Demo controls for "Add New Graph"
  const [metric, setMetric] = useState("GDP");
  const [startUnit, setStartUnit] = useState("week");
  const [graphs, setGraphs] = useState([["GDP", "week"]]);

  const handleGenerate = () => {
    setGraphs((prevGraphs) => [...prevGraphs, [metric, startUnit]]);
  };
  return (
    <Box>
      {/* Top-right date info (same placement as Overview) */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "right" }}
        >
          Year {year} &nbsp;&nbsp; Week {week} of {totalWeeks}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* MAIN COLUMN */}
        <Grid
          item
          xs={12}
          md={8}
          sx={{ display: "flex", flexDirection: "column" }}
        >
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Statistics
          </Typography>

          {graphs.map(([title, period], index) => (
  <React.Fragment key={index}>
    <Box sx={{ mb: 2 }}>
      <GraphSlot
        title={`${title} Graph`}
        onOpen={() => console.log(`Open ${title} Graph`)}
      />
    </Box>

    <Typography
      variant="body2"
      sx={{
        mt: -1,
        mb: 2,
        fontWeight: 600,
        color: "text.secondary",
      }}
    >
      {title} Distribution Over Time
    </Typography>
  </React.Fragment>
))}
        </Grid>

        {/* RIGHT COLUMN */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{ display: "flex", flexDirection: "column" }}
        >
          {/* Current Policies */}

          {/* Add New Graph panel */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Add New Graph
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="metric-label">Select Variable</InputLabel>
              <Select
                labelId="metric-label"
                label="Select Variable"
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
              >
                <MenuItem value="GDP">GDP</MenuItem>
                <MenuItem value="UNEMPLOYMENT">Unemployment</MenuItem>
                <MenuItem value="CPI">CPI</MenuItem>
                <MenuItem value="WEALTH">Wealth Distribution</MenuItem>
              </Select>
            </FormControl>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              Select Start Date
            </Typography>

            {/* More visible & translucent toggle buttons */}
            <ToggleButtonGroup
              exclusive
              value={startUnit}
              onChange={(_, v) => v && setStartUnit(v)}
              sx={{
                mb: 2,
                "& .MuiToggleButton-root": {
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  color: "rgba(0,0,0,0.75)",
                  backgroundColor: "rgba(0,0,0,0.05)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "rgba(0,0,0,0.08)",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "rgba(25, 118, 210, 0.2)", // soft primary tint
                    color: "#1976d2",
                    borderColor: "rgba(25,118,210,0.3)",
                    "&:hover": {
                      backgroundColor: "rgba(25,118,210,0.3)",
                    },
                  },
                },
              }}
            >
              <ToggleButton value="year" size="small">
                Year
              </ToggleButton>
              <ToggleButton value="week" size="small">
                Week
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ fontWeight: 700 }}
              onClick={handleGenerate}
            >
              Generate
            </Button>
          </Paper>
          {/* Timeline controls */}
          <TimelinePanel />
        </Grid>
      </Grid>
    </Box>
  );
}
