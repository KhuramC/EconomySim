import React from "react";
import { Box, IconButton, Button } from "@mui/material";
import {
  SkipPrevious as SkipPreviousIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  SkipNext as SkipNextIcon,
  FastForward as FastForwardIcon,
} from "@mui/icons-material";

export default function TimelinePanel({ simAPI }) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const handlePlayPauseClick = () => {
    // This currently only toggles the icon state and does not affect the simulation.
    setIsPlaying(!isPlaying);
  };

  //TODO: make a useEffect to successively step through the model if isPlaying is true.

  return (
    <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
      {/* Previous */}
      <IconButton
        aria-label="previous"
        onClick={() => simAPI.sendMessage({ action: "reverse_step" })}
        disabled={!simAPI}
      >
        <SkipPreviousIcon />
      </IconButton>
      {/* Play/Pause Toggle Button */}
      <IconButton
        aria-label={isPlaying ? "pause" : "play"}
        onClick={handlePlayPauseClick}
        disabled={!simAPI}
      >
        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>

      {/* Next */}
      <IconButton
        aria-label="next"
        onClick={() => simAPI.sendMessage({ action: "step" })}
        disabled={!simAPI}
      >
        <SkipNextIcon />
      </IconButton>

      {/* Fast Forward */}
      <IconButton aria-label="fast forward" disabled={!simAPI}>
        {/* TODO: make onClick to speed up simulation speed if it is currently playing*/}
        <FastForwardIcon />
      </IconButton>
    </Box>
  );
}
