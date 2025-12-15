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
import { Line, Scatter } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * A component to graph data using ChartJS.
 */
export default function GraphSlot({
  title = "Untitled Graph",
  labels = [],
  datasets = [],
}) {
  // Check if there's data to display
  const hasData = useMemo(
    () => datasets.some((d) => d.data && d.data.length > 0),
    [datasets]
  );

  const [hasDataLorenz,setDataLorenz] = useState(false);

  // useMemo will re-calculate chartData only when `labels` or `data` props change.
  // This ensures the chart gets a new object reference and triggers a re-render.
  const chartData = useMemo(() => {
    const colors = [
      "rgb(75, 192, 192)",
      "rgb(255, 99, 132)",
      "rgb(54, 162, 235)",
      "rgb(255, 206, 86)",
      "rgb(153, 102, 255)",
      "rgb(255, 159, 64)",
      "rgb(199, 199, 199)",
    ];
    return {
      labels: labels,
      datasets: datasets.map((dataset, index) => ({
        ...dataset,
        fill: false,
        borderColor: colors[index % colors.length],
        tension: 0.1,
      })),
    };
  }, [labels, datasets]);

  const scatterChartData = useMemo(() => {
    const colors = [
      "rgb(75, 192, 192)",
      "rgb(255, 99, 132)",
      "rgb(54, 162, 235)",
      "rgb(255, 206, 86)",
      "rgb(153, 102, 255)",
      "rgb(255, 159, 64)",
      "rgb(199, 199, 199)",
    ];

    let lorenzData = []
    let newData = []
    if(datasets[0].data.x){
      setDataLorenz(true);
      lorenzData = datasets[0].data
      for(let i=0; i<lorenzData.x.length;i++){
        const x = lorenzData.x[i]
        const y = lorenzData.y[i]
        newData.push([x,y])
      }
    }
    return {
      labels: labels,
      datasets: [
        {
          label: "plotted points",
          data: newData.length
        ? newData
        : Array.from({ length: 100 }, () => ({
            x: Math.floor(Math.random() * 100),
            y: Math.floor(Math.random() * 100),
          })),
          showLine:true,
          backgroundColor: 'rgba(255, 99, 132, 1)',
          pointHoverRadius: 0,
        },
        {
          label: "true equality",
          data: [[0,0],[1,1]],
          showLine:true,
        }
      ],
    };
  }, [labels, datasets]);

  const scatterOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      max: 1
    },
  },
};

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
              if (hasData || hasDataLorenz) {
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
          {(hasDataLorenz && title.includes("Lorenz") && (
            <Scatter data={scatterChartData} options={scatterOptions} />
          )) ||
            (hasData && title.includes("Lorenz") != true && <Line data={chartData} options={chartOptions} />) || (
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
            textAlign: "center",
          }}
        >
          <Typography
            variant="title1"
            fontWeight={800}
            align="center"
            alignItems="center"
          >
            {title}
          </Typography>

          {(hasDataLorenz && title.includes("Lorenz") && (
            <Scatter data={scatterChartData} options={scatterOptions} />
          )) ||
            (hasData && title.includes("Lorenz") != true && <Line data={chartData} options={chartOptions} />) || (
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
