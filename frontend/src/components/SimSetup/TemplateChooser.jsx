import { useState } from "react";
import {
  Grid,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Typography,
} from "@mui/material";
import { CityTemplate } from "../../types/CityTemplate.js";

/**
 * A component to select a pre-defined city template.
 * Calls the onTemplateSelect prop with the name of the chosen template.
 */
export default function TemplateChooser({ onTemplateSelect }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleTemplateChange = (event, newTemplate) => {
    if (newTemplate !== null) {
      setSelectedTemplate(newTemplate);
      // Call the function passed from the parent component
      onTemplateSelect(newTemplate);
    }
  };

  return (
    <Paper elevation={2} sx={{ padding: 2, mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Choose a City Template
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a template to pre-fill all simulation parameters.
          </Typography>
        </Grid>
        <Grid item xs={12} sx={{ textAlign: "center" }}>
          <ToggleButtonGroup
            value={selectedTemplate}
            exclusive
            onChange={handleTemplateChange}
            aria-label="city template chooser"
          >
            <Tooltip title="A small town based on Columbia, MO.">
              {/* Tooltip wraps the button */}
              <ToggleButton
                value={CityTemplate.SMALL}
                aria-label="small template"
              >
                {CityTemplate.SMALL.charAt(0).toUpperCase() +
                  CityTemplate.SMALL.slice(1)}
              </ToggleButton>
            </Tooltip>

            <Tooltip title="A medium-sized city based on Madison, WI.">
              <ToggleButton
                value={CityTemplate.MEDIUM}
                aria-label="medium template"
              >
                {CityTemplate.MEDIUM.charAt(0).toUpperCase() +
                  CityTemplate.MEDIUM.slice(1)}
              </ToggleButton>
            </Tooltip>

            <Tooltip title="A large, complex metropolis based on San Francisco, CA.">
              <ToggleButton
                value={CityTemplate.LARGE}
                aria-label="big template"
              >
                {CityTemplate.LARGE.charAt(0).toUpperCase() +
                  CityTemplate.LARGE.slice(1)}
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
        </Grid>
      </Grid>
    </Paper>
  );
}
