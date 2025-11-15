// Purpose: "Government Policies" section with
//   (1) Global policy inputs (always shown)
//   (2) Advanced tabbed overrides (per-Industry / per-Demographic)
// Notes:
//   - Globals act as defaults; overrides replace the global for that scope.
//   - Handlers for overrides are optional so other pages can reuse this component.
//   - Rent Cap is a percentage (not dollars) per latest backend spec.
//   - Tabs and content are stacked vertically; content always renders under the tabs.

import { useState, useMemo } from "react";
import { MenuItem, Grid, Typography, Tabs, Tab, Box } from "@mui/material";
import ParameterAccordion from "./ParameterAccordion.jsx";
import ParameterMenuInput from "./ParameterMenuInput.jsx";
import ParameterNumInput from "./ParameterNumInput.jsx";
import { IndustryType } from "../../types/IndustryType.js";
import { Demographic } from "../../types/Demographic.js";

/**
 * Props:
 * - policyParams: globals + optional { byIndustry, byDemographic }
 * - handlePolicyChange: (key) => (eOrNull) => void (globals; onBlur calls with null to flush)
 * - handlePolicyIndustryOverrideChange?: (industryKey, field) => (eOrNull) => void
 * - handlePolicyDemographicOverrideChange?: (demoKey, field) => (eOrNull) => void
 * - formErrors?: nested error bag (globals + overrides)
 * - starting?: boolean (changes accordion title)
 */
