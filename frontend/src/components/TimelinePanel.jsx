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

  const[fastForwardRate, setFastForwardRate] = React.useState(1);

  const fastFowardMax = 3;

  React.useEffect(() => {
    if(!simAPI) return;

    if(isPlaying) {
      const interval = setInterval(() => {
        simAPI.sendMessage({ action: "step" });
      }, 1000 / fastForwardRate);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, fastForwardRate, simAPI]);

  const handlePlayPauseClick = () => {
    setIsPlaying(!isPlaying);
    if(!isPlaying === false) 
      setFastForwardRate(1);
  };

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
      <IconButton aria-label="fast forward" disabled={!simAPI}
      onClick={() => {
          if(!isPlaying)
            return;
          if (fastForwardRate >= fastFowardMax) {
            setFastForwardRate(1);
          } else {
            const newRate = fastForwardRate +1;
          setFastForwardRate(newRate);
          }
        }}
      >
        
      
        <FastForwardIcon />
      </IconButton>
    </Box>
  );
}
