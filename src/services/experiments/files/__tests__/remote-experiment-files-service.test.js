/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import RemoteExperimentFilesService from '../remote-experiment-files-service';
import DialogService from '../../../dialog-service.js';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('RemoteExperimentFilesService', () => {

  test('makes sure that invoking the constructor fails with the right message', () => {
    expect(() => {
      new RemoteExperimentFilesService();
    }).toThrow(Error);
    expect(() => {
      new RemoteExperimentFilesService();
    }).toThrowError(Error('Use RemoteExperimentFilesService.instance'));
  });

  test('the experiments service instance always refers to the same object', () => {
    const instance1 = RemoteExperimentFilesService.instance;
    const instance2 = RemoteExperimentFilesService.instance;
    expect(instance1).toBe(instance2);
  });

  test('notifies if not supported', () => {
    jest.spyOn(DialogService.instance, 'warningNotification');

    window.showDirectoryPicker = 'defined';
    // 1
    RemoteExperimentFilesService.instance.notifyNotSupported();
    expect(DialogService.instance.warningNotification).toBeCalledTimes(0);

    window.showDirectoryPicker = undefined;
    // 2
    RemoteExperimentFilesService.instance.notifyNotSupported();
    expect(DialogService.instance.warningNotification).toBeCalledTimes(1);

    window.showDirectoryPicker = null;
    // 2
    RemoteExperimentFilesService.instance.notifyNotSupported();
    expect(DialogService.instance.warningNotification).toBeCalledTimes(2);
  });

  test('opens directory picker and does nothing if localSyncDirectoryHandle is undefined', async () => {
    window.showDirectoryPicker = () => {return undefined};
    jest.spyOn(window, 'showDirectoryPicker');

    await RemoteExperimentFilesService.instance.chooseLocalSyncDirectory();
    expect(RemoteExperimentFilesService.instance.localSyncDirectoryHandle).toBeUndefined();
    expect(window.showDirectoryPicker).toBeCalled()
  });

  test('does not update file list if localSyncDirectoryHandle is undefined', async () => {
    jest.spyOn(RemoteExperimentFilesService.instance, 'updateServerFiles');
    jest.spyOn(RemoteExperimentFilesService.instance, 'updateLocalFiles');
    jest.spyOn(RemoteExperimentFilesService.instance, 'updateFileInfos');
    jest.spyOn(RemoteExperimentFilesService.instance, 'saveLocalFileInfoToLocalStorage');

    await RemoteExperimentFilesService.instance.updateFileLists();
    expect(RemoteExperimentFilesService.instance.localSyncDirectoryHandle).toBeUndefined();
    expect(RemoteExperimentFilesService.instance.updateServerFiles).toBeCalledTimes(0);
    expect(RemoteExperimentFilesService.instance.updateLocalFiles).toBeCalledTimes(0);
    expect(RemoteExperimentFilesService.instance.updateFileInfos).toBeCalledTimes(0);
    expect(RemoteExperimentFilesService.instance.saveLocalFileInfoToLocalStorage).toBeCalledTimes(0);
  });

  // TODO: add proper testing of the service, with mocked values etc.

  test('gets experiment name properly', async () => {
    const relativePath = 'relative_path/to_experiment_files/and.contents'
    const experimentName = RemoteExperimentFilesService.instance.getExperimentNameFromRelativePath(relativePath);
    expect(experimentName).toEqual('relative_path');
  });

  test('gets file name properly', async () => {
    const relativePath = 'relative_path/to_experiment_files/and.contents'
    const fileName = RemoteExperimentFilesService.instance.getFileNameFromRelativePath(relativePath);
    expect(fileName).toEqual('and.contents');
  });

  test('gets parent directory name properly', async () => {
    const relativePath = 'relative_path/to_experiment_files/and.contents'
    const directoryName = RemoteExperimentFilesService.instance.getParentDirectoryFromRelativePath(relativePath);
    expect(directoryName).toEqual('relative_path/to_experiment_files');
  });
});
