import { useState } from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import {
    Button,
    AppBar,
    Toolbar,
    Box,
    Typography,
    Breadcrumbs,
    Link,
    useTheme
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

    // Pick a color for active link based on mode
    const activeColor = theme.palette.mode === "light" 
        ? theme.palette.primary.light  // dark green in light mode
        : theme.palette.primary.dark; // lighter color in dark mode


    return (

        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="fixed"
                sx={{
                    width: `100%`,
                    bgcolor: "#416065"
                }}>
                <Toolbar sx={{ justifyContent: "center" }}>
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
