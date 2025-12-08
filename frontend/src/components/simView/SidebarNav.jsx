import {
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";

/**
 * A side panel that handles navigation between simulation pages.
 */
export default function SidebarNav({ basePath = "" }) {
  // Keep the order exactly as requested (no extra items)
  const ITEMS = [
    { label: "Overview", path: `${basePath}/overview` },
    { label: "Industries", path: `${basePath}/industries` },
    { label: "Policies", path: `${basePath}/policies` },
    { label: "Demographics", path: `${basePath}/demographics` },
    { label: "Statistics", path: `${basePath}/statistics` },
  ];

  const { pathname } = useLocation();
  const isSelected = (to) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Paper
      variant="outlined"
      sx={{ width: "100%", borderRadius: 2, overflow: "hidden" }}
    >
      {/* Sidebar title */}
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" fontWeight={800}>
          JellyBean Simulator
        </Typography>
      </Box>

      {/* Navigation items */}
      <List disablePadding>
        {ITEMS.map(({ label, path }) => {
          const selected = isSelected(path);
          return (
            <ListItemButton
              key={label}
              component={RouterLink}
              to={path}
              selected={selected}
              sx={{
                py: 1.25,
                "&.Mui-selected": { bgcolor: "action.selected" },
                "&.Mui-selected:hover": { bgcolor: "action.selected" },
                position: "relative",
                pl: 2.5,
                ...(selected && {
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 6,
                    bottom: 6,
                    width: 3,
                    bgcolor: "primary.main",
                    borderRadius: 1,
                  },
                }),
              }}
            >
              <ListItemText
                primary={label}
                // Use slotProps instead of deprecated primaryTypographyProps
                slotProps={{
                  primary: { sx: { fontWeight: selected ? 700 : 500 } },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );
}
