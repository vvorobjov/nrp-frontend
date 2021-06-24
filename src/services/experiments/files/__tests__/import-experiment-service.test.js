/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import ImportExperimentService from '../import-experiment-service';
import MockEvent from '../../../../mocks/mock-event'
import MockResponse from '../../../../mocks/mock-response'
import MockResponses from '../../../../mocks/mock-responses'

test('makes sure that invoking the constructor fails with the right message', () => {
  expect(() => {
    new ImportExperimentService();
  }).toThrow(Error);
  expect(() => {
    new ImportExperimentService();
  }).toThrowError(Error('Use ImportExperimentService.instance'));
});

