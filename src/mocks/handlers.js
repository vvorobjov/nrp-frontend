import { rest } from 'msw';

import config from '../config.json';
import endpoints from '../services/proxy/data/endpoints';
import MockExperiments from './mock_experiments.json';
import MockAvailableServers from './mock_available-servers.json';
import MockSimulationResources from './mock_simulation-resources.json';

import ImageAI from '../assets/images/Artificial_Intelligence_2.jpg';

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
  }),
  rest.get(`${config.api.proxy.url}${endpoints.proxy.storage.url}/:experimentName/:thumbnailFilename`,
    (req, res, ctx) => {
      return res(ctx.body(ImageAI));
    }
  ),
  rest.get('http://:serverIP/simulation/:simulationID/resources', (req, res, ctx) => {
    const simulationID = parseInt(req.params.simulationID);
    if (simulationID === 1) {
      return res(ctx.json(MockSimulationResources));
    }
    else {
      throw new Error('Simulation resource error');
    }
  })
];