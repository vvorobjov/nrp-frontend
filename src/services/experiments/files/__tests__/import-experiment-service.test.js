/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import ImportExperimentService from '../import-experiment-service';

import MockScanStorageResponse from '../../../../mocks/mock_scan_storage_response.json';
import MockZipResponses from '../../../../mocks/mock_zip_responses.json';

test('makes sure that invoking the constructor fails with the right message', () => {
  expect(() => {
    new ImportExperimentService();
  }).toThrow(Error);
  expect(() => {
    new ImportExperimentService();
  }).toThrowError(Error('Use ImportExperimentService.instance'));
});

test('makes sure zip responses are encapsulated in an object', async () => {
  let importZipResponses = {zipBaseFolderName:['0', '0'], destFolderName:['1', '2'], numberOfZips: 2};
  expect(await ImportExperimentService.instance.getImportZipResponses(
    MockZipResponses.map((response) => new Response(JSON.stringify(response))))).toStrictEqual(importZipResponses);
});

test('makes sure storage response is prepared', async () => {
  let scanStorageResponse = {deletedFoldersNumber:2, addedFoldersNumber:1, deletedFolders:'0, 1', addedFolders:'2' };
  expect(await ImportExperimentService.instance.getScanStorageResponse(
    new Response(JSON.stringify(MockScanStorageResponse)))).toStrictEqual(scanStorageResponse);
});