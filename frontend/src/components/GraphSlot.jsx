// src/components/GraphSlot.jsx
import React from 'react';
import { Paper, Box, Typography, Link, Stack, Button } from '@mui/material';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import {Chart as ChartJS} from "chart.js/auto"
import {Bar,Doughnut,Line} from "react-chartjs-2"

// Simple placeholder area to drop/choose a graph later
export default function GraphSlot({ title = 'Lorenz Curve', onOpen }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderRadius: 2, height: 280, display: 'flex', flexDirection: 'column' }}
    >
      {/* Card header: title + "Open Graph" action */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>
        <Link component="button" type="button" underline="hover" onClick={onOpen}>
          Open Graph
        </Link>
      </Box>

      {/* Centered placeholder canvas */}
      <Box
        sx={{
          flex: 1,
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          px: 2,
        }}
      >
        <Stack spacing={1} alignItems="center">
          <Line
               
               data={{labels: ["Week 1","Week 2","Week 3"],
                 datasets: [
                   {
                     label: title,
                     data: [100,200,300]
                   }
                 ]
               }}/>
        </Stack>
      </Box>
    </Paper>
  );
}
