import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Button,
  MenuItem,
  Grid,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";  

export default function SetupPage() {

  const navigate = useNavigate();  
  const [params, setParams] = useState({
    // Environmental
    maxSimulationLength: 100,
    randomEvents: false,
    inflationRate: 2.0,
    priceIncreaseRate: 1.5,

    // Demographic
    meanIncome: 50000,
    sdIncome: 15000,
    populationDistribution: 100,
    spendingBehavior: 70,
    meanSavings: 10000,
    sdSavings: 5000,
    unemploymentRate: .05,

    // Industry
    industryType: "Manufacturing",
    startingInventory: 1000,
    startingPrice: 10,
    industrySavings: 50000,
    employees: 50,
    offeredWage: 15,

    // Government Policy
    salesTax: 7,
    corporateTax: 21,
    personalIncomeTax: 15,
    propertyTax: 1000,
    tariffs: 5,
    subsidies: 2000,
    rentCap: 2000,
    minimumWage: 10,
  });

  const handleChange = (key) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleSliderChange = (key) => (_, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleBegin = () => {
    console.log("Simulation parameters:", params);
    navigate("/BaseSimView");
  };

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
      <Typography variant="h4" gutterBottom>
        Simulation Setup
      </Typography>
      <Typography variant="body1" paragraph>
        Configure the starting parameters for your simulation. These values
        affect how the environment, demographics, industries, and policies
        behave when the simulation begins.
      </Typography>

      {/* Environmental */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Environmental Parameters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Max Simulation Length"
                type="number"
                fullWidth
                value={params.maxSimulationLength}
                onChange={handleChange("maxSimulationLength")}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                label="National Inflation Rate (%)"
                type="number"
                fullWidth
                value={params.inflationRate}
                onChange={handleChange("inflationRate")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Rate of Price Increases (%)"
                type="number"
                fullWidth
                value={params.priceIncreaseRate}
                onChange={handleChange("priceIncreaseRate")}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={params.randomEvents}
                    onChange={handleChange("randomEvents")}
                  />
                }
                label="Random Events"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Demographic */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Demographic Parameters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Mean Income ($)"
                type="number"
                fullWidth
                value={params.meanIncome}
                onChange={handleChange("meanIncome")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Income Std. Deviation ($)"
                type="number"
                fullWidth
                value={params.sdIncome}
                onChange={handleChange("sdIncome")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Population Distribution (%)"
                type="number"
                fullWidth
                value={params.populationDistribution}
                onChange={handleChange("populationDistribution")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Spending Behavior (% Income)"
                type="number"
                fullWidth
                value={params.spendingBehavior}
                onChange={handleChange("spendingBehavior")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Mean Savings ($)"
                type="number"
                fullWidth
                value={params.meanSavings}
                onChange={handleChange("meanSavings")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Savings Std. Deviation ($)"
                type="number"
                fullWidth
                value={params.sdSavings}
                onChange={handleChange("sdSavings")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Starting Unemployment Rate (%)"
                type="number"
                fullWidth
                value={params.unemploymentRate}
                onChange={handleChange("unemploymentRate")}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Industry */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Industry Parameters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                label="Industry Type"
                fullWidth
                value={params.industryType}
                onChange={handleChange("industryType")}
              >
                <MenuItem value="Manufacturing">Manufacturing</MenuItem>
                <MenuItem value="Technology">Technology</MenuItem>
                <MenuItem value="Retail">Retail</MenuItem>
                <MenuItem value="Agriculture">Agriculture</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Starting Inventory"
                type="number"
                fullWidth
                value={params.startingInventory}
                onChange={handleChange("startingInventory")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Starting Price ($)"
                type="number"
                fullWidth
                value={params.startingPrice}
                onChange={handleChange("startingPrice")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Industry Savings ($)"
                type="number"
                fullWidth
                value={params.industrySavings}
                onChange={handleChange("industrySavings")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Number of Employees"
                type="number"
                fullWidth
                value={params.employees}
                onChange={handleChange("employees")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Offered Wage ($/hr)"
                type="number"
                fullWidth
                value={params.offeredWage}
                onChange={handleChange("offeredWage")}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Policy */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Government Policy Parameters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Sales Tax (%)"
                type="number"
                fullWidth
                value={params.salesTax}
                onChange={handleChange("salesTax")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Corporate Income Tax (%)"
                type="number"
                fullWidth
                value={params.corporateTax}
                onChange={handleChange("corporateTax")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Personal Income Tax (%)"
                type="number"
                fullWidth
                value={params.personalIncomeTax}
                onChange={handleChange("personalIncomeTax")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Property Tax ($)"
                type="number"
                fullWidth
                value={params.propertyTax}
                onChange={handleChange("propertyTax")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Tariffs (%)"
                type="number"
                fullWidth
                value={params.tariffs}
                onChange={handleChange("tariffs")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Subsidies ($)"
                type="number"
                fullWidth
                value={params.subsidies}
                onChange={handleChange("subsidies")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Rent Cap ($)"
                type="number"
                fullWidth
                value={params.rentCap}
                onChange={handleChange("rentCap")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Minimum Wage ($/hr)"
                type="number"
                fullWidth
                value={params.minimumWage}
                onChange={handleChange("minimumWage")}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Begin Simulation Button */}
      <div style={{ marginTop: "2rem" }}>
        <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleBegin}
            sx={{ mt: 3, borderRadius: 2 }}
          >
            Begin Simulation
          </Button>
      </div>
    </div>
  );
}
