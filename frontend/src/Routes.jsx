import { BrowserRouter as Router, Routes as Switch, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import AboutPage from './pages/About';
import SettingsPage from './pages/Settings';
export const Routes = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" element={<HomePage/>} />
        <Route path="/home" element={<HomePage/>} />
        <Route path="/about" element={<AboutPage/>} />
        <Route path="/settings" element={<SettingsPage/>} />
      </Switch>
    </Router>
  );
}