// src/pages/simulation/BaseSimView.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, Paper } from "@mui/material";
import SidebarNav from "../../components/SidebarNav";

// Content-only pages (no sidebar or outer Paper inside them)
import Overview from "./overview.jsx";
import Industries from "./industries.jsx";
import Policies from "./policies.jsx";
import Demographics from "./demographics.jsx";
import Statistics from "./statistics.jsx";

export default function BaseSimView() {
  const basePath = "/BaseSimView";

  return (
    <Box sx={{ p: 2 }}>
      {/* ✅ Fix the outer container size (width and height) */}
      <Paper
        variant="outlined"
        sx={{
          width: 1200,            // Fixed outer width (adjust if you want larger or smaller)
          height: 720,            // Fixed outer height (remove if you want it flexible)
          mx: "auto",             // Center horizontally in the screen
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "background.paper",
          display: "flex",        // Flex layout: sidebar + content
        }}
      >
        {/* LEFT: Sidebar with fixed width */}
        <Box
          sx={{
            flex: "0 0 260px",     // Sidebar locked to 260px
            width: 260,
            borderRight: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            p: 2,
            overflowY: "auto",    // Scroll inside sidebar if it gets tall
          }}
        >
          <SidebarNav basePath={basePath} />
        </Box>

        {/* RIGHT: Content area fills the remaining space */}
        <Box
          sx={{
            flex: "1 1 auto",
            minWidth: 0,          // Prevent children from forcing extra width
            maxWidth: "100%",
            bgcolor: "background.paper",
            p: { xs: 2, md: 3 },
            overflow: "auto",     // Scroll only inside this area if content is long
          }}
        >
          <Routes>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="industries" element={<Industries />} />
            <Route path="policies" element={<Policies />} />
            <Route path="demographics" element={<Demographics />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </Box>
      </Paper>
    </Box>
  );
}
