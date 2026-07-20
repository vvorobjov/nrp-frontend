import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

import ErrorDialog from '../error-dialog';
import DialogService from '../../../services/dialog-service';

describe('ErrorDialog', () => {
  it('shows the first error with its type and message', async () => {
    render(<ErrorDialog />);
    act(() => {
      DialogService.instance.networkError({ message: 'first boom' });
    });

    expect(await screen.findByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText('first boom')).toBeInTheDocument();
  });

  it('queues subsequent errors and shows each in turn instead of dropping them', async () => {
    render(<ErrorDialog />);
    act(() => {
      DialogService.instance.networkError({ message: 'first boom' });
      DialogService.instance.dataError({ message: 'second boom' });
    });

    // First error is displayed while the second waits in the queue.
    expect(await screen.findByText('first boom')).toBeInTheDocument();
    expect(screen.getByText(/1 more error queued/i)).toBeInTheDocument();
    expect(screen.queryByText('second boom')).not.toBeInTheDocument();

    // Dismiss the first -> the queued error is revealed, not lost.
    fireEvent.click(screen.getByLabelText('Close'));
    expect(await screen.findByText('second boom')).toBeInTheDocument();
    expect(screen.getByText('Data Error')).toBeInTheDocument();
    expect(screen.queryByText('first boom')).not.toBeInTheDocument();

    // Dismissing the last error closes the dialog entirely.
    fireEvent.click(screen.getByLabelText('Close'));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows a clean message and a collapsed technical-details toggle', async () => {
    render(<ErrorDialog />);
    act(() => {
      DialogService.instance.unexpectedError({
        message: 'human readable message',
        stack: 'Error: internal at foo'
      });
    });

    expect(await screen.findByText('human readable message')).toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /technical details/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
