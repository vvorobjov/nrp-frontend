// Runs before the test framework in every jsdom test file (Jest `setupFiles`).
// The jsdom environment does not expose fetch / Response / Headers / Request
// nor the Text{En,De}coder globals. The old react-scripts test runner injected
// equivalents; provide them here for the standalone Jest setup. Individual
// tests that import 'jest-fetch-mock' still override fetch afterwards.
const { TextEncoder, TextDecoder } = require('util');

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

require('cross-fetch/polyfill');
