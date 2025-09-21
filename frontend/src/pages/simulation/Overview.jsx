import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import TimelinePanel from '../../components/TimelinePanel';
import GraphSlot from '../../components/GraphSlot';
import SidebarNav from '../../components/SidebarNav';
import { Add as AddIcon } from '@mui/icons-material';

export default function Overview() {
  // Demo values (wire these to real state later)
  const year = 5;
  const week = 5;
  const totalWeeks = 52;

  return (
    // Page container
    <Box sx={{ p: 3 }}>
      {/* Top-right date info (right aligned; title is in middle column) */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
          Year {year} &nbsp;&nbsp; Week {week} of {totalWeeks}
        </Typography>
      </Box>

      {/* Three-column layout: left / middle / right */}
      <Grid container spacing={3}>
        {/* LEFT COLUMN: sidebar */}
        <Grid item xs={12} md={2} sx={{ display: 'flex', flexDirection: 'column' }}>
          <SidebarNav active="Overview" />
        </Grid>

        {/* MIDDLE COLUMN */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* Page title at the top of the middle column */}
          <Typography variant="h4" align="left" sx={{ mb: 1, fontWeight: 800 }}>
            Overview
          </Typography>

          {/* Key Performance Indicator row (GDP + Unemployment) */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* GDP */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" align="left" sx={{ fontWeight: 700 }}>
                    GDP
                  </Typography>
                  <Typography variant="h4" align="left" sx={{ fontWeight: 800 }}>
                    $22,540
                  </Typography>
                  <Typography
                    variant="body2"
                    align="left"
                    sx={{ color: 'success.main', fontWeight: 700 }}
                  >
                    ↑ 0.3%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Unemployment */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" align="left" sx={{ fontWeight: 700 }}>
                    Unemployment
                  </Typography>
                  <Typography variant="h4" align="left" sx={{ fontWeight: 800 }}>
                    6.1%
                  </Typography>
                  <Typography
                    variant="body2"
                    align="left"
                    sx={{ color: 'error.main', fontWeight: 700 }}
                  >
                    ↓ 0.2%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Graph area */}
          <Box sx={{ mb: 2 }}>
            <GraphSlot title="Lorenz Curve" onOpen={() => console.log('Open Graph')} />
          </Box>

          {/* Summary card */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" align="left" sx={{ fontWeight: 800 }}>
                Summary
              </Typography>
              <Typography variant="body2" align="left" sx={{ fontWeight: 500 }}>
                • GDP increased by 0.3%
              </Typography>
              <Typography variant="body2" align="left" sx={{ fontWeight: 500 }}>
                • Unemployment rate decreased to 6.1%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT COLUMN */}
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* Policies summary */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" align="left" sx={{ fontWeight: 800 }}>
                Current Policies
              </Typography>
              <Typography variant="body2" align="left" sx={{ fontWeight: 500 }}>
                Sales Tax: 5%
              </Typography>
              <Typography variant="body2" align="left" sx={{ fontWeight: 500 }}>
                Corporate Tax: 20%
              </Typography>
              <Typography variant="body2" align="left" sx={{ fontWeight: 500 }}>
                Property Tax: 12%
              </Typography>
              <Typography variant="body2" align="left" sx={{ fontWeight: 500 }}>
                Tariffs: 4%
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 1, fontWeight: 700 }}
                onClick={() => console.log('View/Edit Policies clicked')}
              >
                View/Edit Policies
              </Button>
            </CardContent>
          </Card>

          {/* Add widget placeholder */}
          <Paper
            variant="outlined"
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 2,
              height: 240,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'box-shadow 120ms, border-color 120ms, transform 80ms',
              '&:hover': { boxShadow: 3, borderColor: 'primary.main' },
              '&:active': { transform: 'scale(0.98)' },
            }}
            onClick={() => console.log('Add widget clicked')}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <AddIcon fontSize="large" />
              <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1 }}>
                Add widget
              </Typography>
            </Box>
          </Paper>

          {/* Control bar */}
          <TimelinePanel />
        </Grid>
      </Grid>
    </Box>
  );
}