export default function PolicyAccordion({
  policyParams,
  handlePolicyChange,
  handlePolicyIndustryOverrideChange,
  handlePolicyDemographicOverrideChange,
  formErrors = {},
  starting = true,
}) {
  // Provide safe no-ops so the component is reusable without override handlers
  const noopFactory = () => () => {};
  const onIndChange =
    handlePolicyIndustryOverrideChange ?? ((_industryKey, _field) => noopFactory());
  const onDemoChange =
    handlePolicyDemographicOverrideChange ?? ((_demoKey, _field) => noopFactory());

  // Local tab state
  const [tab, setTab] = useState(0);
  const handleTab = (_e, v) => setTab(v);

  // Enum helpers
  const industryKeys = useMemo(() => Object.keys(IndustryType), []);
  const demoKeys = useMemo(() => Object.values(Demographic), []);

  // Current selectors
  const [selectedIndustry, setSelectedIndustry] = useState(industryKeys[0]);
  const [selectedDemo, setSelectedDemo] = useState(demoKeys[0]);

  // Safe access to nested bags
  const byIndustry = policyParams?.byIndustry ?? {};
  const byDemo = policyParams?.byDemographic ?? {};
  const iErrors = formErrors?.byIndustry ?? {};
  const dErrors = formErrors?.byDemographic ?? {};

  // Read override values (keep as strings so users can type freely)
  const getInd = (field) =>
    (byIndustry[selectedIndustry] && byIndustry[selectedIndustry][field]) ?? "";
  const getDemo = (field) =>
    (byDemo[selectedDemo] && byDemo[selectedDemo][field]) ?? "";

  // Simple TabPanel that hides inactive content
  const TabPanel = ({ value, index, children }) => (
    <div role="tabpanel" hidden={value !== index} aria-labelledby={`policy-tab-${index}`}>
      {value === index && <Box sx={{ pt: 2, width: "100%" }}>{children}</Box>}
    </div>
  );

  // ---------- Global policy inputs ----------
  const regularFields = (
    <>
      <ParameterNumInput
        label="Sales Tax (%)"
        value={policyParams.salesTax}
        onChange={handlePolicyChange("salesTax")}
        onBlur={() => handlePolicyChange("salesTax")(null)}  // flush on blur
        error={!!formErrors.salesTax}
        helpText="Tax on consumer purchases. Higher values raise effective prices and may lower demand."
      />
      <ParameterNumInput
        label="Corporate Income Tax (%)"
        value={policyParams.corporateTax}
        onChange={handlePolicyChange("corporateTax")}
        onBlur={() => handlePolicyChange("corporateTax")(null)} // flush on blur
        error={!!formErrors.corporateTax}
        helpText="Tax on industry profits. Reduces retained earnings and may affect investment."
      />
      <ParameterNumInput
        label="Personal Income Tax (%)"
        value={policyParams.personalIncomeTax}
        onChange={handlePolicyChange("personalIncomeTax")}
        onBlur={() => handlePolicyChange("personalIncomeTax")(null)} // flush on blur
        error={!!formErrors.personalIncomeTax}
        helpText="Tax on individual income. Lowers disposable income and consumption."
      />
      <ParameterNumInput
        label="Property Tax (%)"
        value={policyParams.propertyTax}
        onChange={handlePolicyChange("propertyTax")}
        onBlur={() => handlePolicyChange("propertyTax")(null)} // flush on blur
        error={!!formErrors.propertyTax}
        helpText="Recurring tax on property values. Can influence housing costs and investment."
      />
      <ParameterNumInput
        label="Minimum Wage ($/hr)"
        value={policyParams.minimumWage}
        onChange={handlePolicyChange("minimumWage")}
        onBlur={() => handlePolicyChange("minimumWage")(null)} // flush on blur
        error={!!formErrors.minimumWage}
        helpText="Legal wage floor. Firms cannot offer wages below this value."
      />
      <ParameterNumInput
        label="Tariffs (%)"
        value={policyParams.tariffs}
        onChange={handlePolicyChange("tariffs")}
        onBlur={() => handlePolicyChange("tariffs")(null)} // flush on blur
        error={!!formErrors.tariffs}
        helpText="Import duties that raise costs of targeted goods. Can shift demand across industries."
      />
      <ParameterNumInput
        label="Subsidies (%)"
        value={policyParams.subsidies}
        onChange={handlePolicyChange("subsidies")}
        onBlur={() => handlePolicyChange("subsidies")(null)} // flush on blur
        error={!!formErrors.subsidies}
        helpText="Government support to industries. Lowers effective costs or boosts income."
      />
      {/* Rent Cap now percent */}
      <ParameterNumInput
        label="Rent Cap (%)"
        value={policyParams.rentCap}
        onChange={handlePolicyChange("rentCap")}
        onBlur={() => handlePolicyChange("rentCap")(null)} // flush on blur
        error={!!formErrors.rentCap}
        helpText="Upper bound (percent) on weekly housing rent. If binding, it limits rent growth."
      />
    </>
  );

  // ---------- Advanced overrides (tabs stacked over content) ----------
  const advancedOverrides = (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <Tabs
        value={tab}
        onChange={handleTab}
        aria-label="policy override tabs"
        sx={{ mb: 1, alignSelf: "flex-start" }}
        // MUI v5: use slotProps.indicator instead of deprecated TabIndicatorProps
        slotProps={{ indicator: { sx: { height: 3, bgcolor: "success.main" } } }}
      >
        <Tab id="policy-tab-0" label="By Industry" />
        <Tab id="policy-tab-1" label="By Demographic" />
      </Tabs>

      {/* ----------------------- By Industry ----------------------- */}
      <TabPanel value={tab} index={0}>
        <Box sx={{ width: "100%" }}>
          <Typography variant="subtitle1" align="center" sx={{ mb: 2 }}>
            Overrides by Industry
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {/* selector (full row) */}
          <ParameterMenuInput
            label="Industry"
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            xs={12}
          >
            {industryKeys.map((key) => (
              <MenuItem key={key} value={key}>
                <span style={{ textTransform: "capitalize" }}>{IndustryType[key]}</span>
              </MenuItem>
            ))}
          </ParameterMenuInput>

          {/* % overrides; blank = inherit */}
          <ParameterNumInput
            label="Sales Tax Override (%)"
            value={getInd("salesTax")}
            onChange={onIndChange(selectedIndustry, "salesTax")}
            onBlur={() => onIndChange(selectedIndustry, "salesTax")(null)} // flush
            error={!!(iErrors[selectedIndustry]?.salesTax)}
            helpText="Leave blank to inherit the global Sales Tax."
          />
          <ParameterNumInput
            label="Corporate Income Tax Override (%)"
            value={getInd("corporateTax")}
            onChange={onIndChange(selectedIndustry, "corporateTax")}
            onBlur={() => onIndChange(selectedIndustry, "corporateTax")(null)} // flush
            error={!!(iErrors[selectedIndustry]?.corporateTax)}
            helpText="Leave blank to inherit the global Corporate Income Tax."
          />
          <ParameterNumInput
            label="Tariffs Override (%)"
            value={getInd("tariffs")}
            onChange={onIndChange(selectedIndustry, "tariffs")}
            onBlur={() => onIndChange(selectedIndustry, "tariffs")(null)} // flush
            error={!!(iErrors[selectedIndustry]?.tariffs)}
            helpText="Leave blank to inherit the global Tariffs."
          />
          <ParameterNumInput
            label="Subsidies Override (%)"
            value={getInd("subsidies")}
            onChange={onIndChange(selectedIndustry, "subsidies")}
            onBlur={() => onIndChange(selectedIndustry, "subsidies")(null)} // flush
            error={!!(iErrors[selectedIndustry]?.subsidies)}
            helpText="Leave blank to inherit the global Subsidies."
          />
          {/* Full row; tooltip still visible even when disabled */}
          <ParameterNumInput
            label="Rent Cap Override (%)"
            value={getInd("rentCap")}
            onChange={onIndChange(selectedIndustry, "rentCap")}
            onBlur={() => onIndChange(selectedIndustry, "rentCap")(null)} // flush
            error={!!(iErrors[selectedIndustry]?.rentCap)}
            helpText="Housing industry only; ignored for other industries."
            disabled={selectedIndustry !== "HOUSING"}
            xs={12}
          />
        </Grid>
      </TabPanel>

      {/* --------------------- By Demographic ---------------------- */}
      <TabPanel value={tab} index={1}>
        <Box sx={{ width: "100%" }}>
          <Typography variant="subtitle1" align="center" sx={{ mb: 2 }}>
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

          {/* Full row so long label never truncates */}
          <ParameterNumInput
            label="Personal Income Tax Override (%)"
            value={getDemo("personalIncomeTax")}
            onChange={onDemoChange(selectedDemo, "personalIncomeTax")}
            onBlur={() => onDemoChange(selectedDemo, "personalIncomeTax")(null)} // flush (critical)
            error={!!(dErrors[selectedDemo]?.personalIncomeTax)}
            helpText="Blank = inherit the global Personal Income Tax."
            xs={12}
          />
        </Grid>
      </TabPanel>
    </Box>
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
