import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_REFRESH_EVENT,
} from 'api/notifications';
import Notification from '../Notification';

vi.mock('api/notifications');

const notificationPayload = {
  unread_count: 1,
  notifications: [
    {
      id: 7,
      type: 'data_source_updated',
      title: 'Data source updated',
      message: 'Customer data was updated.',
      link: '/projects/3',
      is_read: false,
      created_at: '2026-07-17T10:30:00Z',
    },
  ],
};

function renderNotification() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<Notification />} />
        <Route path="/projects/:projectId" element={<div>Project destination</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getNotifications.mockResolvedValue(notificationPayload);
  markNotificationRead.mockResolvedValue({ ...notificationPayload.notifications[0], is_read: true });
  markAllNotificationsRead.mockResolvedValue({ updated: 1, unread_count: 0 });
});

describe('Notification', () => {
  test('loads persisted notifications and opens the activity list', async () => {
    const user = userEvent.setup();
    renderNotification();

    await waitFor(() => expect(getNotifications).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: 'Notifications' }));

    expect(await screen.findByRole('button', { name: /Customer data was updated/ })).toBeInTheDocument();
    expect(screen.getByText('Mark all read')).toBeInTheDocument();
  });

  test('marks a notification read and follows its link', async () => {
    const user = userEvent.setup();
    renderNotification();

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(await screen.findByText('Data source updated'));

    expect(markNotificationRead).toHaveBeenCalledWith(7);
    expect(await screen.findByText('Project destination')).toBeInTheDocument();
  });

  test('marks all notifications read', async () => {
    const user = userEvent.setup();
    renderNotification();

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(await screen.findByText('Mark all read'));

    expect(markAllNotificationsRead).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText('Mark all read')).not.toBeInTheDocument());
  });

  test('refreshes immediately when an application action requests it', async () => {
    renderNotification();
    await waitFor(() => expect(getNotifications).toHaveBeenCalledTimes(1));
    getNotifications.mockResolvedValue({
      unread_count: 2,
      notifications: [
        ...notificationPayload.notifications,
        {
          id: 8,
          title: 'High-risk data source detected',
          message: 'Biometric images is now high risk.',
          link: '/projects/3',
          is_read: false,
          created_at: '2026-07-17T10:31:00Z',
        },
      ],
    });

    window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));

    await waitFor(() => expect(getNotifications).toHaveBeenCalledTimes(2));
  });
});
