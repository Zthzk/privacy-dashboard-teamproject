import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test } from 'vitest';

import Profile from './index';

beforeEach(() => {
  window.localStorage.clear();
});

describe('Profile menu', () => {
  test('shows logout without an unavailable profile action', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Account/ }));

    expect(await screen.findByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
  });
});
