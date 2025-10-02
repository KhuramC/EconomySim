// src/components/PageTitle.jsx
import { Typography } from "@mui/material";
import { useAppSettings } from "../context/AppSettingsContext";
import { useState, useEffect } from "react";

export default function PageTitle({ text }) {
  const { textSize } = useAppSettings();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      // Hide when scrolling down, show when scrolling up
      if (currentScroll > lastScroll) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScroll(currentScroll);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  return (
    <Typography
      variant="h3"
      sx={{
        position: "sticky",
        top: 0,
        backgroundColor: "transparent",
        zIndex: 10,
        fontWeight: "bold",
        fontSize: `${textSize * 3}px`,
        transition: "font-size 0.2s ease, opacity 0.3s ease",
        py: 2,
        opacity: isVisible ? 1 : 0,
      }}
    >
      {text}
    </Typography>
  );
}
