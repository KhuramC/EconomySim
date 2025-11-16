// src/components/SimSetup/PolicyAccordion.jsx
import { useState, useMemo } from "react";
import {
  MenuItem,
  Grid,
  Typography,
  Tabs,
  Tab,
  Box,
  Switch,
  FormControlLabel,
} from "@mui/material";
import ParameterAccordion from "./ParameterAccordion.jsx";
import ParameterMenuInput from "./ParameterMenuInput.jsx";
import ParameterNumInput from "./ParameterNumInput.jsx";
import { IndustryType } from "../../types/IndustryType.js";
import { Demographic } from "../../types/Demographic.js";

/**
 * Government Policies editor:
 * - Regular (global) policies + enable/disable toggles (UI-only gating).
 * - Advanced tabbed overrides:
 *    • By Industry    – per-industry overrides (inherit when blank)
 *    • By Demographic – per-demo overrides (inherit when blank)
 * - "Rent Cap" was replaced by "Price Cap ($)" and is available for ALL industries (task #133).
 * - When a global toggle is OFF, its numeric input is disabled.
 * - Defensive handlers so the UI never crashes if a parent handler is missing.
 */
export default function PolicyAccordion({
  policyParams = {},
  handlePolicyChange,                         // (key) => (e)=>{} – updates global value
  handlePolicyToggle,                         // (key) => (e,checked)=>{} – updates enabled[key]
  handlePolicyIndustryOverrideChange,         // (industryKey, field) => (e)=>{}
  handlePolicyDemographicOverrideChange,      // (demoKey, field) => (e)=>{}
  formErrors = {},
  starting = true,
}) {
  // ----- Tabs & selections -----
  const [tab, setTab] = useState(0);
  const handleTab = (_e, v) => setTab(v);

  const industryKeys = useMemo(() => Object.keys(IndustryType), []);
  const industryLabels = useMemo(() => Object.values(IndustryType), []);
  const demoKeys = useMemo(() => Object.values(Demographic), []);

  const [selectedIndustry, setSelectedIndustry] = useState(industryKeys[0]);
  const [selectedDemo, setSelectedDemo] = useState(demoKeys[0]);

  // ----- Safe accessors -----
  const byIndustry = policyParams.byIndustry || {};
  const byDemo = policyParams.byDemographic || {};
  const iErrors = formErrors.byIndustry || {};
  const dErrors = formErrors.byDemographic || {};
  const enabled = policyParams.enabled || {};

  // Try both enum key (e.g., "GROCERIES") and display label (e.g., "Groceries") for robustness
  const industryLabelOf = (enumKey) => IndustryType[enumKey];
  const getInd = (field) => {
    const byKey = byIndustry[selectedIndustry]?.[field];
    if (byKey !== undefined && byKey !== null) return byKey;
    const label = industryLabelOf(selectedIndustry);
    return (byIndustry[label] && byIndustry[label][field]) ?? "";
  };
  const indErr = (field) =>
    (iErrors[selectedIndustry]?.[field]) ||
    (iErrors[industryLabelOf(selectedIndustry)]?.[field]);

  const getDemo = (field) =>
    (byDemo[selectedDemo] && byDemo[selectedDemo][field]) ?? "";

  const demoErr = (field) => dErrors[selectedDemo]?.[field];

  // ----- Defensive handler fallbacks (never crash if parent didn't pass them) -----
  const noopFactory = () => () => {};
  const onGlobalChange = (k) =>
    typeof handlePolicyChange === "function" ? handlePolicyChange(k) : noopFactory;

  const onToggle = (k) =>
    typeof handlePolicyToggle === "function"
      ? (e, c) => handlePolicyToggle(k)(e, c)
      : () => {};

  const onIndOverride = (k, f) =>
    typeof handlePolicyIndustryOverrideChange === "function"
      ? handlePolicyIndustryOverrideChange(k, f)
      : noopFactory;

  const onDemoOverride = (k, f) =>
    typeof handlePolicyDemographicOverrideChange === "function"
      ? handlePolicyDemographicOverrideChange(k, f)
      : noopFactory;

  // ----- Tab panel helper -----
  const TabPanel = ({ value, index, children }) => (
    <div role="tabpanel" hidden={value !== index} aria-labelledby={`policy-tab-${index}`}>
      {value === index && <Box sx={{ pt: 2, width: "100%" }}>{children}</Box>}
    </div>
  );

  // ----- Regular/global policies + toggles (kept layout to preserve appearance) -----
  const regularFields = (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={!!enabled.salesTax}
                onChange={onToggle("salesTax")}
              />
            }
            label="Sales Tax"
          />
          <ParameterNumInput
            label="Sales Tax (%)"
            value={policyParams.salesTax}
            onChange={onGlobalChange("salesTax")}
            error={!!formErrors.salesTax}
            helpText="Tax on consumer purchases. Higher values raise effective prices and may lower demand."
            disabled={!enabled.salesTax}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={!!enabled.corporateTax}
                onChange={onToggle("corporateTax")}
              />
            }
            label="Corporate Income Tax"
          />
          <ParameterNumInput
            label="Corporate Income Tax (%)"
            value={policyParams.corporateTax}
            onChange={onGlobalChange("corporateTax")}
            error={!!formErrors.corporateTax}
            helpText="Tax on industry profits. Reduces retained earnings and may affect investment."
            disabled={!enabled.corporateTax}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={!!enabled.personalIncomeTax}
                onChange={onToggle("personalIncomeTax")}
              />
            }
            label="Personal Income Tax"
          />
          <ParameterNumInput
            label="Personal Income Tax (%)"
            value={policyParams.personalIncomeTax}
            onChange={onGlobalChange("personalIncomeTax")}
            error={!!formErrors.personalIncomeTax}
            helpText="Tax on individual income. Lowers disposable income and consumption."
            disabled={!enabled.personalIncomeTax}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={!!enabled.propertyTax}
                onChange={onToggle("propertyTax")}
              />
            }
            label="Property Tax"
          />
          <ParameterNumInput
            label="Property Tax (%)"
            value={policyParams.propertyTax}
            onChange={onGlobalChange("propertyTax")}
            error={!!formErrors.propertyTax}
            helpText="Recurring tax on property values. Can influence housing costs and investment."
            disabled={!enabled.propertyTax}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={!!enabled.minimumWage}
                onChange={onToggle("minimumWage")}
              />
            }
            label="Minimum Wage"
          />
          <ParameterNumInput
            label="Minimum Wage ($/hr)"
            value={policyParams.minimumWage}
            onChange={onGlobalChange("minimumWage")}
            error={!!formErrors.minimumWage}
            helpText="Legal wage floor. Firms cannot offer wages below this value."
            disabled={!enabled.minimumWage}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={!!enabled.tariffs}
                onChange={onToggle("tariffs")}
              />
            }
            label="Tariffs"
          />
          <ParameterNumInput
            label="Tariffs (%)"
            value={policyParams.tariffs}
            onChange={onGlobalChange("tariffs")}
            error={!!formErrors.tariffs}
            helpText="Import duties that raise costs of targeted goods. Can shift demand across industries."
            disabled={!enabled.tariffs}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={!!enabled.subsidies}
                onChange={onToggle("subsidies")}
              />
            }
            label="Subsidies"
          />
          <ParameterNumInput
            label="Subsidies (%)"
            value={policyParams.subsidies}
            onChange={onGlobalChange("subsidies")}
            error={!!formErrors.subsidies}
            helpText="Government support to industries. Lowers effective costs or boosts income."
            disabled={!enabled.subsidies}
          />
        </Grid>

        {/* New: Price Cap ($) for all industries */}
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={!!enabled.priceCap}
                onChange={onToggle("priceCap")}
              />
            }
            label="Price Cap"
          />
          <ParameterNumInput
            label="Price Cap ($)"
            value={policyParams.priceCap}
            onChange={onGlobalChange("priceCap")}
            error={!!formErrors.priceCap}
            helpText="Hard upper bound ($) on prices. When enabled, final price cannot exceed this value unless overridden per industry."
            disabled={!enabled.priceCap}
          />
        </Grid>
      </Grid>
    </>
  );

  // ----- Advanced overrides (kept appearance; fixed Demographic vertical stacking) -----
  const advancedOverrides = (
    <>
      <Tabs
        value={tab}
        onChange={handleTab}
        aria-label="policy override tabs"
        sx={{ mb: 1, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab id="policy-tab-0" label="By Industry" />
        <Tab id="policy-tab-1" label="By Demographic" />
      </Tabs>

      {/* By Industry */}
      <TabPanel value={tab} index={0}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Overrides by Industry
        </Typography>

        <Grid container spacing={2}>
          <ParameterMenuInput
            label="Industry"
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            xs={12}
          >
            {industryKeys.map((key) => (
              <MenuItem key={key} value={key}>
                <span style={{ textTransform: "capitalize" }}>
                  {IndustryType[key]}
                </span>
              </MenuItem>
            ))}
          </ParameterMenuInput>

          <ParameterNumInput
            label="Sales Tax Override (%)"
            value={getInd("salesTax")}
            onChange={onIndOverride(selectedIndustry, "salesTax")}
            error={!!indErr("salesTax")}
            helpText="Leave blank to inherit the global Sales Tax."
            disabled={!enabled.salesTax}
          />
          <ParameterNumInput
            label="Corporate Income Tax Override (%)"
            value={getInd("corporateTax")}
            onChange={onIndOverride(selectedIndustry, "corporateTax")}
            error={!!indErr("corporateTax")}
            helpText="Leave blank to inherit the global Corporate Income Tax."
            disabled={!enabled.corporateTax}
          />
          <ParameterNumInput
            label="Tariffs Override (%)"
            value={getInd("tariffs")}
            onChange={onIndOverride(selectedIndustry, "tariffs")}
            error={!!indErr("tariffs")}
            helpText="Leave blank to inherit the global Tariffs."
            disabled={!enabled.tariffs}
          />
          <ParameterNumInput
            label="Subsidies Override (%)"
            value={getInd("subsidies")}
            onChange={onIndOverride(selectedIndustry, "subsidies")}
            error={!!indErr("subsidies")}
            helpText="Leave blank to inherit the global Subsidies."
            disabled={!enabled.subsidies}
          />
          <ParameterNumInput
            label="Price Cap Override ($)"
            value={getInd("priceCap")}
            onChange={onIndOverride(selectedIndustry, "priceCap")}
            error={!!indErr("priceCap")}
            helpText="Optional. If provided, this industry caps prices at this $ value; otherwise inherits global Price Cap."
            disabled={!enabled.priceCap}
          />
        </Grid>
      </TabPanel>

      {/* By Demographic — title centered, then inputs on the next row */}
      <TabPanel value={tab} index={1}>
        <Box sx={{ width: "100%", display: "block" }}>
          <Typography
            variant="subtitle1"
            align="center"
            sx={{ mb: 2, textAlign: "center", display: "block" }}
          >
            Overrides by Demographic
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <ParameterMenuInput
            label="Demographic"
            value={selectedDemo}
            onChange={(e) => setSelectedDemo(e.target.value)}
            xs={12}
          >
            {demoKeys.map((val) => (
              <MenuItem key={val} value={val}>
                <span style={{ textTransform: "capitalize" }}>{val}</span>
              </MenuItem>
            ))}
          </ParameterMenuInput>

          <ParameterNumInput
            label="Personal Income Tax Override (%)"
            value={getDemo("personalIncomeTax")}
            onChange={onDemoOverride(selectedDemo, "personalIncomeTax")}
            error={!!demoErr("personalIncomeTax")}
            helpText="Leave blank to inherit the global Personal Income Tax."
            disabled={!enabled.personalIncomeTax}
          />
        </Grid>
      </TabPanel>
    </>
  );

  return (
    <ParameterAccordion
      title={starting === true ? "Starting Government Policies" : "Government Policies"}
      advancedContent={advancedOverrides}
    >
      {regularFields}
    </ParameterAccordion>
  );
}
