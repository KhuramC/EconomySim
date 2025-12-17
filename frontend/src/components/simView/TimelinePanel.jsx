import React from "react";
import { Box, IconButton } from "@mui/material";
import {
  SkipPrevious as SkipPreviousIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  SkipNext as SkipNextIcon,
} from "@mui/icons-material";

/**
 * A panel that handles stepping through a simulation.
 */
export default function TimelinePanel({ simAPI }) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const [fastForwardRate, setFastForwardRate] = React.useState(1);

  const fastFowardMax = 3;

  React.useEffect(() => {
    if (!simAPI) return;

    if (isPlaying) {
      const interval = setInterval(() => {
        simAPI.step();
      }, 1000 / fastForwardRate);

      return () => clearInterval(interval);
    }
  }, [isPlaying, fastForwardRate, simAPI]);

  const handlePlayPauseClick = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
      {/* Reverse Step. Allow on TimelinePanel if reverseStep is implemented on backend */}
      {/* <IconButton
        aria-label="previous"
        onClick={() => simAPI.reverseStep()}
        disabled={!simAPI}
      >
        <SkipPreviousIcon />
      </IconButton> */}
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
        onClick={() => simAPI.step()}
        disabled={!simAPI}
      >
        <SkipNextIcon />
      </IconButton>

      {/* Fast Forward */}
      <IconButton
        classes={{ outline: "none" }}
        aria-label="fast forward"
        disabled={!simAPI}
        onClick={() => {
          if (!isPlaying) return;
          if (fastForwardRate >= fastFowardMax) {
            setFastForwardRate(1);
          } else {
            const newRate = fastForwardRate + 1;
            setFastForwardRate(newRate);
          }
        }}
      >
        {"x" + fastForwardRate}
      </IconButton>
    </Box>
  );
}
