import { BrowserRouter as Router, Routes as Switch, Route } from 'react-router-dom';
import { useState } from 'react';

import HomePage from './pages/Home';
import AboutPage from './pages/About';
import SettingsPage from './pages/Settings';
import TutorialPage from './pages/Tutorial';
import Navbar from './components/Navbar';
import SimulationHandler from './pages/simulation/simulation_handler';

export const Routes = ({ textSize, setTextSize, volume, setVolume, mode, setMode }) => {

  const [isSimulationStarted, setSimulationStarted] = useState(false);

  const [stage, setStage] = useState('setup'); // Track current stage of simulation
  const [simulationConfig, setSimulationConfig] = useState(null); // Holds simulation initial configuration data

  const handleStartSimulation = () => setSimulationStarted(true);

  const handleSetupComplete = (configData) => {
        console.log("Configuration received from setup:", configData);
        setSimulationConfig(configData);
        setStage('running'); // Move to next stage, e.g., 'running'
  };

  return (
    <Router>
      <Navbar />
      <Switch>
        <Route path="/" 
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
        <Route path="/about" element={<AboutPage/>} />
        <Route
          path="/settings"
          element={
            <SettingsPage
              textSize={textSize}
              setTextSize={setTextSize}
              volume={volume}
              setVolume={setVolume}
              mode={mode}
              setMode={setMode}
            />
          }
        />
        <Route path="/tutorial" element={<TutorialPage/>} />
      </Switch>
    </Router>
  );
};