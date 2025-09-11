import { Routes } from './Routes.jsx';
import Theme from './components/Theme.jsx'
import './App.css'
import {
  ThemeProvider,
} from '@mui/material';

function App() {
  // hello world
  const theme = Theme;

  return (
    <>
      <ThemeProvider theme={theme}>
        <Routes />
      </ThemeProvider>
    </>
  )
}

export default App
