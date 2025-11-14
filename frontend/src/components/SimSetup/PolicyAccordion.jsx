// src/components/SimSetup/PolicyAccordion.jsx
// Purpose: Render the "Government Policies" section with:
//   1) Regular/global policy inputs (always visible)
//   2) Advanced tabbed overrides per Industry and per Demographic
// Notes:
//   - Global values act as defaults; overrides replace the global within their scope.
//   - Override handlers are optional so other pages can reuse this component safely.
//   - Backend expects Rent Cap as a percentage (not dollars).
//   - Tabs and their content are stacked vertically; panels always render UNDER the tab strip.

import { useState, useMemo } from "react";
import { MenuItem, Grid, Typography, Tabs, Tab, Box } from "@mui/material";
import ParameterAccordion from "./ParameterAccordion.jsx";
import ParameterMenuInput from "./ParameterMenuInput.jsx";
import ParameterNumInput from "./ParameterNumInput.jsx";
import { IndustryType } from "../../types/IndustryType.js";
import { Demographic } from "../../types/Demographic.js";

/**
 * Props:
 * - policyParams: globals + { byIndustry?, byDemographic? }
 * - handlePolicyChange: (key) => (e) => void   // updates globals
 * - handlePolicyIndustryOverrideChange?: (industryKey, field) => (e) => void
 * - handlePolicyDemographicOverrideChange?: (demoKey, field) => (e) => void
 * - formErrors?: nested error bag (globals + overrides)
 * - starting?: boolean (changes accordion title wording)
 */
