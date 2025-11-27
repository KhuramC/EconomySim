import { useState, useEffect } from "react";
import { Routes } from "./Routes.jsx";
import getTheme from "./components/Theme.jsx";
import AppSettingsContext from "./context/AppSettingsContext.jsx";
import "./App.css";
import { ThemeProvider } from "@mui/material";

function App() {
  const [textSize, setTextSize] = useState(18);
  const [volume, setVolume] = useState(50);
  const [mode, setMode] = useState("light");
  const theme = getTheme(mode);

  // Update CSS variable for font size globally
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-font-size",
      `${textSize}px`
    );
  }, [textSize]);

  // Animate background and text color
  useEffect(() => {
    const root = document.body;
    root.style.backgroundColor = theme.palette.background.default;
    root.style.color = theme.palette.text.primary;
    root.style.transition = "background-color 0.5s ease, color 0.5s ease";
  }, [theme]);

  return (
    <AppSettingsContext.Provider
      value={{ textSize, setTextSize, volume, setVolume, mode, setMode }}
    >
      <ThemeProvider theme={theme}>
        <Routes />
      </ThemeProvider>
    </AppSettingsContext.Provider>
  );
}

export default App;
