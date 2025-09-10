import { useState } from "react";
//import { Link } from "react-router-dom";
import {
  Button,
  AppBar,
  Toolbar,
  Box,
  Typography,
  Breadcrumbs,
  Link
} from "@mui/material";


function Navbar() {
  

  return (

        <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed"
    sx={{
      width: `100%`,
    bgcolor: "#416065"
    }}>
        <Toolbar sx={{justifyContent: "center"}}>
          <Breadcrumbs aria-label="breadcrumb">
  <Link underline="hover" color="inherit" href="/">
    Home
  </Link>
  <Link
    underline="hover"
    color="inherit"
    href="/about"
  >
    About
  </Link>
  <Link
    underline="hover"
    color="#faf7f1"
    href="/settings"
  >
    Settings
  </Link>
</Breadcrumbs>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export default Navbar;
