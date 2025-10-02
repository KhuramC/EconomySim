import SetupPage from "./SetupPage";

// Add other imports for future simulation steps here.

function SimulationHandler({ stage, simulationConfig, onSetupComplete }) {
    
    switch (stage) {
        case 'setup':
            return <SetupPage onSetupComplete={onSetupComplete} />;

        case 'running':
            return <div><h1>SimulationRunning</h1></div>

        default:
            return <div>Error: Unknown simulation stage.</div>
    }
}

export default SimulationHandler;