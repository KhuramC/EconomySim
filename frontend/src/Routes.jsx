import { BrowserRouter as Router, Routes as Switch, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';
export const Routes = ({ textSize, setTextSize, volume, setVolume }) => {
  return (
    <Router>
      <Navbar />
      <Switch>
        <Route path="/" element={<Home volume={volume} />} />
        <Route path="/home" element={<Home volume={volume} />} />
        <Route path="/about" element={<About volume={volume} />} />
        <Route
          path="/settings"
          element={
            <Settings
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