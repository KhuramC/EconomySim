import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const ParameterAccordion = ({ title, defaultExpanded = false, children }) => {
  return (
    <Accordion defaultExpanded={defaultExpanded}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {children}
          {/* Expecting children to be Grid items, although they technically don't need to be. */}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default ParameterAccordion;
