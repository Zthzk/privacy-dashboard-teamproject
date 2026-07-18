import React from 'react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import DownOutlined from '@ant-design/icons/DownOutlined';
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';

function readCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || '{}');
  } catch {
    // Ignore broken localStorage data and fall back to a generic account label.
    return {};
  }
}

export default function Profile() {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const storedUser = readCurrentUser();
  const displayName = storedUser.username || storedUser.email || 'Account';
  const subtitle = storedUser.email || 'Signed in';

  // Build initials from the displayed account name for the avatar.
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'A';

  return (
    <Box sx={{ flexShrink: 0, ml: 1 }}>
      <Stack
        ref={anchorRef}
        component="button"
        type="button"
        onClick={() => setOpen((current) => !current)}
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          border: 0,
          bgcolor: 'transparent',
          cursor: 'pointer',
          p: 0.5,
        }}
      >
        <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>{initials}</Avatar>
        <Box>
            <Typography variant="subtitle1">{displayName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
        </Box>
        <DownOutlined style={{ fontSize: 10 }} />
      </Stack>

      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [0, 9] } }] }}
        sx={(theme) => ({ zIndex: theme.zIndex.modal + 2 })}
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper sx={{ width: 260, maxWidth: 'calc(100vw - 24px)', boxShadow: 3 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 2 }}>
            {/* Show initials from the currently logged-in user instead of hardcoded demo data. */}
              <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
                {initials}
              </Avatar>

              <Box>
                {/* Show the real username or email saved after login/register. */}
                <Typography variant="subtitle1">{displayName}</Typography>

                {/* Use the user's email as subtitle, or a neutral fallback if no email exists. */}
                <Typography variant="caption" color="text.secondary">
                {subtitle}
                </Typography>
              </Box>
            </Stack>
            <Divider />
            <List disablePadding>
              <ListItemButton
                  onClick={() => {
                      localStorage.removeItem('accessToken');
                      localStorage.removeItem('refreshToken');
                      navigate('/login');
                  }}
              >
                <LogoutOutlined style={{ marginRight: 12 }} />
                <ListItemText primary="Logout" />
              </ListItemButton>
            </List>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
