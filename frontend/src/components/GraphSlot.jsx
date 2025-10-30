import { useMemo, useState } from "react";
import { Paper, Box, Typography, Link, Stack, Modal } from "@mui/material";
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

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
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
            onClick={() => {
              console.log("hasData:", hasData);
              if (hasData){
                handleOpen();
              }
            }}
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
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "70vw",
            height: "70vh",
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4,
            textAlign:"center",
          }}
        >
          <Typography variant="title1" fontWeight={800} align="center" alignItems="center" >
            {title}
          </Typography>
          
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
      </Modal>
    </div>
  );
}
