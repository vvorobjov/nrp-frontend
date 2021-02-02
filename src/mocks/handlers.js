import { rest } from 'msw';

import config from '../config.json';
import endpoints from '../services/proxy/data/endpoints';
import MockExperiments from './mock_experiments.json';
import MockAvailableServers from './mock_available-servers.json';
import MockSimulationResources from './mock_simulation-resources.json';
import MockServerConfig from './mock_server-config.json';
import MockUsers from './mock_users.json';
import MockSimulations from './mock_simulations.json';
import MockUserGroups from './mock_user-groups.json';

import ImageAI from '../assets/images/Artificial_Intelligence_2.jpg';

const availableServers = MockAvailableServers;
const experiments = MockExperiments;

export const handlers = [
  rest.get(`${config.api.proxy.url}${endpoints.proxy.storage.experiments.url}`, (req, res, ctx) => {
    return res(ctx.json(experiments));
  }),
  rest.get(`${config.api.proxy.url}${endpoints.proxy.availableServers.url}`, (req, res, ctx) => {
    return res(ctx.json(availableServers));
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
  }),
  rest.get('http://:serverIP/simulation/', (req, res, ctx) => {
    return res(ctx.json(MockSimulations[0]));
  }),
  rest.get(`${config.api.proxy.url}${endpoints.proxy.server.url}/:serverID`, (req, res, ctx) => {
    return res(ctx.json(MockServerConfig));
  }),
  rest.get(`${config.api.proxy.url}${endpoints.proxy.identity.me.url}`, (req, res, ctx) => {
    return res(ctx.json(MockUsers[0]));
  }),
  rest.get(`${config.api.proxy.url}${endpoints.proxy.identity.me.groups.url}`, (req, res, ctx) => {
    return res(ctx.json(MockUserGroups));
  }),
  rest.get(`${config.api.proxy.url}${endpoints.proxy.identity.url}/:userID`, (req, res, ctx) => {
    return res(ctx.json(MockUsers[1]));
  })
];