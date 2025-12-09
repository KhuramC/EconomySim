// src/pages/simulation/Tutorial.jsx
//
// High-level tutorial page that explains how to use the simulator.
// It is *read-only* UI: it does not configure the model directly,
// but helps users understand what each setup section does.

import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";

import PageTitle from "../components/PageTitle";
import rats_city from "../assets/tutorial_pics/rats_city.png";
import environmentPic from "../assets/tutorial_pics/environment.png";
import demographicsPic from "../assets/tutorial_pics/demographic.png";
import industriesPic from "../assets/tutorial_pics/industries.png";
import policiesPic from "../assets/tutorial_pics/policies.png";
import simulationPic from "../assets/tutorial_pics/simulation.png";

/**
 * Tutorial step data (titles, summaries, actions, tips).
 *
 * - `id` is used to look up the step and to map screenshots.
 * - `summary` appears under the step title.
 * - `actions` is rendered as a bullet list under "What to do on this step".
 * - `tips` is rendered as a bullet list under "Tips".
 */
const STEPS = [
  {
    id: "environment",
    title: "Step 1 — Environment",
    shortTitle: "Environment",
    summary:
      "Set the overall size and time horizon of your simulation: how many people exist and how long the model will run.",
    actions: [
      "Choose the total number of people in the economy.",
      "Set the maximum simulation length in weeks.",
      "Adjust the baseline inflation rate if you want a hotter or cooler macro environment.",
    ],
    tips: [
      "If you are unsure, start with the default values and focus on policies first.",
      "Longer simulations make trends easier to see, but also take more time to run.",
    ],
  },
  {
    id: "demographics",
    title: "Step 2 — Demographics",
    shortTitle: "Demographics",
    summary:
      "Configure income, savings, and spending behavior for each demographic group (Lower, Middle, Upper, etc.).",
    actions: [
      "For each demographic, adjust mean income and savings levels.",
      "Set the population share so that all demographic proportions add up to 100%.",
      "Allocate spending percentages across industries so each row sums to 100%.",
    ],
    tips: [
      "Check the validation messages at the bottom of the Setup page if proportions do not add to 100%.",
      "Mean income should increase from lower to higher groups so the model behaves realistically.",
    ],
  },
  {
    id: "industries",
    title: "Step 3 — Industries",
    shortTitle: "Industries",
    summary:
      "Configure each industry’s starting balance, inventory, prices, wages, and cost structure.\n" +
      "Use the Advanced Industry Settings panel to fine-tune costs, efficiency, and debt behavior for each industry.",
    actions: [
      "Use the industry selector to switch between Grocery, Housing, etc.",
      "Set a starting price and offered wage for the selected industry.",
      "Open “Advanced Industry Settings” to adjust inventory, starting balance,\n" +
        "fixed costs, material costs, worker efficiency, and debt allowance.",
    ],
    tips: [
      "Try to keep starting prices in a similar magnitude so that graphs are easy to compare.",
      "If you are experimenting with policies, you can leave most industry defaults as-is and only tweak the Advanced section for specific case studies.",
    ],
  },
  {
    id: "policies",
    title: "Step 4 — Policies",
    shortTitle: "Policies",
    summary:
      "Choose global policies and, if needed, override them per-industry or per-demographic using the Advanced Policy Settings panel.",
    actions: [
      "Set global values for sales tax, corporate income tax, tariffs, subsidies, property tax, and minimum wage.",
      "Use the global personal income tax brackets to define your baseline tax system.",
      "Open “Advanced Policy Settings” to override taxes by industry or adjust personal income tax brackets by demographic.",
    ],
    tips: [
      "Global values act as defaults; per-industry overrides only apply where you explicitly change them in Advanced Policy Settings.",
      "Per-demographic personal income tax brackets in Advanced Policy Settings let you explore more progressive or regressive systems.",
    ],
  },
  {
    id: "run_and_interpret",
    title: "Step 5 — Run & Interpret Results",
    shortTitle: "Run & Results",
    summary:
      "Start the simulation and explore how your settings affect indicators, industries, and demographics over time.",
    actions: [
      "Click “Begin Simulation” on the Setup page to create a new model.",
      "Use the timeline controls to move forward in time or auto-play the simulation.",
      "Watch the graphs and statistics panels; then use the Policies page (including Advanced Policy Settings) to tweak parameters while the model is running.",
    ],
    tips: [
      "Change only one or two levers at a time so it is easier to see what caused a change in the graphs.",
      "If everything looks flat, try extending the timeline or making stronger policy changes.",
    ],
  },
];

