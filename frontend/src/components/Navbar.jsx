import { useLocation, Link as RouterLink } from "react-router-dom";
import logoImage from "../assets/business_rat.png";

import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Breadcrumbs,
  Link,
  useTheme,
} from "@mui/material";

function Navbar() {
  const location = useLocation();
  const theme = useTheme();

  const links = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Settings", path: "/settings" },
    { label: "Tutorial", path: "/Tutorial" },
  ];

  const activeColor =
    theme.palette.mode === "light"
      ? theme.palette.primary.light
      : theme.palette.primary.dark;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{ width: "100%", bgcolor: "#416065" }}>
        <Toolbar sx={{ position: "relative", justifyContent: "center" }}>
          {/* Logo on the left */}
          <Box
            component="img"
            src={logoImage}
            alt="Logo"
            sx={{
              maxHeight: 50,
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              borderRadius: 1,
              transition: "transform 0.3s",
              "&:hover": { transform: "translateY(-50%) scale(1.1)" },
            }}
          />

          {/* Centered navigation links */}
          <Breadcrumbs aria-label="breadcrumb">
            {links.map((link) =>
              location.pathname === link.path ? (
                <Typography
                  key={link.path}
                  sx={{ color: activeColor, fontWeight: "bold" }}
                >
                  {link.label}
                </Typography>
              ) : (
                <Link
                  key={link.path}
                  component={RouterLink}
                  to={link.path}
                  underline="hover"
                  color="inherit"
                >
                  {link.label}
                </Link>
              )
            )}
          </Breadcrumbs>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export default Navbar;
