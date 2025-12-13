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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { SimulationContext } from "./BaseSimView";
import GraphSlot from "../../components/simView/GraphSlot";
import { Indicators } from "../../types/Indicators";
import { IndustryMetrics } from "../../types/IndustryMetrics";
import { DemoMetrics } from "../../types/DemographicMetrics";

export default function Statistics() {
  const simAPI = useContext(SimulationContext); // Get API from context

  // State for economic indicators (GDP, etc.)
  const [indicatorData, setIndicatorData] = useState(null);
  // State for industry-specific data (price, etc.)
  const [industryData, setIndustryData] = useState(null);
  // State for demographic-specific data (proportion, etc.)
  const [demoData, setDemoData] = useState(null);

  // Controls for adding new graphs
  const [metric, setMetric] = useState(Indicators.GDP);
  const [startUnit, setStartUnit] = useState("week");
  // Default graphs to show
  const [graphs, setGraphs] = useState([Indicators.GDP]);
  //TODO: allow for plotting the Lorenz Curve, which has a different structure.

  useEffect(() => {
    if (!simAPI) return;

    const handleWebSocketMessage = (message) => {
      // When a step happens, request the latest data
      if (message.action === "step" || message.action === "reverse_step") {
        simAPI.getIndicators();
        simAPI.getIndustryData();
        simAPI.getDemoMetrics();
      }
      // When indicator data arrives, update state
      if (message.action === "get_indicators" && message.data) {
        console.log("Received indicator data:", message.data);
        setIndicatorData(message.data);
      }
      // When industry data arrives, update state
      if (message.action === "get_industry_data" && message.data) {
        console.log("Received industry data:", message.data);
        setIndustryData(message.data);
      }
      // When demographic data arrives, update state
      if (message.action === "get_demo_metrics" && message.data) {
        console.log("Received demographic metrics:", message.data);
        setDemoData(message.data);
      }
    };

    // Add the listener
    simAPI.addMessageListener(handleWebSocketMessage);
    // Fetch initial data on component mount
    simAPI.getIndicators();
    simAPI.getIndustryData();
    simAPI.getDemoMetrics();

    // Cleanup: remove the listener when the component unmounts
    return () => {
      simAPI.removeMessageListener(handleWebSocketMessage);
    };
  }, [simAPI]); // Rerun if simAPI instance changes

  const handleGenerate = () => {
    setGraphs((prevGraphs) => [...prevGraphs, metric]);
  };
  return (
    <Box>
      <Grid container spacing={3}>
        {/* MAIN COLUMN */}
        <Grid
          size={{ xs: 12, md: 8 }}
          sx={{ display: "flex", flexDirection: "column" }}
        >
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Statistics
          </Typography>

          {graphs.map((title, index) => {
            const isIndicator = Object.values(Indicators).includes(title);
            const isIndustryMetric =
              Object.values(IndustryMetrics).includes(title);
            const isDemoMetric = Object.values(DemoMetrics).includes(title);

            return (
              <React.Fragment key={index}>
                <Box sx={{ mb: 2 }}>
                  {isIndicator && indicatorData && (
                    <GraphSlot
                      title={`${title} Graph`}
                      labels={indicatorData?.week || []}
                      datasets={[
                        {
                          label: title,
                          data: indicatorData?.[title]
                            ? indicatorData[title]
                            : [],
                        },
                      ]}
                    />
                  )}
                  {isIndustryMetric && industryData && (
                    <GraphSlot
                      title={`${title} by Industry`}
                      labels={indicatorData?.week || []}
                      datasets={Object.entries(industryData || {}).map(
                        ([industryName, industryDetails]) => ({
                          label: industryName,
                          data: industryDetails[title] || [],
                        })
                      )}
                    />
                  )}
                  {isDemoMetric && demoData && (
                    <GraphSlot
                      title={`${title} by Demographic`}
                      labels={indicatorData?.week || []}
                      datasets={Object.entries(demoData || {}).map(
                        ([demoName, demoDetails]) => ({
                          label: demoName,
                          data: demoDetails[title] || [],
                        })
                      )}
                    />
                  )}
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
            );
          })}
        </Grid>

        {/* RIGHT COLUMN */}
        <Grid
          size={{ xs: 12, md: 4 }}
          sx={{ display: "flex", flexDirection: "column" }}
        >
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
                {Object.values(Indicators).map((value) => (
                  // Create a MenuItem for each Indicator
                  <MenuItem key={value} value={value}>
                    <span>{value}</span>
                  </MenuItem>
                ))}
                <Divider />
                {Object.values(IndustryMetrics).map((value) => (
                  // Create a MenuItem for each IndustryMetric
                  <MenuItem key={value} value={value}>
                    <span>{value} (by Industry)</span>
                  </MenuItem>
                ))}
                <Divider />
                {Object.values(DemoMetrics).map((value) => (
                  // Create a MenuItem for each IndustryMetric
                  <MenuItem key={value} value={value}>
                    <span>{value} (by Demographic)</span>
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
