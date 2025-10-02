// src/Routes.jsx
import { BrowserRouter as Router, Routes as Switch, Route } from 'react-router-dom';
import { useState } from 'react';

import HomePage from './pages/Home';
import AboutPage from './pages/About';
import SettingsPage from './pages/Settings';
import TutorialPage from './pages/Tutorial';
import Navbar from './components/Navbar';
import SimulationHandler from './pages/simulation/simulation_handler';
import BaseSimView from './pages/simulation/BaseSimView';

export const Routes = () => {
  // App-level state to control whether the simulation is started
  const [isSimulationStarted, setSimulationStarted] = useState(false);

  // Simulation lifecycle / config kept at this level
  const [stage, setStage] = useState('setup');
  const [simulationConfig, setSimulationConfig] = useState(null);

  // When user chooses to start from HomePage
  const handleStartSimulation = () => setSimulationStarted(true);

  // When setup is completed inside SimulationHandler (e.g., from SetupPage)
  const handleSetupComplete = (configData) => {
    console.log("Configuration received from setup:", configData);
    setSimulationConfig(configData);
    setStage('running'); // move to the next stage after setup
  };

  return (
    <Router>
      {/* Global top navigation bar */}
      <Navbar />

      {/* Route switch: map URLs to elements */}
      <Switch>
        {/* Root route:
            - Before starting: show HomePage (passes onStart)
            - After starting: show SimulationHandler (passes stage/config/callback) */}
        <Route
          path="/"
          element={
            isSimulationStarted ? (
              <SimulationHandler
                stage={stage}
                simulationConfig={simulationConfig}
                onSetupComplete={handleSetupComplete}
              />
            ) : (
              <HomePage onStart={handleStartSimulation} />
            )
          }
        />

        {/* Simulation view shell (left sidebar + right-pane routes).
            Children like /BaseSimView/overview are handled inside BaseSimView. */}
        <Route path="/BaseSimView/*" element={<BaseSimView />} />

        {/* Other standalone top-level pages */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/tutorial" element={<TutorialPage />} />
      </Switch>
    </Router>
  );
};
