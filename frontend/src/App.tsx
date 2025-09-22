import React, { useState, useEffect } from "react";
import { Routes } from './Routes.jsx';
import getTheme from './components/Theme.jsx'
import './App.css'
import {
  ThemeProvider,
  Box
} from '@mui/material';

function App() {
  const [textSize, setTextSize] = useState(18);
  const [volume, setVolume] = useState(50);
  const [mode, setMode] = useState("light");
  const theme = getTheme(mode);

  // Update CSS variable for font size globally
  useEffect(() => {
    document.documentElement.style.setProperty("--app-font-size", `${textSize}px`);
  }, [textSize]);

  useEffect(() => {
    const root = document.body; // target the body element
    root.style.backgroundColor = theme.palette.background.default;
    root.style.color = theme.palette.text.primary;
    root.style.transition = "background-color 0.5s ease, color 0.5s ease";
  }, [theme]);
  return (
    <>
      <ThemeProvider theme={theme}>

        <Routes textSize={textSize} 
                setTextSize={setTextSize} 
                volume={volume} 
                setVolume={setVolume}
                mode={mode}          // pass down mode
                setMode={setMode}/>

      </ThemeProvider>
    </>
  )
}

export default App
