import React from 'react';
import { Box, IconButton, Button } from '@mui/material';
import {
  SkipPrevious as SkipPreviousIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  SkipNext as SkipNextIcon,
  FastForward as FastForwardIcon,
} from '@mui/icons-material';

export default function TimelinePanel() {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {/* Previous */}
      <IconButton aria-label="previous">
        <SkipPreviousIcon />
      </IconButton>

      {/* Pause (later can toggle to Play) */}
      <IconButton aria-label="pause">
        <PauseIcon />
      </IconButton>

      {/* Next */}
      <IconButton aria-label="next">
        <SkipNextIcon />
      </IconButton>

      {/* Fast Forward */}
      <IconButton aria-label="fast forward">
        <FastForwardIcon />
      </IconButton>

      {/* Text Button */}
      <Button variant="outlined">Next</Button>
    </Box>
  );
}
