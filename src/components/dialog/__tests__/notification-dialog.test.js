import React from 'react';
import { render, screen, fireEvent, act, within, waitFor } from '@testing-library/react';

import NotificationDialog from '../notification-dialog';
import DialogService from '../../../services/dialog-service';

describe('NotificationDialog', () => {
  it('renders notifications of different types simultaneously', async () => {
    render(<NotificationDialog />);
    act(() => {
      DialogService.instance.nrpNotification({ message: 'info msg' });
      DialogService.instance.warningNotification({ message: 'warn msg' });
    });

    expect(await screen.findByText('info msg')).toBeInTheDocument();
    expect(screen.getByText('warn msg')).toBeInTheDocument();
  });

  it('closes the toast that was actioned, not the one at the same array index', async () => {
    render(<NotificationDialog />);
    act(() => {
      DialogService.instance.nrpNotification({ message: 'info msg' });     // Information -> index 0
      DialogService.instance.warningNotification({ message: 'warn msg' }); // Warning     -> index 1
    });

    const toasts = await screen.findAllByRole('alert');
    expect(toasts).toHaveLength(2);

    // Close the SECOND toast. The old index-based close removed the first one.
    fireEvent.click(within(toasts[1]).getByLabelText('Close'));

    await waitFor(() => {
      expect(screen.queryByText('warn msg')).not.toBeInTheDocument();
    });
    expect(screen.getByText('info msg')).toBeInTheDocument();
  });

  it('ignores a duplicate notification of identical type and message', async () => {
    render(<NotificationDialog />);
    act(() => {
      DialogService.instance.nrpNotification({ message: 'same msg' });
      DialogService.instance.nrpNotification({ message: 'same msg' });
    });

    expect(await screen.findAllByText('same msg')).toHaveLength(1);
  });
});
