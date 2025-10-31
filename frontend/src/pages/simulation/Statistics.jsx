import React, { useState, useContext, useEffect } from "react";
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
import AddIcon from "@mui/icons-material/Add";
import { SimulationContext } from "./BaseSimView.jsx";
import GraphSlot from "../../components/GraphSlot";
import { Indicators } from "../../types/Indicators";

export default function Statistics() {
  const simAPI = useContext(SimulationContext); // Get API from context

  // Demo controls for "Add New Graph"
  const [metric, setMetric] = useState(Object.values(Indicators)[0]);
  const [indicatorData, setIndicatorData] = useState(null);
  const [startUnit, setStartUnit] = useState("week");
  const [graphs, setGraphs] = useState([["gdp", "week"]]);

  useEffect(() => {
    if (!simAPI) return;

    const handleWebSocketMessage = (message) => {
      // When a step happens, request the latest indicators
      if (message.action === "step" || message.action === "reverse_step") {
        simAPI.sendMessage({ action: "get_indicators" });
      }
      // When indicator data arrives, update our state
      if (message.action === "get_indicators" && message.data) {
        console.log("Received indicator data:", message.data);
        setIndicatorData(message.data);
      }
    };

    // Add the listener
    simAPI.addMessageListener(handleWebSocketMessage);
    // Fetch initial data on component mount
    simAPI.sendMessage({ action: "get_indicators" });

    // Cleanup: remove the listener when the component unmounts
    return () => {
      simAPI.removeMessageListener(handleWebSocketMessage);
    };
  }, [simAPI]); // Rerun if simAPI instance changes

  const handleGenerate = () => {
    setGraphs((prevGraphs) => [...prevGraphs, [metric, startUnit]]);
  };
  return (
    <Box>
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
                  labels={
                    indicatorData?.week ? Object.values(indicatorData.week) : []
                  }
                  data={
                    indicatorData?.[title]
                      ? Object.values(indicatorData[title])
                      : []
                  }
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
                {Object.entries(Indicators).map(([key, value]) => (
                  // Create a MenuItem for each Indicator
                  <MenuItem key={value} value={value}>
                    <span style={{ textTransform: "capitalize" }}>{value}</span>
                  </MenuItem>
                ))}
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
        </Grid>
      </Grid>
    </Box>
  );
}
