import { useState, useMemo, useEffect, createContext } from "react";
import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import { Box, Paper, Typography } from "@mui/material";
import SidebarNav from "../../components/SimView/SidebarNav.jsx";
import { SimulationAPI } from "../../api/SimulationAPI.js";
import TimelinePanel from "../../components/SimView/TimelinePanel.jsx";

// Content-only pages (no sidebar or outer Paper inside them)
import Overview from "./Overview.jsx";
import Industries from "./Industries.jsx";
import Policies from "./Policies.jsx";
import Demographics from "./Demographics.jsx";
import Statistics from "./Statistics.jsx";

export const SimulationContext = createContext(null);

export default function BaseSimView() {
  const location = useLocation();

  // Latch the modelId from location.state into component state.
  // This ensures it persists across navigations within this view.
  const [modelId] = useState(location.state?.modelId);
  const [initialIndustryParams] = useState(location.state?.industryParams);
  const [week, setWeek] = useState(0);

  // useMemo ensures the API instance is created only once for a given modelId.
  // We also handle the case where modelId might not be present on first render.
  const simAPI = useMemo(() => {
    if (!modelId) return null;
    console.log("Creating SimulationAPI instance for modelId:", modelId);
    return new SimulationAPI(modelId);
  }, [modelId]);

  useEffect(() => {
    if (!simAPI) return;

    const handleWebSocketMessage = (message) => {
      //only need to getCurrent week if a step has been made
      if (message.action === "step" || message.action === "reverse_step") {
        simAPI.getCurrentWeek();
      }
      if (message.action === "get_current_week" && message.data) {
        setWeek(message.data.week);
      }
    };

    const connectAndListen = async () => {
      try {
        if (!simAPI.websocket) {
          console.log("Connecting WebSocket...");
          await simAPI.connect();
        }
        simAPI.addMessageListener(handleWebSocketMessage);
        simAPI.getCurrentWeek(); // Fetch initial week
      } catch (error) {
        console.error("Failed to connect or listen to WebSocket:", error);
      }
    };

    connectAndListen();

    return () => {
      simAPI.removeMessageListener(handleWebSocketMessage);
    };
  }, [simAPI]); // Dependency array ensures this runs only when simAPI changes.

  const basePath = "/BaseSimView";

  return (
    <Box sx={{ p: 2 }}>
      {/* ✅ Fix the outer container size (width and height) */}
      <Paper
        variant="outlined"
        sx={{
          width: 1200, // Fixed outer width (adjust if you want larger or smaller)
          height: 720, // Fixed outer height (remove if you want it flexible)
          mx: "auto", // Center horizontally in the screen
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "background.paper",
          display: "flex", // Flex layout: sidebar + content
        }}
      >
        {/* LEFT: Sidebar with fixed width */}
        <Box
          sx={{
            flex: "0 0 260px", // Sidebar locked to 260px
            width: 260,
            borderRight: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            p: 2,
            overflowY: "auto", // Scroll inside sidebar if it gets tall
          }}
        >
          <SidebarNav basePath={basePath} />

          <Typography variant="h6" sx={{ mt: 2, textAlign: "center" }}>
            Week: {week}
          </Typography>
          <TimelinePanel simAPI={simAPI} />
        </Box>

        {/* RIGHT: Content area fills the remaining space */}
        <Box
          sx={{
            flex: "1 1 auto",
            minWidth: 0, // Prevent children from forcing extra width
            maxWidth: "100%",
            bgcolor: "background.paper",
            p: { xs: 2, md: 3 },
            overflow: "auto", // Scroll only inside this area if content is long
          }}
        >
          <SimulationContext.Provider value={simAPI}>
            <Routes>
              <Route
                index
                element={<Navigate to="overview" replace state={{ modelId }} />}
              />
              <Route path="overview" element={<Overview />} />
              <Route
                path="industries"
                element={
                  <Industries oldindustryParams={initialIndustryParams} />
                }
              />
              <Route path="policies" element={<Policies />} />
              <Route path="demographics" element={<Demographics />} />
              <Route path="statistics" element={<Statistics />} />
              <Route
                path="*"
                element={<Navigate to="overview" replace state={{ modelId }} />}
              />
            </Routes>
          </SimulationContext.Provider>
        </Box>
      </Paper>
    </Box>
  );
}
