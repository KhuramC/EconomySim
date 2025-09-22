import { createTheme } from "@mui/material";
import { deepOrange, yellow, lightBlue, lightGreen } from "@mui/material/colors";

// Function that returns a theme based on mode ("light" or "dark")
const getTheme = (mode = "light") =>
  createTheme({
    typography: {
      fontFamily: ["Arial"].join(","),
    },
    palette: {
      mode, // "light" or "dark" mode
      primary: {
        light: "#8fb0af",
        main: "#216654",
        dark: "#1a4844",
        contrastText: "#fff",
      },
      secondary: lightBlue,
      action: {
        active: "#7c7c7c",
        activeOpacity: 1,
        hover: "#7c7c7c",
        hoverOpacity: 0.7,
        focus: "#7c7c7c",
        focusOpacity: 1,
        selected: "#7c7c7c",
        selectedOpacity: 1,
      },
      background: {
        default: mode === "light" ? "#daf5f0ff" : "#1e201dff",
        paper: mode === "light" ? "#ffffffff" : "#2b2c28",
      },
      text: {
        primary: mode === "light" ? "#000000ff" : "#ffffff",
        secondary: mode === "light" ? "#333333" : "#cccccc",
      },
      title: {
        default: mode === "light" ? "#216654" : "#fffc52ff",
        secondary: mode === "light" ? "#39502dff" : "#39502dff",
      },
    },
    components: {
      MuiLink: {
        styleOverrides: {
          root: {
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
              color: "#7c7c7c",
            },
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableRipple: true,
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: "none",
            fontSize: "1rem",
            borderRadius: "2px",
            "&:focus": {
              outline: "none",
            },
          },
        },
      },
    },
  });

export default getTheme;

