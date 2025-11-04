import { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  Box,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

/**
 * Generic accordion wrapper for parameter sections.
 * - Shows core settings by default.
 * - If `advancedContent` is provided, a gear icon appears in the header.
 * - When toggled ON: renders a divider, a title on its own line,
 *   and then the advanced content in a separate Grid row below.
 */
const ParameterAccordion = ({
  title,
  defaultExpanded = false,
  children,                   // Core settings -> typically <Grid item>
  advancedContent = null,     // Advanced settings -> typically <Grid item>
  defaultAdvancedOpen = false,
  advancedTitle = "Advanced Settings",
  advancedTitleProps = {},
}) => {
  const [showAdvanced, setShowAdvanced] = useState(defaultAdvancedOpen);

  return (
    <Accordion defaultExpanded={defaultExpanded}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>

          {advancedContent && (
            <Tooltip
              title={showAdvanced ? "Hide advanced settings" : "Show advanced settings"}
            >
              <IconButton
                size="small"
                aria-label="toggle advanced settings"
                onClick={(e) => {
                  e.stopPropagation();       // do not toggle the accordion itself
                  setShowAdvanced((s) => !s);
                }}
                onFocus={(e) => e.stopPropagation()}
              >
                <SettingsOutlinedIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        {/* Core row */}
        <Grid container spacing={2}>
          {children}
        </Grid>

        {/* Advanced block (always starts on a new line) */}
        {advancedContent && showAdvanced && (
          <>
            <Divider sx={{ my: 2 }} />

            {/* Title row */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "text.secondary", mb: 1 }}
                  {...advancedTitleProps}
                >
                  {advancedTitle}
                </Typography>
              </Grid>
            </Grid>

            {/* Advanced fields row (independent Grid to guarantee line break) */}
            <Grid container spacing={2}>
              {advancedContent}
            </Grid>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default ParameterAccordion;
