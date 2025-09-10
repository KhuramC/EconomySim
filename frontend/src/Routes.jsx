import { BrowserRouter as Router, Routes as Switch, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import AboutPage from './pages/About';
import SettingsPage from './pages/Settings';
import Navbar from './components/Navbar';
export const Routes = () => {
  return (
    <Router>

      <Navbar />
      <Switch>
        <Route path="/" element={<HomePage/>} />
        <Route path="/home" element={<HomePage/>} />
        <Route path="/about" element={<AboutPage/>} />
        <Route path="/settings" element={<SettingsPage/>} />
      </Switch>
    </Router>
  );
}