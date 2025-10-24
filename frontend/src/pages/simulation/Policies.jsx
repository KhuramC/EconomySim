// src/pages/simulation/Policies.jsx
import {
  React,
  useContext,
  useState,
  useEffect,
} from "react";
import {
  Box,
  Grid,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Alert, // Added Alert import
} from "@mui/material";

import { SimulationContext } from "./BaseSimView.jsx";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * Read-only Policies view
 */
export default function Policies() {
  const simAPI = useContext(SimulationContext);
  const [error, setError] = useState(null);
  const [policies, setPolicies] = useState(null);

  // Demo clock (wire to real simulation clock later)
  const year = 5;
  const week = 5;
  const totalWeeks = 52;
  
  useEffect(() => {
    const fetchPolicies = async () => {
      if (!simAPI) {
        // ideally, this never happens unless a reload occurs
        setError("Simulation API not available");
        return;
      }
      try {
        const fetchedPolicies = await simAPI.getModelPolicies();
        setPolicies(fetchedPolicies); // Assuming fetchedPolicies is already in frontend format
      } catch (err) {
        setError(err.message);
      }
    };

    fetchPolicies(); // Initial fetch

    const handleWebSocketMessage = (message) => {
      if (message.action == "set_policies" || message.action == "step")
      console.log("Policies component received websocket message, refreshing data:", message);
      fetchPolicies();
    };

    if (simAPI) {
      simAPI.addMessageListener(handleWebSocketMessage);
      return () => simAPI.removeMessageListener(handleWebSocketMessage);
    }
  }, [simAPI]); // Re-run effect if simAPI changes
  return (
    // NOTE: No outer Paper here; this page is rendered inside BaseSimView's container.
    <Box>
      {/* Top-right date (kept consistent across pages) */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "right" }}>
          Year {year} &nbsp;&nbsp; Week {week} of {totalWeeks}
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError(null)} // Allows user to dismiss the error
        >
          Error: {error}
        </Alert>
      )}
      <Grid container spacing={3}>
        {/* LEFT column: main content */}
        <Grid item xs={12} md={8}>
          {/* Page title and subtitle */}
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
            Policies
          </Typography>

          {/* Single accordion (like Setup) */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Government Policy Parameters
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                { policies && ( // Only render policy fields if policies exist
                  <>
                    <Grid item xs={12} md={6}>
                      <ReadOnlyField label="Sales Tax" value={policies.salesTax} adornEnd="%" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <ReadOnlyField label="Corporate Income Tax" value={policies.corporateTax} adornEnd="%" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <ReadOnlyField label="Personal Income Tax" value={policies.personalIncomeTax} adornEnd="%" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <ReadOnlyField label="Property Tax" value={policies.propertyTax} adornStart="$" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <ReadOnlyField label="Tariffs" value={policies.tariffs} adornEnd="%" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <ReadOnlyField label="Subsidies" value={policies.subsidies} adornStart="$" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <ReadOnlyField label="Rent Cap" value={policies.rentCap} adornStart="$" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <ReadOnlyField
                        label="Minimum Wage"
                        value={policies.minimumWage}
                        adornStart="$"
                        adornEnd="/hr"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

      </Grid>
    </Box>
  );
}

/**
 * Reusable read-only MUI text field (grayed out)
 * - Uses slotProps.input instead of deprecated InputProps
 * - Supports start/end adornments (e.g., "$" or "%")
 */
function ReadOnlyField({ label, value, adornStart, adornEnd }) {
  return (
    <TextField
      label={label}
      fullWidth
      value={value !== null && value !== undefined ? value : ""} // Handle null/undefined values gracefully
      disabled
      slotProps={{
        input: {
          readOnly: true,
          startAdornment: adornStart ? (
            <InputAdornment position="start">{adornStart}</InputAdornment>
          ) : undefined,
          endAdornment: adornEnd ? (
            <InputAdornment position="end">{adornEnd}</InputAdornment>
          ) : undefined,
        },
      }}
    />
  );
}
