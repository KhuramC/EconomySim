import { createContext, useContext } from "react";

const AppSettingsContext = createContext({
  textSize: 18,
  setTextSize: () => {},
  volume: 50,
  setVolume: () => {},
  mode: "light",
  setMode: () => {}
});

export const useAppSettings = () => useContext(AppSettingsContext);

export default AppSettingsContext;
