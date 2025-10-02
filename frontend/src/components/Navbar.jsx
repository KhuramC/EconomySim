import { useState } from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
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
    const location = useLocation();

    const links = [
        { label: "Home", path: "/" },
        { label: "About", path: "/about" },
        { label: "Settings", path: "/settings" },
    ];


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
                                    color="#faf7f1"
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
