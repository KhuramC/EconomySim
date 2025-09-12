import React, { useState, useEffect } from "react";
import { Routes } from './Routes.jsx';
import Theme from './components/Theme.jsx'
import './App.css'
import {
  ThemeProvider,
} from '@mui/material';

function App() {
  const [textSize, setTextSize] = useState(18);
  const [volume, setVolume] = useState(50);

  // Update CSS variable for font size globally
  useEffect(() => {
    document.documentElement.style.setProperty("--app-font-size", `${textSize}px`);
  }, [textSize]);

  const theme = Theme;
  return (
    <>
      <ThemeProvider theme={theme}>
        <Routes textSize={textSize} setTextSize={setTextSize} volume={volume} setVolume={setVolume}/>
      </ThemeProvider>
    </>
  )
}

export default App
