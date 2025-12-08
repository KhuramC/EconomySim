import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Add as AddIcon } from "@mui/icons-material";
import { SimulationContext } from "./BaseSimView.jsx";
import GraphSlot from "../../components/simView/GraphSlot";

export default function Overview() {
  const simAPI = useContext(SimulationContext); // Get API from context

  const [indicatorData, setIndicatorData] = useState(null);
  // State for industry-specific data (price, etc.)
  const [industryData, setIndustryData] = useState(null);
  const [policiesData, setPoliciesData] = useState(null);
   const [week, setWeek] = useState(0);
  useEffect(() => {
    if (!simAPI) return;

    const handleWebSocketMessage = (message) => {
      // When a step happens, request the latest indicators/
      if (message.action === "step" || message.action === "reverse_step") {
        simAPI.sendMessage({ action: "get_indicators" });
        simAPI.sendMessage({ action: "get_industry_data" });
      }
      // When indicator data arrives, update our state
      if (message.action === "get_indicators" && message.data) {
        console.log("Received indicator data:", message.data);
        setIndicatorData(message.data);
      }
      // When industry data arrives, update our state
      if (message.action === "get_industry_data" && message.data) {
        console.log("Received industry data:", message.data);
        setIndustryData(message.data);
      }
      if (message.action === "get_policies" && message.data) {
        console.log("Received policies data:", message.data);
        setPoliciesData(message.data);
      }
      if (message.action === "get_current_week" && message.data) {
        setWeek(message.data.week);
      }
    };

    // Add the listener
    simAPI.addMessageListener(handleWebSocketMessage);
    // Fetch initial data on component mount
    simAPI.sendMessage({ action: "get_indicators" });
    simAPI.sendMessage({ action: "get_industry_data" });
    simAPI.sendMessage({ action: "get_policies" });
    // Cleanup: remove the listener when the component unmounts
    return () => {
      simAPI.removeMessageListener(handleWebSocketMessage);
    };
  }, [simAPI]); // Rerun if simAPI instance changes

  const title = "GDP";
  const title2 = "Gini Coefficient"

  const { pathname } = useLocation();
  const isSelected = (to) => pathname === to || pathname.startsWith(`${to}/`);
  return (
    // NOTE: No outer Paper or sidebar here.
    // This component is rendered inside BaseSimView's shared Paper and layout.
    <Box>
      {/* Page title */}
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Overview
          </Typography>
      <Grid container spacing={12}>
        {/* MAIN COLUMN */}
        <Grid
          item
          xs={12}
          md={8}
          sx={{ display: "flex", flexDirection: "row" }}
        >

          {/* KPI row (GDP + Unemployment) */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* GDP */}
            <Grid item xs={12} sm={6}>
              <React.Fragment key={"display-graph"}>
                <Box width="25vw" sx={{ mb: 2 }}>
                  {indicatorData && (
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
            </Grid>

            {/* Unemployment */}
            
          </Grid>

        </Grid>

        {/* RIGHT COLUMN */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{ display: "flex", flexDirection: "column" }}
        >
           <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* GDP */}
            <Grid item xs={12} sm={6}>
              <React.Fragment key={"display-graph"}>
                <Box  width="25vw" sx={{ mb: 2 }}>
                  {indicatorData && (
                    <GraphSlot
                      title={`${title2} Graph`}
                      labels={indicatorData?.week || []}
                      datasets={[
                        {
                          label: title2,
                          data: indicatorData?.[title2]
                            ? indicatorData[title2]
                            : [],
                        },
                      ]}
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
                  {title2} Distribution Over Time
                </Typography>
              </React.Fragment>
            </Grid>

            {/* Unemployment */}
            
          </Grid>
          
        </Grid>
      </Grid>
      <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Current Policies
              </Typography>
              {policiesData && (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Hourly Minimum Wage: {policiesData.minimum_wage/40}
                </Typography>
              )}
              {policiesData && (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Residential Property Tax:{" "}
                  {policiesData.property_tax.residential.toFixed(4)}
                </Typography>
              )}
              {policiesData&& (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Grocery Sales Tax: {policiesData.sales_tax.Groceries.toFixed(4)}
                </Typography>
              )}
              {policiesData && (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Grocery Tariffs: {policiesData.tariffs.Groceries.toFixed(4)}
                </Typography>
              )}
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 1, fontWeight: 700 }}
                key={"Policies"}
                component={RouterLink}
              to={`/BaseSimView/policies`}
              >
                View/Edit Policies
              </Button>
            </CardContent>
          </Card>
          {/* Summary card */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Summary
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Progressed to Week: {week}
              </Typography>
              
            </CardContent>
          </Card>
    </Box>
  );
}