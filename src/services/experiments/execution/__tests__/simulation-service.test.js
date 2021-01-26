/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

afterEach(() => {
  jest.restoreAllMocks();
});

test('fetches the list of experiments', async () => {
});