import { rest } from 'msw';

import config from '../config.json';
import endpoints from '../services/proxy/data/endpoints';
import MockExperiments from './mock_experiments.json';
import MockAvailableServers from './mock_available-servers.json';

const availableServers = MockAvailableServers;
const experiments = MockExperiments;

export const handlers = [
  rest.get(`${config.api.proxy.url}${endpoints.proxy.storage.experiments.url}`, (req, res, ctx) => {
    return res(
      ctx.json(experiments)
    );
  }),
  rest.get(`${config.api.proxy.url}${endpoints.proxy.availableServers.url}`, (req, res, ctx) => {
    return res(
      ctx.json(availableServers)
    );
  })
];