import { BrowserRouter as Router, Routes as Switch, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import AboutPage from './pages/About';
import SettingsPage from './pages/Settings';
import Navbar from './components/Navbar';
export const Routes = ({ textSize, setTextSize, volume, setVolume }) => {
  return (
    <Router>
      <Navbar />
      <Switch>
        <Route path="/" element={<HomePage volume={volume} />} />
        <Route path="/home" element={<HomePage volume={volume} />} />
        <Route path="/about" element={<AboutPage volume={volume} />} />
        <Route
          path="/settings"
          element={
            <SettingsPage
              textSize={textSize}
              setTextSize={setTextSize}
              volume={volume}
              setVolume={setVolume}
            />
          }
        />
      </Switch>
    </Router>
  );
};