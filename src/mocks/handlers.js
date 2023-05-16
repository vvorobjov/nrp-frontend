import { rest } from 'msw';

import endpoints from '../services/proxy/data/endpoints';
import MockExperiments from './mock_experiments.json';
import MockAvailableServers from './mock_available-servers.json';
import MockSimulationResources from './mock_simulation-resources.json';
import MockServerConfig from './mock_server-config.json';
import MockUsers from './mock_users.json';
import MockSimulations from './mock_simulations.json';
import MockUserGroups from './mock_user-groups.json';
import MockGDPR from './mock_gdpr.json';
import MockModels from './mock_models.json';
import MockCustomModels from './mock_custom_models.json';

import ImageAI from '../assets/images/Artificial_Intelligence_2.jpg';

const availableServers = MockAvailableServers;
const experiments = MockExperiments;

import '../../public/config'
const config = window.appConfig;

const PROXY_URL = config.api.proxy.url;

export const handlers = [
  // proxy/(storage) mocks
  rest.get(`${PROXY_URL}${endpoints.proxy.storage.allCustomModels.url}/:modelType`,
    (req, res, ctx) => {
      return res(ctx.json(MockCustomModels[0]));
    }),
  rest.get(`${PROXY_URL}${endpoints.proxy.storage.userModels.url}/:modelType`,
    (req, res, ctx) => {
      return res(ctx.json(MockCustomModels[0]));
    }),
  rest.delete(`${PROXY_URL}${endpoints.proxy.storage.userModels.url}/:modelType/:modelName`,
    (req, res, ctx) => {
      return res(ctx.json(MockCustomModels[1]));
    }),
  rest.get(`${PROXY_URL}${endpoints.proxy.storage.experiments.url}`, (req, res, ctx) => {
    return res(ctx.json(experiments));
  }),
  rest.get(`${PROXY_URL}${endpoints.proxy.experiments.url}`, (req, res, ctx) => {
    return res(ctx.json(experiments));
  }),
  rest.post(`${PROXY_URL}${endpoints.proxy.storage.clone.url}/:experimentName`,
    (req, res, ctx) => {
      return res(ctx.json({ 'status': 'success' }));
    }),
  // proxy/storage/:experimentName mocks
  rest.get(`${PROXY_URL}${endpoints.proxy.storage.url}/:experimentName/:thumbnailFilename`,
    (req, res, ctx) => {
      return res(ctx.body(ImageAI));
    }
  ),
  rest.get(`${PROXY_URL}${endpoints.proxy.storage.url}/:experimentName`,
    (req, res, ctx) => {
      return res(ctx.json({ 'description': 'fileList' }));
    }),
  rest.delete(`${PROXY_URL}${endpoints.proxy.storage.url}/:experimentName`,
    (req, res, ctx) => {
      return res(ctx.json({ 'status': 'success' }));
    }),
  rest.delete(`${PROXY_URL}${endpoints.proxy.storage.url}/:experimentName/:filename`,
    (req, res, ctx) => {
      return res(ctx.json({ 'status': 'success' }));
    }),
  rest.post(`${PROXY_URL}${endpoints.proxy.storage.url}/:experimentName/:filename`,
    (req, res, ctx) => {
      return res(ctx.json({ 'type': req.headers.get('content-type') }));
      // return res(ctx.json({ 'type': req.headers.get('content-type') }));
    }),
  rest.get(`${PROXY_URL}${endpoints.proxy.availableServers.url}`, (req, res, ctx) => {
    return res(ctx.json(availableServers));
  }),
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
  rest.get(`${PROXY_URL}${endpoints.proxy.server.url}/:serverID`, (req, res, ctx) => {
    return res(ctx.json(MockServerConfig));
  }),
  rest.get(`${PROXY_URL}${endpoints.proxy.identity.me.url}`, (req, res, ctx) => {
    return res(ctx.json(MockUsers[0]));
  }),
  rest.get(`${PROXY_URL}${endpoints.proxy.identity.me.groups.url}`, (req, res, ctx) => {
    return res(ctx.json(MockUserGroups));
  }),
  rest.get(`${PROXY_URL}${endpoints.proxy.identity.url}${endpoints.proxy.identity.gdpr.url}`,
    (req, res, ctx) => {
      return res(ctx.json(MockGDPR));
    }),
  rest.get(`${PROXY_URL}${endpoints.proxy.identity.url}/:userID`, (req, res, ctx) => {
    return res(ctx.json(MockUsers[1]));
  }),
  rest.post(`${PROXY_URL}${endpoints.proxy.identity.url}${endpoints.proxy.identity.gdpr.url}`,
    (req, res, ctx) => {
      return res(ctx.json({ 'status': 'success' }));
    }),
  rest.get(`${PROXY_URL}${endpoints.proxy.models.url}/:modelType`,
    (req, res, ctx) => {
      return res(ctx.json(MockModels[0]));
    }),
  rest.post(`${PROXY_URL}${endpoints.proxy.models.url}/:modelType/:modelName`,
    (req, res, ctx) => {
      return res(ctx.json(MockCustomModels[2]));
    }),

];