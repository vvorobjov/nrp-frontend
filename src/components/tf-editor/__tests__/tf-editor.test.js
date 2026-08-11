/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, waitFor } from '@testing-library/react';

import TransceiverFunctionEditor from '../tf-editor';
import ExperimentStorageService from '../../../services/experiments/files/experiment-storage-service';
import ExperimentWorkbenchService from '../../experiment-workbench/experiment-workbench-service';
import DialogService from '../../../services/dialog-service';

// CodeMirror 6 relies on layout APIs jsdom does not implement; this suite
// exercises the file-load logic on open, not the editor widget, so stub it.
// (jest.mock is hoisted above the imports above by babel-jest.)
jest.mock('@uiw/react-codemirror', () => ({
  __esModule: true,
  default: () => null
}));

// Regression guard for EBR2-122: opening an experiment used to crash with
// "Could not load the experiment files." because componentDidMount read
// this.state.experimentName before its (batched) setState had flushed, so
// getExperimentFiles was called with undefined -> undefined.replace(...).
describe('TransceiverFunctionEditor - loads experiment files on open (EBR2-122)', () => {
  const EXPERIMENT_ID = 'braitenberg_husky_holodeck_1_2_3';

  let getExperimentFiles;
  let getFileText;
  let dataError;

  beforeEach(() => {
    ExperimentWorkbenchService.instance.experimentID = EXPERIMENT_ID;

    // Faithful to the real service: it does experimentName.replace(...), which
    // throws when the argument is undefined. Mocking that behaviour lets the
    // test reproduce the crash on the unfixed component.
    getExperimentFiles = jest
      .spyOn(ExperimentStorageService.instance, 'getExperimentFiles')
      .mockImplementation(async (experimentName) => {
        if (typeof experimentName !== 'string' || experimentName.length === 0) {
          throw new Error('getExperimentFiles: experimentName is required');
        }
        return [
          { type: 'file', name: 'simulation_config.json' },
          { type: 'file', name: 'tf_1.py' }
        ];
      });

    getFileText = jest
      .spyOn(ExperimentStorageService.instance, 'getFileText')
      .mockResolvedValue('{}');

    dataError = jest
      .spyOn(DialogService.instance, 'dataError')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    ExperimentStorageService.instance.stopUpdates();
  });

  it('requests the file list with the real experiment id, not undefined', async () => {
    render(<TransceiverFunctionEditor />);

    await waitFor(() => expect(getExperimentFiles).toHaveBeenCalled());

    expect(getExperimentFiles).toHaveBeenCalledWith(EXPERIMENT_ID);
    expect(getExperimentFiles).not.toHaveBeenCalledWith(undefined);
  });

  it('does not raise the "Could not load the experiment files" data error', async () => {
    render(<TransceiverFunctionEditor />);

    // Wait until the whole happy-path chain (list -> default file content) ran.
    await waitFor(() => expect(getFileText).toHaveBeenCalled());

    expect(dataError).not.toHaveBeenCalled();
  });
});