export default function PolicyAccordion({
  policyParams,
  handlePolicyChange,                        // required global handler
  handlePolicyIndustryOverrideChange,        // optional override handler
  handlePolicyDemographicOverrideChange,     // optional override handler
  formErrors = {},
  starting = true,
}) {
  // Fallback no-ops so callers can omit override handlers without crashes
  const noopFactory = () => () => {};
  const onIndChange =
    handlePolicyIndustryOverrideChange ?? ((_industryKey, _field) => noopFactory());
  const onDemoChange =
    handlePolicyDemographicOverrideChange ?? ((_demoKey, _field) => noopFactory());

  // Which tab is active (0 = By Industry, 1 = By Demographic)
  const [tab, setTab] = useState(0);
  const handleTab = (_e, v) => setTab(v);

  // Stable lists derived from enum-like objects
  const industryKeys = useMemo(() => Object.keys(IndustryType), []);
  const demoKeys = useMemo(() => Object.values(Demographic), []);

  // Current selections inside the two override editors
  const [selectedIndustry, setSelectedIndustry] = useState(industryKeys[0]);
  const [selectedDemo, setSelectedDemo] = useState(demoKeys[0]);

  // Safe deref for nested policy bags + error maps
  const byIndustry = policyParams?.byIndustry ?? {};
  const byDemo     = policyParams?.byDemographic ?? {};
  const iErrors    = formErrors?.byIndustry ?? {};
  const dErrors    = formErrors?.byDemographic ?? {};

  // Read the currently selected override value as a STRING (allows free typing)
  const getInd = (field) =>
    (byIndustry[selectedIndustry] && byIndustry[selectedIndustry][field]) ?? "";
  const getDemo = (field) =>
    (byDemo[selectedDemo] && byDemo[selectedDemo][field]) ?? "";

  // Tiny helper to only render the active panel
  const TabPanel = ({ value, index, children }) => (
    <div role="tabpanel" hidden={value !== index} aria-labelledby={`policy-tab-${index}`}>
      {value === index && <Box sx={{ pt: 2, width: "100%" }}>{children}</Box>}
    </div>
  );

  // ---------- Global policy inputs (act as defaults everywhere) ----------
  const regularFields = (
    <>
      <ParameterNumInput
        label="Sales Tax (%)"
        value={policyParams.salesTax}
        onChange={handlePolicyChange("salesTax")}
        error={!!formErrors.salesTax}
        helpText="Tax on consumer purchases. Higher values raise effective prices and may lower demand."
      />

      <ParameterNumInput
        label="Corporate Income Tax (%)"
        value={policyParams.corporateTax}
        onChange={handlePolicyChange("corporateTax")}
        error={!!formErrors.corporateTax}
        helpText="Tax on industry profits. Reduces retained earnings and may affect investment."
      />

      <ParameterNumInput
        label="Personal Income Tax (%)"
        value={policyParams.personalIncomeTax}
        onChange={handlePolicyChange("personalIncomeTax")}
        error={!!formErrors.personalIncomeTax}
        helpText="Tax on individual income. Lowers disposable income and consumption."
      />

      <ParameterNumInput
        label="Property Tax (%)"
        value={policyParams.propertyTax}
        onChange={handlePolicyChange("propertyTax")}
        error={!!formErrors.propertyTax}
        helpText="Recurring tax on property values. Can influence housing costs and investment."
      />

      <ParameterNumInput
        label="Minimum Wage ($/hr)"
        value={policyParams.minimumWage}
        onChange={handlePolicyChange("minimumWage")}
        error={!!formErrors.minimumWage}
        helpText="Legal wage floor. Firms cannot offer wages below this value."
      />

      <ParameterNumInput
        label="Tariffs (%)"
        value={policyParams.tariffs}
        onChange={handlePolicyChange("tariffs")}
        error={!!formErrors.tariffs}
        helpText="Import duties that raise costs of targeted goods. Can shift demand across industries."
      />

      <ParameterNumInput
        label="Subsidies (%)"
        value={policyParams.subsidies}
        onChange={handlePolicyChange("subsidies")}
        error={!!formErrors.subsidies}
        helpText="Government support to industries. Lowers effective costs or boosts income."
      />

      {/* Rent Cap is now a percent value per backend spec */}
      <ParameterNumInput
        label="Rent Cap (%)"
        value={policyParams.rentCap}
        onChange={handlePolicyChange("rentCap")}
        error={!!formErrors.rentCap}
        helpText="Upper bound (percent) on weekly housing rent. If binding, it limits rent growth."
      />
    </>
  );

  // ---------- Advanced overrides (tabs stacked over panels) ----------
  const advancedOverrides = (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <Tabs
        value={tab}
        onChange={handleTab}
        aria-label="policy override tabs"
        sx={{ mb: 1, alignSelf: "flex-start" }}              // keep tab strip on its own row
        slotProps={{ indicator: { sx: { height: 3, bgcolor: "success.main" } } }} // MUI v5 API
      >
        <Tab id="policy-tab-0" label="By Industry" />
        <Tab id="policy-tab-1" label="By Demographic" />
      </Tabs>

      {/* ----------------------- By Industry ----------------------- */}
      <TabPanel value={tab} index={0}>
        {/* Section header centered */}
        <Box sx={{ width: "100%" }}>
          <Typography variant="subtitle1" align="center" sx={{ mb: 2 }}>
            Overrides by Industry
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {/* Industry selector spans full row for clarity */}
          <ParameterMenuInput
            label="Industry"
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            xs={12}
          >
            {industryKeys.map((key) => (
              <MenuItem key={key} value={key}>
                {/* Show human-friendly label from the enum map */}
                <span style={{ textTransform: "capitalize" }}>{IndustryType[key]}</span>
              </MenuItem>
            ))}
          </ParameterMenuInput>

          {/* Percent overrides; blank means "inherit global" */}
          <ParameterNumInput
            label="Sales Tax Override (%)"
            value={getInd("salesTax")}
            onChange={onIndChange(selectedIndustry, "salesTax")}
            error={!!(iErrors[selectedIndustry]?.salesTax)}
            helpText="Leave blank to inherit the global Sales Tax."
          />
          <ParameterNumInput
            label="Corporate Income Tax Override (%)"
            value={getInd("corporateTax")}
            onChange={onIndChange(selectedIndustry, "corporateTax")}
            error={!!(iErrors[selectedIndustry]?.corporateTax)}
            helpText="Leave blank to inherit the global Corporate Income Tax."
          />
          <ParameterNumInput
            label="Tariffs Override (%)"
            value={getInd("tariffs")}
            onChange={onIndChange(selectedIndustry, "tariffs")}
            error={!!(iErrors[selectedIndustry]?.tariffs)}
            helpText="Leave blank to inherit the global Tariffs."
          />
          <ParameterNumInput
            label="Subsidies Override (%)"
            value={getInd("subsidies")}
            onChange={onIndChange(selectedIndustry, "subsidies")}
            error={!!(iErrors[selectedIndustry]?.subsidies)}
            helpText="Leave blank to inherit the global Subsidies."
          />

          {/* Rent Cap only applies to the Housing industry (disabled otherwise) */}
          <ParameterNumInput
            label="Rent Cap Override (%)"
            value={getInd("rentCap")}
            onChange={onIndChange(selectedIndustry, "rentCap")}
            error={!!(iErrors[selectedIndustry]?.rentCap)}
            helpText="Housing industry only; ignored for other industries."
            disabled={selectedIndustry !== "HOUSING"}
            xs={12} // make long label/layout breathe
          />
        </Grid>
      </TabPanel>

      {/* --------------------- By Demographic ---------------------- */}
      <TabPanel value={tab} index={1}>
        {/* Section header centered */}
        <Box sx={{ width: "100%" }}>
          <Typography variant="subtitle1" align="center" sx={{ mb: 2 }}>
            Overrides by Demographic
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {/* Demographic selector spans full row */}
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

          {/* Only override supported per demographic today */}
          <ParameterNumInput
            label="Personal Income Tax Override (%)"
            value={getDemo("personalIncomeTax")}
            onChange={onDemoChange(selectedDemo, "personalIncomeTax")}
            error={!!(dErrors[selectedDemo]?.personalIncomeTax)}
            helpText="Blank = inherit the global Personal Income Tax."
            xs={12} // prevents long label from truncating on narrow layouts
          />
        </Grid>
      </TabPanel>
    </Box>
  );

  // Wrap everything in the generic accordion container used across Setup
  return (
    <ParameterAccordion
      title={starting === true ? "Starting Government Policies" : "Government Policies"}
      advancedContent={advancedOverrides}
    >
      {regularFields}
    </ParameterAccordion>
  );
}
