// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';
import 'jest-localstorage-mock';
import { server } from './mocks/server';


beforeAll(() => {
  // Enable the mocking in tests.
  server.listen();
  jest.mock('./services/authentication-service.js');
});

afterEach(() => {
  // Reset any runtime handlers tests may use.
  server.resetHandlers();
  jest.restoreAllMocks();
});

afterAll(() => {
  // Clean up once the tests are done.
  server.close();
});