/**
 * Map of screenshots for each step.
 *
 * Keys must match the `id` field in STEPS.
 * If a step does not appear here, a dashed placeholder box is shown instead.
 */
const STEP_IMAGES = {
  environment: environmentPic,
  demographics: demographicsPic,
  industries: industriesPic,
  policies: policiesPic,
  run_and_interpret: simulationPic,
};

/**
 * Tutorial page component.
 *
 * Props:
 * - onStart: function passed from Routes.jsx / Home flow.
 *   When called, it sets `isSimulationStarted = true` and makes "/"
 *   render the SimulationHandler instead of the Home page.
 */
export default function Tutorial({ onStart }) {
  const navigate = useNavigate();

  // Which step is currently selected in the left navigation list.
  const [selectedStepId, setSelectedStepId] = useState(STEPS[0].id);

  // Find the full step object for the selected id (fallback to first step).
  const selectedStep = useMemo(
    () => STEPS.find((s) => s.id === selectedStepId) ?? STEPS[0],
    [selectedStepId]
  );

  // Image corresponding to the currently selected step (or undefined if not provided).
  const currentStepImage = STEP_IMAGES[selectedStep.id];

  /**
   * Go to setup flow:
   * - If `onStart` exists, call it so that the global state in Routes.jsx
   *   switches from Home -> SimulationHandler (Setup).
   * - Then navigate("/") where the main router decides what to show.
   */
  const goToSetup = () => {
    if (typeof onStart === "function") {
      onStart(); // sets isSimulationStarted = true in Routes.jsx
      navigate("/"); // "/" now shows SimulationHandler (Setup flow)
    } else {
      // Fallback: just go home if onStart is not provided for some reason
      navigate("/");
    }
  };

  // Simple navigation helper back to the landing page.
  const goToHome = () => {
    navigate("/");
  };

  return (
    <Box sx={{ maxWidth: "100%", mx: "auto", px: 2, py: 3 }}>
      {/* Page title for consistency with the rest of the app */}
      <PageTitle text="Tutorial" />

      {/* ---- Hero section: overview + call-to-action ---- */}
      <Card
        sx={{
          mb: 4,
          p: 3,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          alignItems: "center",
        }}
      >
        {/* Left side: heading + description + buttons (text is left-aligned) */}
        <Box sx={{ flex: 1, textAlign: "left" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            How to Use the Economic Simulator
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This tutorial walks you through the typical workflow: configure the
            environment, set up demographics and industries, choose government
            policies, and then run the simulation to see how the economy
            evolves over time. Each section also has an “Advanced” panel where
            you can fine-tune per-industry and per-demographic behavior when
            you need more control.
          </Typography>

          {/* Primary actions from the tutorial hero */}
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
            <Button variant="contained" onClick={goToSetup}>
              Go to Setup
            </Button>
            <Button variant="outlined" onClick={goToHome}>
              Back to Home
            </Button>
          </Stack>
        </Box>

        {/* Right side: static hero illustration */}
        <Box
          component="img"
          src={rats_city}
          alt="Rats_city"
          sx={{ width: 260, borderRadius: 2, boxShadow: 1 }}
        />
      </Card>

      <Grid container spacing={3}>
        {/* ---- Left: step navigation list ---- */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, mb: 1 }}
              gutterBottom
            >
              Tutorial Steps
            </Typography>
            <List dense>
              {STEPS.map((step, idx) => (
                <ListItemButton
                  key={step.id}
                  selected={step.id === selectedStepId}
                  onClick={() => setSelectedStepId(step.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                >
                  <ListItemText
                    primary={`${idx + 1}. ${step.shortTitle}`}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: step.id === selectedStepId ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Card>
        </Grid>

        {/* ---- Right: step content panel ---- */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            {/* Step title */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {selectedStep.title}
            </Typography>

            {/* Summary text; allow \n in strings (e.g., industries.description) to render as line breaks */}
            <Typography
              variant="body1"
              sx={{ mb: 2, whiteSpace: "pre-line" }}
            >
              {selectedStep.summary}
            </Typography>

            {/* Step-specific screenshot area.
                - If an image exists for this step, show it.
                - Otherwise, show a dashed placeholder box. */}
            {currentStepImage ? (
              <Box
                component="img"
                src={currentStepImage}
                alt={`${selectedStep.shortTitle} step screenshot`}
                sx={{
                  width: 700,
                  maxWidth: "100%",
                  maxHeight: 400,
                  objectFit: "contain",
                  borderRadius: 2,
                  mb: 2,
                  boxShadow: 1,
                }}
              />
            ) : (
              <Box
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: "divider",
                  px: 2,
                  py: 1.5,
                  fontSize: 12,
                  color: "text.secondary",
                }}
              >
                Step-specific screenshot placeholder. Replace with an image for
                the current step.
              </Box>
            )}

            {/* Actions list: "What to do on this step" */}
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 0.5 }}
            >
              What to do on this step
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {selectedStep.actions.map((item) => (
                <li key={item}>
                  {/* Left-aligned bullet text (titles remain centered above) */}
                  <Typography variant="body2" sx={{ textAlign: "left" }}>
                    {item}
                  </Typography>
                </li>
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Tips list */}
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 0.5 }}
            >
              Tips
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 1 }}>
              {selectedStep.tips.map((tip) => (
                <li key={tip}>
                  {/* Left-aligned tip text */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "left" }}
                  >
                    {tip}
                  </Typography>
                </li>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ---- FAQ section at the bottom ---- */}
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Frequently Asked Questions
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          Here are a few common questions that come up when people start using
          the simulator.
        </Typography>

        <Stack spacing={1.5}>
          {/* FAQ: flat graphs */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">
                The graphs look flat and do not change. Did I do something
                wrong?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">
                Not necessarily. First, make sure the timeline is advancing and
                that you have run the simulation for enough weeks. If everything
                still looks flat, try increasing the strength of your policy
                changes (for example, raise taxes or subsidies more
                aggressively) or adjust the environment so that shocks are more
                visible.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* FAQ: global vs overrides */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">
                What is the difference between global policies and overrides?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">
                Global policies act as defaults for every industry or
                demographic. Per-industry overrides in Advanced Policy Settings
                replace the global value only for the selected industry, and
                per-demographic personal income tax overrides replace the global
                PIT brackets only for that demographic. This lets you experiment
                with targeted policies without re-creating everything from
                scratch.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* FAQ: where the advanced settings live */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">
                Where are the “Advanced” settings and do I have to use them?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">
                Each accordion (Industries and Policies) has an “Advanced
                Industry Settings” or “Advanced Policy Settings” panel you can
                expand. These panels expose per-industry and per-demographic
                controls for more detailed experiments. They are completely
                optional—if you leave them untouched, the model uses the global
                values you set in the main fields.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* FAQ: changing policies during run */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">
                Can I change policies while the simulation is running?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">
                Yes. Go to the Policies page during the simulation, adjust the
                values (including Advanced Policy Settings), and the new
                settings will be sent to the model. This is useful for running
                “what-if” experiments and seeing how the economy reacts to
                shocks over time.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </Box>
    </Box>
  );
}
