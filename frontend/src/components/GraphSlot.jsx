import { useState, useMemo } from "react";
import { Paper, Box, Typography, Link, Stack } from "@mui/material";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
// Simple placeholder area to drop/choose a graph later
export default function GraphSlot({
  title = "Untitled Graph",
  onOpen,
  labels = [],
  data = [],
}) {
  // Check if there's data to display
  const hasData = useMemo(() => data && data.length > 0, [data]);

  // useMemo will re-calculate chartData only when `labels` or `data` props change.
  // This ensures the chart gets a new object reference and triggers a re-render.
  const chartData = useMemo(() => {
    console.log("Labels:", labels);
    console.log("Data:", data);
    console.log("hasData:", hasData);
    return {
      labels: labels,
      datasets: [
        {
          label: title.replace(" Graph", ""), // Use the base metric name for the legend
          data: data,
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    };
  }, [labels, data, title]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Week",
        },
      },
    },
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        height: 280,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Card header: title + "Open Graph" action */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight={800}>
          {title}
        </Typography>
        <Link
          component="button"
          type="button"
          underline="hover"
          onClick={onOpen}
        >
          Open Graph
        </Link>
      </Box>

      {/* Centered placeholder canvas */}
      <Box
        sx={{
          flex: 1,
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 1,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          px: 2,
        }}
      >
        {hasData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Stack spacing={1} alignItems="center">
            <InsertChartOutlinedIcon
              sx={{ fontSize: 40, color: "text.secondary" }}
            />
            <Typography variant="body2" color="text.secondary">
              Waiting for data...
            </Typography>
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
