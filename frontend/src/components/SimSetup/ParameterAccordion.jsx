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
 * - Supports an optional "advancedContent" slot toggled by a gear icon.
 * - Backward compatible: if no advancedContent is provided, it behaves as before.
 */
const ParameterAccordion = ({
  title,
  defaultExpanded = false,
  children,                // Core settings -> typically <Grid item> elements
  advancedContent = null,  // Advanced settings -> typically <Grid item> elements
  defaultAdvancedOpen = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(defaultAdvancedOpen);

  return (
    <Accordion defaultExpanded={defaultExpanded}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>

          {/* Show gear icon only when advanced content exists */}
          {advancedContent && (
            <Tooltip
              title={showAdvanced ? "Hide advanced settings" : "Show advanced settings"}
            >
              <IconButton
                size="small"
                aria-label="toggle advanced settings"
                onClick={(e) => {
                  // Prevent toggling the accordion itself
                  e.stopPropagation();
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
        <Grid container spacing={2}>
          {/* Core settings */}
          {children}

          {/* Advanced settings */}
          {advancedContent && showAdvanced && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              {advancedContent}
            </>
          )}

          {/* Children are expected to be Grid items, although they technically don't need to be. */}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default ParameterAccordion;
