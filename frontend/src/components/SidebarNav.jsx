// src/components/SidebarNav.jsx
import React from 'react';
import { Paper, List, ListItemButton, ListItemText, Typography, Box } from '@mui/material';

export default function SidebarNav({ active = 'Overview' }) {
  const items = [
    'Overview',
    'Industries',
    'Policies',
    'Demographics',
    'Statistics',
    'Settings',
    'About',
  ];

  return (
    <Paper
      variant="outlined"
      sx={{ width: '100%', borderRadius: 2, overflow: 'hidden' }}
    >
      {/* Title section */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={800}>
          JellyBean Simulator
        </Typography>
      </Box>

      {/* Navigation list */}
      <List disablePadding>
        {items.map((label) => {
          const selected = label === active;
          return (
            <ListItemButton
              key={label}
              selected={selected}
              sx={{
                py: 1.25,
                '&.Mui-selected': { bgcolor: 'action.selected' },
                '&.Mui-selected:hover': { bgcolor: 'action.selected' },
                position: 'relative',
                pl: 2.5,
                ...(selected && {
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 6,
                    bottom: 6,
                    width: 3,
                    bgcolor: 'primary.main',
                    borderRadius: 1,
                  },
                }),
              }}
            >
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  fontWeight: selected ? 700 : 500,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );
}
