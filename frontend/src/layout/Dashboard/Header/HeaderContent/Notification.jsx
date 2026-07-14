import { useRef, useState } from 'react';

import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import BellOutlined from '@ant-design/icons/BellOutlined';

const notifications = [
  {
    title: 'Data source updated',
    description: 'Customer review data was updated recently.',
  },
  {
    title: 'Project inventory changed',
    description: 'Project metadata is now synced with the backend.',
  },
];

export default function Notification() {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <IconButton
        ref={anchorRef}
        aria-label="Notifications"
        color="secondary"
        onClick={() => setOpen((current) => !current)}
        sx={{ color: 'text.primary' }}
      >
        <Badge badgeContent={notifications.length} color="error">
          <BellOutlined />
        </Badge>
      </IconButton>

      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [0, 9] } }] }}
        // Match the profile menu layer so notification content is never hidden by sticky tables.
        sx={(theme) => ({ zIndex: theme.zIndex.modal + 2 })}
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper sx={{ width: 320, maxWidth: 'calc(100vw - 24px)', boxShadow: 3 }}>
            <Stack spacing={0.5} sx={{ p: 2 }}>
              <Typography variant="h6">Notifications</Typography>
              <Typography variant="caption" color="text.secondary">
                Latest project activity
              </Typography>
            </Stack>
            <Divider />
            <List disablePadding>
              {notifications.map((notification) => (
                <ListItemButton key={notification.title} sx={{ py: 1.25 }}>
                  <ListItemText
                    primary={notification.title}
                    secondary={notification.description}
                    primaryTypographyProps={{ variant: 'subtitle2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
