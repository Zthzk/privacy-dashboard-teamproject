import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
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

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_REFRESH_EVENT,
} from 'api/notifications';

export default function Notification() {
  const anchorRef = useRef(null);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
      setError('');
    } catch {
      setError('Notifications could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoadId = window.setTimeout(loadNotifications, 0);
    const intervalId = window.setInterval(loadNotifications, 30000);
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, loadNotifications);
    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, loadNotifications);
    };
  }, [loadNotifications]);

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) loadNotifications();
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? { ...item, is_read: true } : item
      )));
      setUnreadCount((current) => Math.max(0, current - 1));
      try {
        await markNotificationRead(notification.id);
      } catch {
        loadNotifications();
        return;
      }
    }

    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllRead = async () => {
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      setError('Notifications could not be updated.');
    }
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <IconButton
        ref={anchorRef}
        aria-label="Notifications"
        color="secondary"
        onClick={handleToggle}
        sx={{ color: 'text.primary' }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
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
          <Paper sx={{ width: 300, maxWidth: 'calc(100vw - 24px)', boxShadow: 3 }}>
            <Stack direction="row" spacing={1} sx={{ p: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6">Notifications</Typography>
                <Typography variant="caption" color="text.secondary">
                  Latest project activity
                </Typography>
              </Box>
              {unreadCount > 0 && (
                <Button size="small" onClick={handleMarkAllRead}>Mark all read</Button>
              )}
            </Stack>
            <Divider />
            {error && <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>}
            {loading ? (
              <Stack sx={{ p: 3, alignItems: 'center' }}><CircularProgress size={24} /></Stack>
            ) : notifications.length === 0 ? (
              <Typography color="text.secondary" variant="body2" sx={{ p: 3, textAlign: 'center' }}>
                No notifications yet.
              </Typography>
            ) : (
              <List
                disablePadding
                sx={{
                  maxHeight: 280,
                  overflowY: 'scroll',
                  scrollbarWidth: 'thin',
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'action.disabled',
                    borderRadius: 3,
                  },
                }}
              >
                {notifications.map((notification) => (
                <ListItemButton
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{ py: 1.25, bgcolor: notification.is_read ? 'transparent' : 'action.hover' }}
                >
                  <ListItemText
                    primary={notification.title}
                    secondary={(
                      <>
                        {notification.message}
                        <br />
                        {new Date(notification.created_at).toLocaleString()}
                      </>
                    )}
                    slotProps={{
                      primary: { variant: 'subtitle2' },
                      secondary: { variant: 'caption', component: 'span' },
                    }}
                  />
                </ListItemButton>
              ))}
              </List>
            )}
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
