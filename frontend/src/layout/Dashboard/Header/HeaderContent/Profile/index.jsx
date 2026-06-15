import { useRef, useState } from 'react';

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
import UserOutlined from '@ant-design/icons/UserOutlined';

export default function Profile() {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);

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
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.lighter', color: 'primary.main', fontSize: 14 }}>
          JD
        </Avatar>
        <Typography variant="subtitle2">Jane Doe</Typography>
        <DownOutlined style={{ fontSize: 10 }} />
      </Stack>

      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [0, 9] } }] }}
        // Header menus must float above sticky dashboard tables and nested preview dialogs.
        sx={(theme) => ({ zIndex: theme.zIndex.modal + 2 })}
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper sx={{ width: 260, maxWidth: 'calc(100vw - 24px)', boxShadow: 3 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>JD</Avatar>
              <Box>
                <Typography variant="subtitle1">Jane Doe</Typography>
                <Typography variant="caption" color="text.secondary">
                  ML Engineer
                </Typography>
              </Box>
            </Stack>
            <Divider />
            <List disablePadding>
              <ListItemButton>
                <UserOutlined style={{ marginRight: 12 }} />
                <ListItemText primary="Profile" />
              </ListItemButton>
              <ListItemButton>
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
