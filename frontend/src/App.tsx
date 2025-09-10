import { Routes } from './Routes.jsx';
import Navbar from './components/Navbar.jsx'
import Theme from './components/Theme.jsx'
import './App.css'
import {
  ThemeProvider,
} from '@mui/material';

function App() {

  const theme = Theme;

  return (
    <>
      <ThemeProvider theme={theme}>

        <Navbar />
        <Routes />
      </ThemeProvider>
    </>
  )
}

export default App
