import { createTheme, ThemeProvider } from "@mui/material";

import { deepOrange, yellow, lightBlue, lightGreen } from "@mui/material/colors";

const theme = createTheme({
  typography: {
    fontFamily: ["Arial"].join(","),
  },
  palette: {
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
      default: "#1e201dff",
    },
    title: {
      default: "#fffc52ff",
      secondary: "#39502dff",
    },
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: "none",
          "&:hover": {
            textDecoration: "underline",
            color: "#7c7c7c", // Change this to your desired hover color
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

export default theme;
