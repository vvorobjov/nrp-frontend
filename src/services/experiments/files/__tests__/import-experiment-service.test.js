/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import ImportExperimentService from '../import-experiment-service';

import MockScanStorageResponse from '../../../../mocks/mock_scan_storage_response.json';
import MockZipResponses from '../../../../mocks/mock_zip_responses.json';

describe('ImportExperimentService', () => {

  test('makes sure that invoking the constructor fails with the right message', () => {
    expect(() => {
      new ImportExperimentService();
    }).toThrow(Error);
    expect(() => {
      new ImportExperimentService();
    }).toThrowError(Error('Use ImportExperimentService.instance'));
  });

  test('makes sure zip responses are encapsulated in an object', async () => {
    // EBR2-108: getImportZipResponses now also collects newExpName (from each
    // response's newName). The mock responses omit newName, so those entries are
    // undefined, but the key is present in the returned object.
    let importZipResponses = {
      zipBaseFolderName: ['0', '0'],
      destFolderName: ['1', '2'],
      newExpName: [undefined, undefined],
      numberOfZips: 2
    };
    expect(await ImportExperimentService.instance.getImportZipResponses(
      MockZipResponses.map((response) => new Response(JSON.stringify(response))))).toStrictEqual(importZipResponses);
  });

  test('makes sure storage response is prepared', async () => {
    let scanStorageResponse = {deletedFoldersNumber:2, addedFoldersNumber:1, deletedFolders:'0, 1', addedFolders:'2' };
    expect(await ImportExperimentService.instance.getScanStorageResponse(
      new Response(JSON.stringify(MockScanStorageResponse)))).toStrictEqual(scanStorageResponse);
  });
});

// EBR2-108: getImportZipResponses used `await responses.forEach(async ...)`,
// which awaits forEach's undefined return, so the arrays were still empty when
// returned and the confirmation dialog showed blank names.
describe('ImportExperimentService.getImportZipResponses (EBR2-108)', () => {
  test('surfaces the real file names in order without blanks', async () => {
    const raw = [
      { zipBaseFolderName: 'exp_a', destFolderName: 'dest_a', newName: 'Imported A' },
      { zipBaseFolderName: 'exp_b', destFolderName: 'dest_b', newName: 'Imported B' }
    ];
    const responses = raw.map((r) => new Response(JSON.stringify(r)));

    const result = await ImportExperimentService.instance.getImportZipResponses(responses);

    expect(result.numberOfZips).toBe(2);
    expect(result.zipBaseFolderName).toEqual(['exp_a', 'exp_b']);
    expect(result.destFolderName).toEqual(['dest_a', 'dest_b']);
    expect(result.newExpName).toEqual(['Imported A', 'Imported B']);
  });
});
