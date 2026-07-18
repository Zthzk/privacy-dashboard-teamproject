import { useRef, useState } from 'react';

import ClickAwayListener from '@mui/material/ClickAwayListener';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import MoreOutlined from '@ant-design/icons/MoreOutlined';

import Profile from './Profile';

export default function MobileSection() {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton ref={anchorRef} aria-label="Open account actions" onClick={() => setOpen((current) => !current)}>
        <MoreOutlined />
      </IconButton>
      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [0, 9] } }] }}
        // Keep the mobile account menu above sticky table headers and page overlays.
        sx={(theme) => ({ zIndex: theme.zIndex.modal + 2 })}
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper sx={{ p: 1, boxShadow: 3 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Profile />
            </Stack>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
}
