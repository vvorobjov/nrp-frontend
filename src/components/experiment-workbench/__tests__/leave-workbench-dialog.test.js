/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import LeaveWorkbenchDialog from '../leave-workbench-dialog';

// The leave/exit dialog is the user-facing side of the workbench state handling
// hardened in EBR2-100/108: whether the simulation can still be shut down
// (shutdownDisabled) must drive both the message and the Shutdown control.
describe('LeaveWorkbenchDialog', () => {
  const renderDialog = (props = {}) => {
    const handlers = {
      setVisibility: jest.fn(),
      leaveWorkbench: jest.fn(),
      shutdownSimulation: jest.fn()
    };
    render(
      <LeaveWorkbenchDialog
        visible
        shutdownDisabled={false}
        {...handlers}
        {...props}
      />
    );
    return handlers;
  };

  it('stays hidden until it is made visible', () => {
    render(
      <LeaveWorkbenchDialog
        visible={false}
        shutdownDisabled={false}
        setVisibility={jest.fn()}
        leaveWorkbench={jest.fn()}
        shutdownSimulation={jest.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('offers both leave and shutdown when the simulation can still be shut down', async () => {
    const handlers = renderDialog({ shutdownDisabled: false });

    expect(await screen.findByText(/leave or shutdown the simulation/i)).toBeInTheDocument();

    const shutdown = screen.getByRole('button', { name: 'Shutdown' });
    expect(shutdown).toBeEnabled();
    fireEvent.click(shutdown);
    expect(handlers.shutdownSimulation).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    expect(handlers.leaveWorkbench).toHaveBeenCalledTimes(1);
  });

  it('offers leave only and disables shutdown for a finalized simulation', async () => {
    const handlers = renderDialog({ shutdownDisabled: true });

    expect(await screen.findByText(/leave the simulation/i)).toBeInTheDocument();
    expect(screen.queryByText(/shutdown the simulation/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Shutdown' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    expect(handlers.leaveWorkbench).toHaveBeenCalledTimes(1);
  });
});
